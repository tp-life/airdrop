package entities

import "time"

type N1 struct {
	CommonAccount
	Addr             string
	PK               string
	ReferralCode     string
	ReferralLocked   *time.Time
	FromReferralCode string
	ReferralTotal    int `gorm:"default:0"`
	Points           int `gorm:"default:0"`
	Rank             int `gorm:"default:0"`
	Faucet           *time.Time
	Usdc             int `gorm:"default:0"`
	DaliyAt          *time.Time
	UserID           int
	Amt              float64 `gorm:"default:0"`
	ReferralFlag     bool    `gorm:"default:0"`
	XToken           string  `gorm:"default:''"`
}

func (*N1) TableName() string {
	return "n1"
}
