package services

import (
	"airdrop/go_app/entities"
	"airdrop/go_app/initialize"
	"airdrop/go_app/instance"
	"airdrop/go_app/interfaces"
	"airdrop/go_app/utils/wallet"
	"strconv"
	"strings"

	"github.com/tp-life/utils/logx"
)

type WalletType string

const (
	EVM WalletType = "evm"
	SOL WalletType = "sol"
	SUI WalletType = "sui"
)

func init() {
	initialize.Register("wallet", func() interfaces.Project { return NewWalletManage() })
}

type WalletManage struct {
	BaseProject
	num int
}

func NewWalletManage() *WalletManage {
	return &WalletManage{
		num: 1000,
	}
}

func (wm *WalletManage) Run() {

	filterArgs := strings.ReplaceAll(wm.Args, " ", ",")
	args := strings.Split(filterArgs, ",")

	_new := []string{}
	for _, v := range args {
		if v == "" {
			continue
		}
		_new = append(_new, v)
	}
	if len(_new) == 0 {
		logx.Infof("未指定需要生成的地址类型，目前支持的类型有：%s ", strings.Join([]string{string(EVM), string(SOL), string(SUI)}, ","))
	}
	num := wm.num
	if len(_new) > 1 {
		n, _ := strconv.Atoi(_new[1])
		if n > 0 {
			num = n
		}
	}

	switch WalletType(_new[0]) {
	case EVM:
		wm.GenEVM(num)
	}
}

func (wm *WalletManage) GenEVM(num int) error {

	var data []*entities.Wallet

	for len(data) < num {
		addr, pk, err := wallet.NewEVM().GenEvmAddr()
		if err != nil {
			continue
		}
		data = append(data, &entities.Wallet{
			Addr: addr,
			PK:   pk,
			Kind: string(EVM),
		})
	}
	if err := instance.DB().CreateInBatches(data, 500).Error; err != nil {
		logx.Error("插入evm 地址失败", err)
		return err
	}
	return nil
}
