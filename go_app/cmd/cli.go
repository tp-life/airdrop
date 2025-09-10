package cmd

import (
	"airdrop/go_app/initialize"
	"airdrop/go_app/services"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/tp-life/utils/logx"
)

var (
	projectName string
	params      string
	once        bool
)

func init() {
	task.Flags().StringVarP(&projectName, "name", "n", "", "要运行的项目")
	task.Flags().StringVarP(&params, "args", "a", "", "要传递的参数")
	task.Flags().BoolVarP(&once, "once", "x", false, "是否只运行一次， 默认false；当为 true 时，只执行一次即退出")
	rootCmd.AddCommand(task)
}

var task = &cobra.Command{
	Use:   "cli",
	Short: "cli 任务",
	Run: func(cmd *cobra.Command, args []string) {
		concurrency := viper.GetInt("app.thread_num")
		if concurrency < 1 || concurrency > 200 {
			panic("未正确配置[app.thread_num],该配置取值范围:1-200")
		}
		project, ok := initialize.GetProject(projectName)
		if !ok {
			logx.Errorf("%s 项目不存在", projectName)
			os.Exit(1)
		}

		run := func() {
			fn := project()
			fn.SetParam(params)
			fn.Run()
		}

		services.NewTask(services.TaskRunnerOpt{
			Num:  concurrency,
			Once: once,
		}).Runner(run)
	},
}
