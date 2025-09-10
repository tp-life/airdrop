package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	homedir "github.com/mitchellh/go-homedir"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/tp-life/utils/logx"

	"airdrop/go_app/initialize"
)

func init() {
	cobra.OnInitialize(initCfg)
}

func initCfg() {
	home, err := homedir.Dir()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println("home:", home)
	_ = home
}

var rootCmd = &cobra.Command{
	Use:   "airdrop",
	Short: "airdrop subcommand",
	Long:  ``,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("请指定要运行的子命令，或者使用 help 子命令查看帮助")
	},
}

func Execute() {
	var cfgFile string

	flag := rootCmd.PersistentFlags()

	flag.StringVar(&cfgFile, "config", filepath.Join(".", "config.toml"), "配置文件")

	initialize.Viper(cfgFile)

	mode := viper.GetString("common.mode")
	if mode != "dev" {
		logx.SetLevel(logx.InfoLevel)
	}

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
