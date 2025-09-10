package wallet

import (
	"errors"
	"math/big"
	"strconv"
)

// Ether2wei 转换单位: 将 ETH(小数点表示) 转换为 Wei(18位整数)
func Ether2wei(amountEth float64) *big.Int {
	amountWei := new(big.Int)
	amountWei.SetString("0", 10)
	ethValue := big.NewFloat(amountEth)
	ethValue.Mul(ethValue, big.NewFloat(1e18))
	ethValue.Int(amountWei)
	return amountWei
}

// Wei2ether 转换单位: 将 Wei(18位整数) 转换成 Eth(小数点表示)
func Wei2ether(weiValue *big.Int) *big.Float {
	etherValue := new(big.Float).SetInt(weiValue)
	return etherValue.Quo(etherValue, big.NewFloat(1e18))
}

// Wei2ether 转换单位: 将 Wei(18位整数) 转换成 Gwei
func Wei2gwei(weiValue *big.Int) *big.Float {
	etherValue := new(big.Float).SetInt(weiValue)
	return etherValue.Quo(etherValue, big.NewFloat(1e9))
}

// BigFloatToBigInt
func BigFloatToBigInt(bigval *big.Float) *big.Int {
	coin := new(big.Float)
	coin.SetInt(big.NewInt(1000000000000000000))
	bigval.Mul(bigval, coin)
	result := new(big.Int)
	bigval.Int(result)
	return result
}

// StrToBigInt 将字符串数值转换为 `*big.Int` 类型
func StrToBigInt(strVal string) (*big.Int, error) {
	_v, err := strconv.ParseUint(strVal, 10, 64)
	if err != nil || _v == 0 {
		return nil, errors.New("strVal:[" + strVal + "]无法转换为数值类型")
	}
	return big.NewInt(int64(_v)), nil
}
