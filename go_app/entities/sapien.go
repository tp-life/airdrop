package entities

import "time"

type Sapien struct {
	CommonAccount
	XToken        string
	DCToken       string
	Points        float64   `gorm:"default:0"`
	UnderPoints   float64   `gorm:"default:0"`
	DailyAt       time.Time `gorm:"index"`
	IsBindSocial  bool      `gorm:"default:false"`
	Email         string
	EmailPassword string
}

func (*Sapien) TableName() string {
	return "sapien"
}
