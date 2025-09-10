package entities

import "time"

type Boundless struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Addr      string `gorm:"unique"`
	PK        string
}

func (*Boundless) TableName() string {
	return "beboundless"
}
