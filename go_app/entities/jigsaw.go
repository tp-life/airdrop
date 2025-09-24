package entities

type Jigsaw struct {
	CommonAccount
}

func (*Jigsaw) TableName() string {
	return "jigsaw"
}
