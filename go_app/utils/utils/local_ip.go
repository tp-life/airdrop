package utils

import (
	"fmt"
	"net"
	"strings"
)

func GetLocalIp() ([]net.IP, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		fmt.Println("获取网络接口失败:", err)
		return nil, err
	}
	ret := []net.IP{}
	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue // 过滤掉未激活的网络接口
		}
		addrs, err := iface.Addrs()
		if err != nil {
			fmt.Println("获取地址失败:", err)
			continue
		}
		for _, addr := range addrs {
			// 只处理 IPv4 地址
			if ipNet, ok := addr.(*net.IPNet); ok && ipNet.IP.To4() != nil {
				ret = append(ret, ipNet.IP)
				fmt.Println("局域网 IP 地址:", ipNet.IP.String())
			}
		}
	}
	return ret, nil
}

// 返回本机所有局域网IP的HASH值
func GetLocalAllIpHash() (string, error) {
	ips, err := GetLocalIp()
	if err != nil {
		return "", err
	}
	ret := []string{}
	for _, ip := range ips {
		tmp := strings.Split(ip.String(), ".")
		if len(tmp) == 4 {
			ret = append(ret, strings.Join(tmp[2:], "."))
		}
	}
	return strings.Join(ret, ","), nil
}
