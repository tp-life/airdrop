package entities

import "gorm.io/gorm"

type Wallet struct {
	gorm.Model
	Addr     string `gorm:"unique"`
	PK       string
	Mnemonic string
	Kind     string
	Amount   float64
}

func (*Wallet) TableName() string {
	return "wallet"
}
