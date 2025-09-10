package initialize

import (
	"fmt"
	"os"
	"path"
	"time"

	"github.com/spf13/viper"
)

func Viper(args ...string) {
	fmt.Println("传入args:", args)
	projectPath := os.Getenv("GO_PROJECT_PATH")
	if projectPath == "" {
		projectPath, _ = os.Getwd()
	}
	viper.AddConfigPath(projectPath)

	cfgPath := ""
	if len(args) > 0 {
		cfgPath = path.Join(projectPath, args[0])
		viper.SetConfigFile(cfgPath)
		fmt.Println("自定义的配置文件:", cfgPath)
	} else {
		cfgPath = path.Join(projectPath, "config.toml")
		viper.SetConfigFile(cfgPath)
		fmt.Println("默认配置文件:", cfgPath)
	}

	if err := viper.ReadInConfig(); err != nil {
		fmt.Println("注意！无法载入配置文件:", err.Error())
		time.Sleep(time.Second * 2)
		data, err := os.ReadFile(cfgPath)
		if err != nil {
			fmt.Println("读取配置文件出错:", err.Error())
		} else {
			fmt.Println("配置文件:\n", string(data))
		}
	}
}
