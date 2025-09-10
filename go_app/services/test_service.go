package services

import (
	"airdrop/go_app/initialize"
	"airdrop/go_app/interfaces"
	"fmt"
)

func init() {
	initialize.Register("tr", func() interfaces.Project { return &TestRun{} })
}

type TestRun struct {
	BaseProject
}

func (tr *TestRun) Run() {
	fmt.Println("test -> :", tr.Args)
}
