package services

import (
	"airdrop/go_app/instance"
	"sync/atomic"
	"time"

	"github.com/spf13/viper"
	"github.com/tp-life/utils/logx"
	"github.com/tp-life/utils/threading"
)

type TaskRunnerOpt struct {
	Num      int
	Internal time.Duration
	Once     bool
}

type TaskRunner struct {
	params TaskRunnerOpt
	end    bool
}

func NewTask(opt TaskRunnerOpt) *TaskRunner {
	if opt.Num == 0 {
		opt.Num = viper.GetInt("common.concurrency")
	}

	if opt.Num == 0 {
		opt.Num = 1
	}
	if opt.Internal == 0 {
		opt.Internal = time.Second * 3
	}

	tk := &TaskRunner{
		params: opt,
	}

	tk.Init()

	return tk
}

func (tr *TaskRunner) Init() {
	instance.DB()
}

func (tr *TaskRunner) Close() {
	tr.end = true
}

func (tr *TaskRunner) Runner(runner func()) {
	if tr.params.Num > 512 || tr.params.Num < 1 {
		logx.Error("最大并发数量不合法")
		return
	}

	// 空投任务
	tasks := make(chan struct{}, tr.params.Num)
	var i int64
	for {
		tasks <- struct{}{}
		if tr.params.Once && atomic.LoadInt64(&i) >= 1 {
			break
		}

		if tr.end {
			break
		}

		threading.GoSafe(func() {
			defer func() {
				<-tasks
			}()
			runner()
			if tr.params.Once {
				atomic.AddInt64(&i, 1)
			}
		})
		// 每个任务执行间隔
		time.Sleep(tr.params.Internal)
	}

	close(tasks)
	// 等待已有任务执行结束
	for range tasks {
		time.Sleep(tr.params.Internal)
	}

}
