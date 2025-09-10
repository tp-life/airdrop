package entities

import "time"

type Spekter struct {
	CommonAccount
	Email     string
	EmailPass string
	Completed bool `gorm:"default:0"`
	XToken    string
	DcToken   string
	Points    int `gorm:"default:0"`
	DaliyAt   *time.Time
}

func (*Spekter) TableName() string {
	return "spekter"
}
