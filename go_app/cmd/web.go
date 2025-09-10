package cmd

import (
	"airdrop/go_app/http"
	"fmt"
	_ "net/http/pprof"

	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
)

var webPort string

func init() {
	rootCmd.AddCommand(webCmd)
	webCmd.Flags().StringVarP(&webPort, "port", "p", "", "监听的端口")
}

var webCmd = &cobra.Command{
	Use:   "web",
	Short: "WEB API 服务",
	Run: func(cmd *cobra.Command, args []string) {
		if webPort == "" {
			fmt.Println("请使用 --port(-p) 指明要监听的端口")
			return
		}
		r := gin.Default()

		// 银河
		http.Register(r)

		r.Run("0.0.0.0:" + webPort)
	},
}
