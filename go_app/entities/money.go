package entities

type Money struct {
	CommonAccount
	Email         string
	EmailPassword string
	Register      bool `gorm:"defualt:0"`
}

func (*Money) TableName() string {
	return "money"
}
