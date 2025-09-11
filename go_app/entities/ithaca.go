package entities

type IthacaBridge struct {
	CommonAccount
	Amt float64
	L2  float64
}

func (*IthacaBridge) TableName() string {
	return "ithaca_bridge"
}
