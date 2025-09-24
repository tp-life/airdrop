package cmd

import (
	"airdrop/go_app/entities"
	"airdrop/go_app/instance"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(mirageCmd)
}

var mirageCmd = &cobra.Command{
	Use:   "mirage",
	Short: "mirage db  ",
	Run: func(cmd *cobra.Command, args []string) {
		Mirage()
	},
}

func Mirage() {
	db := instance.DB()
	db.AutoMigrate(
		// &entities.Enso{},
		// &entities.Heilos{},
		// &entities.Wallet{},
		// &entities.N1{},
		// &entities.D3{},
		// &entities.Sapien{},
		// &entities.Inco{},
		// &entities.Money{},
		// &entities.Spekter{},
		// &entities.CommonTask{},
		// &entities.Bloom{},
		// &entities.IthacaBridge{},
		&entities.Jigsaw{},
	)
}
