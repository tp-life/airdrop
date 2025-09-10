package entities

type Zealy struct {
	CommonAccount
	Addr      string
	PK        string
	Email     string
	EmailPass string
	UserID    string
	Cookies   string
}

func (*Zealy) TableName() string {
	return "zealy"
}
