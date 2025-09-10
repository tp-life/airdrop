package utils

import (
	"fmt"
	"testing"
)

func TestPrivateToAddress(t *testing.T) {
	type args struct {
		private string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "test",
			args: args{
				private: "0xafe12fceee3655847cf06e97a524140bbf15b80c0b765d0fb6d4022b00bc5fa1",
			},
			want: "0x8Ed9BD1E3775C85db713A5439b0CB3F4A4332b0D",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PrivateToAddress(tt.args.private)
			if (err != nil) != tt.wantErr {
				t.Errorf("PrivateToAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("PrivateToAddress() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestMnemonicToPrivateKeyAndAddress(t *testing.T) {
	type args struct {
		mnemonic string
	}
	tests := []struct {
		name    string
		args    args
		want    string
		want1   string
		wantErr bool
	}{
		{
			name: "tt",
			args: args{
				mnemonic: "abandon until unusual audit caution science slot lumber wood bamboo repair submit",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, _, got1, err := MnemonicToPrivateKeyAndAddress(tt.args.mnemonic)
			if (err != nil) != tt.wantErr {
				t.Errorf("MnemonicToPrivateKeyAndAddress() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("MnemonicToPrivateKeyAndAddress() got = %v, want %v", got, tt.want)
			}
			if got1 != tt.want1 {
				t.Errorf("MnemonicToPrivateKeyAndAddress() got1 = %v, want %v", got1, tt.want1)
			}
		})
	}
}

func TestGetRandArray(t *testing.T) {
	r := GetRandArray(0, 3, 3)
	fmt.Println(r)
}
