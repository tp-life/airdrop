package entities

import "time"

type Inco struct {
	CommonAccount
	Usdc      float64 `gorm:"column:usdc;type:decimal(10,2);not null;default:0"`
	TaskFlag  int8    `gorm:"column:task_flag;type:tinyint;not null;default:0"`
	Amount    float64 `gorm:"column:amount;type:decimal(10,2);not null;default:0"`
	CrossFlag int8    `gorm:"column:cross_flag;type:tinyint;not null;default:0"`
	ETH       float64 `gorm:"column:eth;type:decimal(10,2);not null;default:0"`
	Wrap      float64 `gorm:"column:wrap;type:decimal(10,2);not null;default:0"`
	UnWrap    float64 `gorm:"column:un_wrap;type:decimal(10,2);not null;default:0"`
	NextTime  *time.Time
}

func (inco *Inco) TableName() string {
	return "inco"
}
