package utils

import (
	"fmt"
	"net/url"
	"regexp"
	"testing"
)

func TestCustomReceiveEmail(t *testing.T) {

	u, _ := url.Parse("http://www.twitter.com/")
	fmt.Println(u.Hostname(), u.Scheme, u.User)

	tests := []struct {
		name string
	}{
		{
			name: "TestReceiveEmail",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			items, err := NewEmailService("imap.gmx.com:993", "helen_qb0r6_7@gmx.com", "max8u91557ap7").ReceiveEmail(EmailSearch{
				Select: []string{"INBOX", "Spam"},
				// To:     "promanatee@myvideos.online",
				// From: "no-reply@legend.xyz",
				// Num: 1,
				// Text:   "Microsoft 帐户安全代码",
			})

			if len(items) == 0 {
				return
			}

			fmt.Println(items[0].Content, err)
			// 定义验证码提取的正则表达式
			re := regexp.MustCompile(`(?i)<a[^>]*\bhref\s*=\s*["']([^"']*waitlist_confirmation[^"']*)["']`)

			// 在文本中查找匹配的内容
			matches := re.FindStringSubmatch(items[0].Content)

			// 如果找到匹配的内容
			if len(matches) > 1 {
				// 提取验证码
				fmt.Println(matches[1])

			}
		})
	}

}
