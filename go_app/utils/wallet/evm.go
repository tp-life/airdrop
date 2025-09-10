package wallet

import (
	"crypto/ecdsa"
	"encoding/hex"
	"errors"

	"github.com/ethereum/go-ethereum/crypto"
)

type EVM struct{}

func NewEVM() *EVM {
	return &EVM{}
}

func (*EVM) GenEvmAddr() (addr string, pk string, err error) {
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		return "", "", errors.New("Failed to generate private key:" + err.Error())
	}
	privateKeyBytes := crypto.FromECDSA(privateKey)
	// fmt.Printf("私钥: %x\n", privateKeyBytes)

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", "", errors.New("error casting public key to ECDSA")
	}

	return crypto.PubkeyToAddress(*publicKeyECDSA).Hex(), hex.EncodeToString(privateKeyBytes), nil
}
