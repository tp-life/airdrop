package entities

import "time"

type Enso struct {
	CommonAccount
	Addr            string
	PK              string
	Email           string
	EmailPass       string
	IsRegisterZealy bool
	IsBindZealy     bool `gorm:"default:0"`
	ZealyUserID     string
	ZealyCookies    string `gorm:"type:text"`
	Points          string
	Rank            int  `gorm:"default:0"`
	RunDex          bool `gorm:"default:0"`
	DaliyAt         *time.Time
}

func (*Enso) TableName() string {
	return "osne"
}
