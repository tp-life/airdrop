package entities

type CommonTask struct {
	CommonAccount
}

func (*CommonTask) TableName() string {

	return "common_task"
}
