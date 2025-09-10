package utils

import (
	"context"
	"errors"
	"fmt"
	"os"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

type ExpireLock struct {
	// 核心锁
	mutex sync.Mutex
	// 流程锁，防止多次解锁，例如异步解锁协程解锁和手动解锁同时发生
	processMutex sync.Mutex
	// 锁的身份标识
	token string
	// 停止异步解锁协程函数
	stop context.CancelFunc
}

func NewExpireLock() *ExpireLock {
	return &ExpireLock{}
}

// Lock 加锁
func (e *ExpireLock) Lock(expireTime int64, actionTimeout func()) {
	// 1. 加锁
	e.mutex.Lock()
	// 2，设置锁的身份标识token
	token := GetProcessAndGoroutineIDStr()
	e.token = token

	// 2.1 校验一下过期时间，如果小于等于0，就代表手动释放锁，无需开启异步解锁协程
	if expireTime <= 0 {
		return
	}

	// 3.给终止异步协程函数stop赋值，启动异步协程，达到指定时间后执行解锁操作
	ctx, cancel := context.WithCancel(context.Background())
	e.stop = cancel
	go func() {
		select {
		// 到了锁的过期时间，释放锁
		case <-time.After(time.Duration(expireTime) * time.Second):
			e.unlock(token)
			actionTimeout()
		case <-ctx.Done():
		}
	}()
}

// Unlock 解锁
func (e *ExpireLock) Unlock() error {
	return e.unlock(GetProcessAndGoroutineIDStr())
}

func (e *ExpireLock) unlock(token string) error {
	// 1.加流程锁，防止并发情况下，异步解锁协程解锁和手动解锁同时发生
	e.processMutex.Lock()
	defer e.processMutex.Unlock()

	// 2.校验token
	if e.token != token {
		return errors.New("unlock not your lock")
	}

	// 3.停止异步解锁协程
	if e.stop != nil {
		e.stop()
	}

	// 4.重置token
	e.token = ""

	// 5.解锁
	e.mutex.Unlock()

	return nil
}

func GetCurrentProcessID() string {
	return strconv.Itoa(os.Getpid())
}

// GetCurrentGoroutineID 获取当前的协程ID
func GetCurrentGoroutineID() string {
	buf := make([]byte, 128)
	buf = buf[:runtime.Stack(buf, false)]
	stackInfo := string(buf)
	return strings.TrimSpace(strings.Split(strings.Split(stackInfo, "[running]")[0], "goroutine")[1])
}

func GetProcessAndGoroutineIDStr() string {
	return fmt.Sprintf("%s_%s", GetCurrentProcessID(), GetCurrentGoroutineID())
}
