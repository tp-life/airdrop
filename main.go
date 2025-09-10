package main

import (
	"fmt"
	"time"

	"airdrop/go_app/cmd"
)

func main() {
	// initialize.Viper()
	go func() {
		time.Sleep(time.Second * 3)
		fmt.Println("==========>  VER: 1")
	}()

	cmd.Execute()
}
