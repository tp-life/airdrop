package entities

import "time"

type Heilos struct {
	CommonAccount
	Addr             string
	PK               string
	IsRegister       bool `gorm:"default:0"`
	RegisterIP       string
	ReferralCode     string
	ReferralLocked   *time.Time
	FromReferralCode string
	ReferralToal     int `gorm:"default:0"`
	Points           int `gorm:"default:0"`
}

func (*Heilos) TableName() string {
	return "heilos"
}
