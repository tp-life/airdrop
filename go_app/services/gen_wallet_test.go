package services

import (
	"airdrop/go_app/entities"
	"airdrop/go_app/initialize"
	"airdrop/go_app/instance"
	"airdrop/go_app/utils/wallet"
	"fmt"
	"testing"

	"github.com/tp-life/utils/logx"
)

func TestN1(t *testing.T) {
	initialize.Viper()

	var data []*entities.Sepolia

	for i := 0; i < 4000; i++ {
		addr, pk, err := wallet.NewEVM().GenEvmAddr()
		if err != nil {
			logx.Error(err)
			continue
		}
		data = append(data, &entities.Sepolia{
			Address:    addr,
			PrivateKey: pk,
		})
	}

	if err := instance.DB().CreateInBatches(data, 500).Error; err != nil {
		logx.Error(err)
	}
	fmt.Println("完成")
}
