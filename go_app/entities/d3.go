package entities

import "time"

type D3 struct {
	CommonAccount
	Addr             string
	PK               string
	Email            string
	EmailPass        string
	ReferralCode     string
	ReferralLocked   *time.Time
	FromReferralCode string
	ReferralTotal    int `gorm:"default:0"`
	Domain           string
	IsRegistered     bool    `gorm:"default:false"`
	Amt              float64 `gorm:"default:0"`
}

func (*D3) TableName() string {
	return "d3"
}
