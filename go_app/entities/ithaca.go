package entities

type IthacaBridge struct {
	CommonAccount
}

func (*IthacaBridge) TableName() string {
	return "ithaca_bridge"
}
