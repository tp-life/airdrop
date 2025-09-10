package entities

type Sepolia struct {
	ID         int64
	Address    string
	PrivateKey string
}

func (*Sepolia) TableName() string {
	return "sepolia"
}
