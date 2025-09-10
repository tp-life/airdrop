package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/samber/lo"
	"github.com/tp-life/utils/logx"
	"go.uber.org/zap"
)

type RandIPOption struct {
	Timeout    time.Duration
	TestURL    string
	TestIpFunc func(string) bool // 用户测试IP是否可用

}
type BestRandIPOption struct {
	HoldPort          int           // 尝试优先使用此端口,如果此端口不可用再随机使用其它端口
	HoldPortPingTries int           // 尝试优先使用端口时, Ping 失败时的重试次数
	Timeout           time.Duration // 只返回延迟低于此时间的
	TestURL           string
	TestIpFunc        func(string) bool // 用户测试IP是否可用
}

// BestRandIP 并发的获取代理IP
func BestRandIP(concurrency int, area string, opts ...BestRandIPOption) RandIPResp {
	opt := BestRandIPOption{}
	if len(opts) == 1 {
		opt = opts[0]
	}
	resp := RandIPResp{}
	resp.Error.Code = 500
	resp.Error.Message = "获取IP失败"

	if area == "" {
		argArea := strings.Split(os.Getenv("IP_AREA"), ",")
		if len(argArea) > 0 {
			area = lo.Sample(argArea)
		}
	}

	ch := make(chan RandIPResp, concurrency)

	ctx, cancel := context.WithCancel(context.Background())

	for i := 0; i < concurrency; i++ {
		go func() {
			res := RandIPV2(ctx, area, RandIPOption{Timeout: opt.Timeout, TestURL: opt.TestURL, TestIpFunc: opt.TestIpFunc})
			if res.Error.Code == 0 {
				ch <- res
			}
		}()
	}

	_rsSlice := make([]RandIPResp, 0, concurrency)

	ts := time.NewTimer(time.Second * 30)

outLoopLabel:
	for {
		select {
		case r := <-ch:
			_rsSlice = append(_rsSlice, r)
			if len(_rsSlice) >= concurrency/2 {
				break outLoopLabel
			}
		case <-ts.C:
			break outLoopLabel
		}
	}

	cancel()

	sort.Slice(_rsSlice, func(i, j int) bool {
		return _rsSlice[i].Latency < _rsSlice[j].Latency
	})
	if len(_rsSlice) > 0 {
		resp = _rsSlice[0]
	}

	if resp.Error.Code > 0 {
		return resp
	}

	if opt.HoldPortPingTries == 0 {
		opt.HoldPortPingTries = 1
	}
	if opt.HoldPort > 0 {
		t1 := time.Now()
		if PingIP(fmt.Sprintf("%s:%d", resp.Host, opt.HoldPort), PingIPOption{Tries: opt.HoldPortPingTries, Timeout: opt.Timeout, TestURL: opt.TestURL}) {
			resp.Port = opt.HoldPort
		}
		t2 := time.Now()
		resp.Latency = t2.Sub(t1)
		logx.Debugf(`获取到代理[%s:%d,flag:%s]请求成功,耗时:%s`, resp.Host, opt.HoldPort, resp.Flag, t2.Sub(t1).String())
	}

	return resp
}

func RandIPV2(ctx context.Context, area string, opts ...RandIPOption) RandIPResp {

	var resp RandIPResp
	opt := RandIPOption{}
	if len(opts) == 1 {
		opt = opts[0]
	}
	resp.Error.Code = 500
	resp.Error.Message = "获取IP失败"

outLabel:
	for i := 0; i < 200; i++ {
		select {
		case <-ctx.Done():
			logx.Debugf(`第[%d]次获取IP前收到退出信号,退出 🚪`, i+1)
			break outLabel
		default:
			res := doRandIP(area)
			if res.Error.Code > 0 || res.Error.Message != "" {
				continue
			}
			t1 := time.Now()
			if !PingIP(fmt.Sprintf("%s:%d", res.Host, res.Port), PingIPOption{Timeout: opt.Timeout, TestURL: opt.TestURL, TestIpFunc: opt.TestIpFunc}) {
				continue
			}
			t2 := time.Now()
			res.Latency = t2.Sub(t1)
			logx.Debugf(`第[%d]次获取到代理[%s:%d,flag:%s]请求成功,耗时:%s`, i+1, res.Host, res.Port, res.Flag, t2.Sub(t1).String())
			return res
		}
	}

	return resp
}

type PingIPOption struct {
	Tries      int // 重试次数
	Timeout    time.Duration
	TestURL    string
	TestIpFunc func(string) bool // 用于测试IP是否可用
}

func PingIP(ip string, opts ...PingIPOption) bool {
	tries := 1
	timeout := time.Second * 5
	testUrl := `https://one.one.one.one`
	opt := PingIPOption{}
	if len(opts) > 0 {
		if v := opts[0].Timeout; v > 0 {
			timeout = v
		}
		if v := opts[0].Tries; v > 0 {
			tries = v
		}

		if v := opts[0].TestURL; v != "" {
			testUrl = v
		}
		opt = opts[0]
	}
	for n := 0; n < tries; n++ {
		cli := http.Client{}
		_ip := ip
		if !strings.Contains(_ip, "http") {
			_ip = fmt.Sprintf("http://%s", ip)
		}

		proxyURL, err := url.Parse(_ip)
		if err != nil {
			fmt.Println("Error parsing proxy URL:", err)
			return false
		}

		cli.Transport = &http.Transport{
			Proxy: http.ProxyURL(proxyURL),
		}
		cli.Timeout = timeout

		req, _ := http.NewRequest(http.MethodGet, testUrl, nil)
		if rs, err := cli.Do(req); err != nil {
			// logx.Sugar().Debugf(`代理[%s]测试失败:%s`, ip, err.Error())
			time.Sleep(time.Millisecond * 500)
		} else {
			if opt.TestIpFunc != nil {
				cn, _ := io.ReadAll(rs.Body)
				logx.Debugf(`代理[%s]测试成功`, ip, string(cn))
				return opt.TestIpFunc(string(cn))
			}

			return true
		}
	}
	return false
}

func doRandIP(area string) RandIPResp {

	errResp := RandIPResp{}
	errResp.Error.Code = 500
	errResp.Error.Message = "获取IP失败"
	resp, err := http.Get("http://a9api.theprivate.store:1688/rand-ip?area=" + area)
	if err != nil {
		logx.Error("RandIP() 获取代理失败", zap.Error(err))
		return errResp
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		logx.Error("RandIP() 读取响应失败", zap.Error(err))
		return errResp
	}
	res := RandIPResp{}
	if err := json.Unmarshal(data, &res); err != nil {
		logx.Error("RandIP() json.Unmarshal() failed", zap.Error(err))
		fmt.Println("获取到代理信息:", string(data))
		return errResp
	}
	errResp.Error.Code = 0
	errResp.Error.Message = ""
	return res
}

type RandIPResp struct {
	Error struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
	Flag    string `json:"flag"`
	Host    string `json:"host"`
	Port    int    `json:"port"`
	Memo    string `json:"memo"`
	Latency time.Duration
}
