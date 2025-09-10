package wallet

import "testing"

func TestSignMessageByMessage(t *testing.T) {
	type args struct {
		privateKey string
		message    string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		// TODO: Add test cases.
		{
			name: "test",
			args: args{
				privateKey: "246a4530832765aa0740c25bfd5eea3bae4eb860fb9b66ca12189412343c50c1",
				message: `genesis.chainbase.com wants you to sign in with your Ethereum account:
0xA3F6057877B32a5F0aE1FB97EBdf27d169520Ef3

0191c1aa-051a-7f17-be03-5b712c37db95

URI: https://genesis.chainbase.com
Version: 1
Chain ID: 2233
Nonce: KfuN64Y1SVjQ5KD31
Issued At: 2024-09-05T10:10:30.863Z`,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := SignMessage(tt.args.privateKey, tt.args.message)
			if (err != nil) != tt.wantErr {
				t.Errorf("SignMessageByMessage() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("SignMessageByMessage() = %v, want %v", got, tt.want)
			}
		})
	}
}
