package wallet

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/tp-life/utils/logx"
	"go.uber.org/zap"
)

func GenerateNonce() string {
	characters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	var nonce bytes.Buffer
	for i := 0; i < 17; i++ {
		randomIndex, _ := rand.Int(rand.Reader, big.NewInt(int64(len(characters))))
		nonce.WriteString(string(characters[randomIndex.Int64()]))
	}
	return nonce.String()
}

func privateKeyFromString(privateKeyStr string) (*ecdsa.PrivateKey, error) {
	fromPrivateKey := strings.TrimPrefix(privateKeyStr, "0x")
	privateKey, err := crypto.HexToECDSA(fromPrivateKey)
	if err != nil {
		logx.Error("❌ 私钥转换失败", zap.Error(err))
		return nil, err
	}

	return privateKey, nil
}

func SignMessage(privateKey string, message string) (string, error) {
	privateKeyBytes, err := privateKeyFromString(privateKey)
	if err != nil {
		return "", err
	}

	fullMessage := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	hash := crypto.Keccak256Hash([]byte(fullMessage))
	signatureBytes, err := crypto.Sign(hash.Bytes(), privateKeyBytes)
	if err != nil {
		return "", err
	}
	signatureBytes[64] += 27
	return hexutil.Encode(signatureBytes), nil
}
