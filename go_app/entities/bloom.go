package entities

type Bloom struct {
	CommonAccount
}

func (*Bloom) TableName() string {
	return "bloom"
}
