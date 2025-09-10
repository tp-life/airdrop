package utils

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/textproto"
	"strings"
	"time"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
	"github.com/emersion/go-message/charset"
	"github.com/emersion/go-message/mail"
	"github.com/spf13/viper"
	"github.com/tp-life/utils/logx"
	"github.com/tp-life/utils/request"
)

type EmailSearch struct {
	Select     []string // 选择的邮箱 默认 INBOX
	From       string   // 发件人
	To         string
	IsUnReader bool   // 是否未读
	Num        int    // 邮件数量
	NoMakeRead bool   // 是否标记为已读， 默认为true
	Text       string // 关键字
	OnlyOne    bool   // 是否只获取一封
	EndTime    int64
}

type EmailSearchResult struct {
	Subject string
	Sender  string
	Content string
	Date    time.Time
}

type EmailService struct {
	Address string
	User    string
	Pass    string
}

func NewEmailService(address, user, pass string) *EmailService {
	return &EmailService{
		Address: address,
		User:    user,
		Pass:    pass,
	}
}

func (e *EmailService) EmailByAPI(params EmailSearch) (resp []*EmailSearchResult, err error) {
	ctx := context.TODO()

	if params.EndTime <= 0 {
		params.EndTime = time.Now().Add(-30 * time.Minute).Unix()
	}

	res, err := request.Post(ctx, viper.GetString("common.emailApi"), map[string]any{
		"host":       e.Address,
		"email":      e.User,
		"password":   e.Pass,
		"t":          params.EndTime,
		"folder":     strings.Join(params.Select, ","),
		"to_email":   params.To,
		"from_email": params.From,
	})
	if err != nil {
		logx.Error(err)
		return
	}

	if res.StatusCode() != http.StatusOK {
		return nil, err
	}

	var r struct {
		EmailContent []string `json:"email_content"`
	}

	if err = json.Unmarshal(res.Body(), &r); err != nil {
		logx.Error("解析邮件内容失败", err)
		return
	}

	for _, v := range r.EmailContent {
		resp = append(resp, &EmailSearchResult{
			Content: v,
		})
	}

	return
}

func (e *EmailService) Login(timeout ...time.Duration) (*client.Client, error) {
	var t time.Duration
	if len(timeout) > 0 {
		t = timeout[0]
	}
	dialer := new(net.Dialer)
	dialer.Timeout = t
	c, err := client.DialWithDialerTLS(dialer, e.Address, nil)
	if err != nil {
		logx.Error("dial error:", err)
		return nil, err
	}
	c.Timeout = t
	// 登录邮箱
	if err = c.Login(e.User, e.Pass); err != nil {
		logx.Error("login error:", err)
		return nil, err
	}
	return c, err
}

func (e *EmailService) OnlyLogin(timeout ...time.Duration) error {
	c, err := e.Login(timeout...)
	if err != nil {
		return err
	}
	c.Logout()
	return nil
}

func (e *EmailService) ReceiveEmail(
	params EmailSearch,
	timeout ...time.Duration,
) (resp []*EmailSearchResult, err error) {
	c, err := e.Login(timeout...)
	if err != nil {
		return nil, errors.Join(errors.New("EmailService.ReceiveEmail() 登录失败"), err)
	}
	defer c.Logout()
	if len(params.Select) == 0 {
		params.Select = []string{"INBOX"}
	}

	for _, name := range params.Select {
		signal, er := e.readEmail(c, name, params)
		if er != nil {
			return nil, er
		}
		resp = append(resp, signal...)
		if len(signal) > 0 && params.OnlyOne {
			break
		}
	}
	return
}

func (e *EmailService) readEmail(
	c *client.Client,
	name string,
	param EmailSearch,
) (resp []*EmailSearchResult, err error) {
	imap.CharsetReader = charset.Reader
	// // 选择收件箱
	mbox, err := c.Select(name, false)
	if err != nil {
		logx.Error("select error", err)
		return
	}

	from := uint32(1)
	to := mbox.Messages
	size := 50
	if param.Num > 0 {
		size = param.Num - 1
	}
	if mbox.Messages > uint32(size) {
		from = mbox.Messages - uint32(size)
	}

	// 获取符合条件的邮件
	seqset := new(imap.SeqSet)
	seqset.AddRange(from, to)

	cond := &imap.SearchCriteria{
		SeqNum: seqset,
	}

	if param.Text != "" {
		cond.Text = []string{param.Text}
	}

	if param.IsUnReader {
		cond.WithoutFlags = []string{imap.SeenFlag}
	}
	cond.Header = textproto.MIMEHeader{}
	if param.From != "" {
		cond.Header = textproto.MIMEHeader{
			"From": {param.From},
		}
	}

	if param.To != "" {
		cond.Header["To"] = []string{param.To}
	}

	searchSeq, err := c.Search(cond)
	if err != nil {
		logx.Error("Error occured while searching", err)
		return
	}
	if len(searchSeq) == 0 {
		logx.Info("No email found")
		return
	}

	// 遍历未读取的邮件
	for _, u := range searchSeq {
		seqSet := new(imap.SeqSet)
		seqSet.AddRange(u, u)
		// Get the whole message body
		var section imap.BodySectionName
		items := []imap.FetchItem{section.FetchItem()}
		// 读取邮件内容
		messages := make(chan *imap.Message, 1)
		go func() {
			defer func() {
				if err := recover(); err != nil {
					logx.Error("Error occured while fetching", err)
				}
			}()
			if err := c.Fetch(seqSet, items, messages); err != nil {
				logx.Error("Error occured while fetching", err)
				return
			}
		}()

		msg := <-messages
		if msg == nil {
			logx.Info("获取邮件失败，Server didn't returned message")
			break
		}

		r := msg.GetBody(&section)
		if r == nil {
			logx.Info("Server didn't returned message body")
			continue
		}

		// Create a new mail reader
		mr, err := mail.CreateReader(r)
		if err != nil {
			logx.Error("creating mail reader", err)
			return nil, err
		}

		result := &EmailSearchResult{}

		// Print some info about the message
		header := mr.Header
		if date, err := header.Date(); err == nil {
			result.Date = date
		}
		if from, err := header.AddressList("From"); err == nil {
			result.Sender = from[0].Address
		}

		if subject, err := header.Subject(); err == nil {
			result.Subject = subject
		}

		// 从mr中读取邮件信息
		for {
			// 读取邮件内容
			p, err := mr.NextPart()
			if err == io.EOF {
				break
			} else if err != nil {
				logx.Error("reading message error: ", err)
				return nil, err
			}
			switch p.Header.(type) {
			case *mail.InlineHeader:
				// 获取邮件的主体信息（可能是纯文本也可能是html）
				b, _ := io.ReadAll(p.Body)
				result.Content = string(b)
			}
		}
		if !param.NoMakeRead {
			// 标记邮件为已读
			flags := []interface{}{imap.SeenFlag}
			if err = c.Store(seqSet, imap.AddFlags, flags, nil); err != nil {
				logx.Error("标记为已读error", err)
				return nil, err
			}
		}

		resp = append(resp, result)
		if param.OnlyOne {
			break
		}
	}

	return
}
