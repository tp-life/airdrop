package http

import (
	"log"
	"time"

	"github.com/go-resty/resty/v2"
)

// Config 自定义配置项
type Config struct {
	Proxy       string
	Timeout     time.Duration
	Retries     int
	RetryWait   time.Duration
	Headers     map[string]string
	EnableDebug bool
	EnableLog   bool
}

type Client struct {
	resty *resty.Client
}

// NewClient 初始化客户端
func NewClient(cfg Config) *Client {
	r := resty.New()

	// 通用配置
	r.SetTimeout(cfg.Timeout).
		SetRetryCount(cfg.Retries).
		SetRetryWaitTime(cfg.RetryWait).
		SetHeaders(cfg.Headers).
		SetContentLength(true). // 避免 chunked 请求
		SetAllowGetMethodPayload(true).
		SetRedirectPolicy(resty.FlexibleRedirectPolicy(5))

	// 自动解压 gzip
	r.SetHeader("Accept-Encoding", "gzip")

	// 设置代理
	if cfg.Proxy != "" {
		r.SetProxy(cfg.Proxy)
	}

	// 开启 Cookie 支持
	r.SetCookieJar(nil) // 默认会使用 http.DefaultCookieJar

	// 调试日志
	if cfg.EnableDebug {
		r.SetDebug(true)
	}

	// 请求日志中间件（含耗时）
	if cfg.EnableLog {
		r.OnBeforeRequest(func(c *resty.Client, req *resty.Request) error {
			log.Printf("→ %s %s", req.Method, req.URL)
			return nil
		})
		r.OnAfterResponse(func(c *resty.Client, resp *resty.Response) error {
			start, _ := resp.Request.Context().Value("startTime").(time.Time)
			duration := time.Since(start)
			log.Printf("← %s %s | %d | %s", resp.Request.Method, resp.Request.URL, resp.StatusCode(), duration)
			return nil
		})
	}

	// 示例：自定义签名 Hook（根据需要替换）
	r.OnBeforeRequest(func(c *resty.Client, req *resty.Request) error {
		return nil
	})

	return &Client{resty: r}
}

// Get 请求
func (c *Client) Get(url string, query map[string]string) (*resty.Response, error) {
	return c.resty.R().
		SetQueryParams(query).
		Get(url)
}

// PostJSON 请求
func (c *Client) PostJSON(url string, body interface{}) (*resty.Response, error) {
	return c.resty.R().
		SetHeader("Content-Type", "application/json").
		SetBody(body).
		Post(url)
}

// PostForm 请求
func (c *Client) PostForm(url string, form map[string]string) (*resty.Response, error) {
	return c.resty.R().
		SetHeader("Content-Type", "application/x-www-form-urlencoded").
		SetFormData(form).
		Post(url)
}

// DownloadFile 下载文件到本地
func (c *Client) DownloadFile(url string, savePath string) error {
	_, err := c.resty.R().
		SetOutput(savePath).
		Get(url)
	return err
}

// UploadFile 上传文件（multipart/form-data）
func (c *Client) UploadFile(url, fieldName, filePath string, extra map[string]string) (*resty.Response, error) {
	req := c.resty.R().
		SetFile(fieldName, filePath).
		SetFormData(extra)
	return req.Post(url)
}
