package t

import (
	"fmt"

	"github.com/ansiwen/gctx"
)

type LoggerTracker struct {
	ID       uint
	Name     string
	WorkerID int
}

func GetLoggerTracker() *LoggerTracker {
	ctx := gctx.Get()
	if ctx == nil {
		return nil
	}
	v := ctx.Value(LoggerTracker{})
	if s, ok := v.(*LoggerTracker); ok {
		return s
	}
	fmt.Printf("GetLoggerTracker() 不是 String 类型，，值:%#v\n", v)
	return nil
}
