package services

import (
	"airdrop/go_app/entities"
	"airdrop/go_app/instance"
	"airdrop/go_app/utils/utils"
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/viper"
	"github.com/tp-life/utils/logx"
)

type BaseProject struct {
	Args string
}

func (bp *BaseProject) SetParam(arg string) {
	bp.Args = arg
}

func (bp *BaseProject) Run() {}

type TaskParams struct {
	Sql       string
	Args      []any
	TaskParam entities.TaskParams
	Area      string
}

func GetTask[T entities.ITaskAccount](params TaskParams) (task T, ip string, err error) {
	task, err = entities.GetTask[T](params.Sql, params.Args, params.TaskParam)
	if err != nil {
		logx.Error("query TaskParam error:", err)
		return
	}

	setDoc := map[string]any{
		"sort": task.GetSort() + 1,
	}

	ip, port := GetIPAndPort(task.GetPort(), params.Area)
	if port != task.GetPort() {
		setDoc["port"] = port
	}
	task.SetIP(ip)
	task.SetPort(port)

	if len(setDoc) > 0 {
		instance.DB().Model(task).UpdateColumns(setDoc)
	}

	return
}

func GetIPAndPort(p int, area string, testURL ...string) (ip string, port int) {

	_proxy := viper.GetString("common.proxy")
	if viper.GetString("common.mode") == "dev" && _proxy != "" {
		return _proxy, 0
	}

	_url := ""
	if len(testURL) > 0 {
		_url = testURL[0]
	}

	ip, port = GetPoolIP(p, _url)
	if ip != "" {
		return
	}

	proxy := utils.BestRandIP(10, area, utils.BestRandIPOption{
		HoldPort:          p,
		HoldPortPingTries: 3,
		Timeout:           time.Second * 2,
		TestURL:           _url,
	})

	// proxy.Port = 27501
	return fmt.Sprintf("http://%s:%d", proxy.Host, proxy.Port), proxy.Port
}

func GetRandOneIP() {
	ctx := context.Background()
	proxy := utils.RandIPV2(ctx, "", utils.RandIPOption{Timeout: time.Second * 2})
	if proxy.Error.Code == 0 {
	}
}

func GetPoolIP(p int, testURL string) (ip string, port int) {
	if !viper.GetBool("common.usePool") {
		return
	}

	proxyPool := viper.GetStringSlice("common.proxyPool")
	if len(proxyPool) == 0 {
		return
	}
	ips := make([]string, 0, len(proxyPool))
	for _, v := range proxyPool {
		pe := strings.Split(v, ":")
		if len(pe) > 2 {
			if strings.Contains(pe[len(pe)-1], "-") {
				ports := strings.Split(pe[len(pe)-1], "-")
				p, _ = strconv.Atoi(ports[0])
				port, _ := strconv.Atoi(ports[1])
				for i := p; i <= port; i++ {
					ips = append(ips, fmt.Sprintf("%s:%s:%d", pe[0], pe[1], i))
				}
				continue
			}
		}

		ips = append(ips, v)

	}
	if err := utils.RetryFunc(func() error {
		ip = utils.GetRandItem(ips)
		port, _ = strconv.Atoi(strings.SplitAfter(ip, ":")[0])
		if !utils.PingIP(ip, utils.PingIPOption{Timeout: time.Second * 2, TestURL: testURL}) {
			return errors.New(ip + "ip ping failed")
		}
		return nil
	}, len(ips)); err != nil {
		return "", 0
	}
	return
}
