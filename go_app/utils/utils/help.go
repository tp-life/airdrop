package utils

import (
	"bufio"
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdsa"
	cRand "crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"math/big"
	"math/rand"
	"os"
	"reflect"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/brianvoe/gofakeit"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/btcutil/hdkeychain"
	"github.com/btcsuite/btcd/chaincfg"
	petname "github.com/dustinkirkland/golang-petname"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/samber/lo"
	"github.com/spf13/viper"
	"github.com/tp-life/utils/logx"
	"github.com/tyler-smith/go-bip39"
)

func TimeI() int64 {
	rand.NewSource(time.Now().UnixNano())
	randomNumber := rand.Float64() * 10000
	currentTimeMillis := time.Now().UnixNano() / int64(time.Millisecond)
	return int64(randomNumber) + currentTimeMillis
}

func RandSleep() {
	// 随机延迟
	rand.NewSource(time.Now().UnixNano())
	delay := rand.Intn(9000) + 1000
	time.Sleep(time.Duration(delay) * time.Millisecond)
}

func Get4Str() string {
	rand.NewSource(time.Now().UnixNano())
	randomNum := 65536 * (1 + rand.Float64())
	hexStr := fmt.Sprintf("%x", int(randomNum))[3:]
	s := fmt.Sprintf("%04s", hexStr)
	return s
}

func pad(text []byte, blockSize int) []byte {
	padding := blockSize - len(text)%blockSize
	padText := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(text, padText...)
}

func getAESKey(key string) []byte {
	keyBytes := []byte(key)
	if len(keyBytes) < 16 {
		padding := make([]byte, 16-len(keyBytes))
		keyBytes = append(keyBytes, padding...)
	}
	return keyBytes[:16]
}

func getAESIV() []byte {
	return []byte("0000000000000000")
}

func GetEncryptedText(text, key string) (string, error) {
	// 将明文数据和密钥转换为字节串
	textBytes := []byte(text)
	keyBytes := []byte(key)

	// 创建AES加密块
	block, err := aes.NewCipher(keyBytes)
	if err != nil {
		fmt.Println("Error creating AES cipher block:", err)
		return "", err
	}

	// 使用CBC模式进行加密
	iv := make([]byte, aes.BlockSize) // 使用全零的初始向量
	mode := cipher.NewCBCEncrypter(block, iv)

	// 填充明文数据
	paddedData := pad(textBytes, aes.BlockSize)

	// 加密数据
	ciphertext := make([]byte, len(paddedData))
	mode.CryptBlocks(ciphertext, paddedData)

	// 将加密后的数据转换为十六进制字符串
	encryptedHex := hex.EncodeToString(ciphertext)

	fmt.Println("加密后的数据（十六进制）:", encryptedHex)

	return encryptedHex, nil
}

func GetPublicKey() *rsa.PublicKey {
	publicKeyHex := "00C1E3934D1614465B33053E7F48EE4EC87B14B95EF88947713D25EECBFF7E74C7977D02DC1D9451F79DD5D1C10C29ACB6A9B4D6FB7D0A0279B6719E1772565F09AF627715919221AEF91899CAE08C0D686D748B20A3603BE2318CA6BC2B59706592A9219D0BF05C9F65023A21D2330807252AE0066D59CEEFA5F2748EA80BAB81"

	publicKeyInt := new(big.Int)
	publicKeyInt.SetString(publicKeyHex, 16)

	// 指定的公共指数
	publicExponent := 65537 // 通常为65537，即0x10001

	// 创建RSA公钥对象
	publicKey := &rsa.PublicKey{
		N: publicKeyInt,   // 模数
		E: publicExponent, // 公共指数
	}

	return publicKey
}

func EncryptWithPublicKey(s string, pubKey *rsa.PublicKey) string {
	ciphertext, err := rsa.EncryptOAEP(sha256.New(), cRand.Reader, pubKey, []byte(s), nil)
	if err != nil {
		fmt.Println("加密时出错:", err)
		return ""
	}
	return hex.EncodeToString(ciphertext)
}

func Encrypt4Rsa(s string) string {
	// 模数和公开指数的十六进制表示
	publicKeyHex := "00C1E3934D1614465B33053E7F48EE4EC87B14B95EF88947713D25EECBFF7E74C7977D02DC1D9451F79DD5D1C10C29ACB6A9B4D6FB7D0A0279B6719E1772565F09AF627715919221AEF91899CAE08C0D686D748B20A3603BE2318CA6BC2B59706592A9219D0BF05C9F65023A21D2330807252AE0066D59CEEFA5F2748EA80BAB81"

	publicExponentHex := "10001"

	// 将十六进制字符串转换为大整数
	publicKeyInt := new(big.Int)
	publicKeyInt.SetString(publicKeyHex, 16)

	publicExponentInt := new(big.Int)
	publicExponentInt.SetString(publicExponentHex, 16)

	// 创建RSA公钥
	publicKey := rsa.PublicKey{
		N: publicKeyInt,
		E: int(publicExponentInt.Int64()),
	}

	// 要加密的字符串

	// 使用RSA公钥加密消息
	ciphertext, err := rsa.EncryptPKCS1v15(cRand.Reader, &publicKey, []byte(s))
	if err != nil {
		fmt.Println("Error encrypting the message:", err)
		return ""
	}

	return base64.StdEncoding.EncodeToString(ciphertext)
}

func RandEmail() (name, domain, full string, err error) {
	domains := viper.GetStringSlice(`email.domains`)
	if len(domains) < 1 {
		err = errors.New(`email.domains 获取失败`)
		return
	}
	domain = lo.Sample(domains)
	name = petname.Generate(2, "")
	full = name + `@` + domain
	return
}

func PaseEmailInfo(
	email, password string,
) (host, user, pwd string, port int, folder []string, err error) {
	host, user, pwd, port = "", email, password, 993
	email = strings.ToLower(email)
	tmp := strings.Split(email, "@")
	if len(tmp) != 2 {
		err = errors.New("传入邮箱格式不正确")
		return
	}
	domain := tmp[1]
	folder = []string{"INBOX"}

	switch domain {
	case "outlook.com", "hotmail.com":
		host = "outlook.office365.com"
		folder = append(folder, "Junk")
	case "rambler.ru":
		host = "imap.rambler.ru"
		folder = append(folder, "Spam")
	case "bk.ru", "inbox.ru", "list.ru", "mail.ru":
		host = "imap.mail.ru"
		folder = append(folder, "Spam")
	case "lapasamail.com",
		"lamesamail.com",
		"faldamail.com",
		"lechemail.com",
		"firstmail.ltd",
		"firstmail.com",
		"superocomail.com",
		"veridicalmail.com",
		"reevalmail.com",
		"velismail.com":
		host = "imap.firstmail.ltd"
		folder = append(folder, "Junk")
	default:
		host = viper.GetString("email.host")
		user = viper.GetString("email.user")
		pwd = viper.GetString("email.password")
		folder = append(folder, "Spam")
	}

	return
}

// PrivateToAddress 私钥转地址
func PrivateToAddress(private string) (string, error) {
	privateKeyHex := strings.TrimPrefix(private, "0x")

	// 将私钥的16进制字符串转换为ECDSA私钥
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		logx.Errorf("Failed to create private key: %v", err)
		return "", err
	}

	// 从私钥生成公钥
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		logx.Errorf("Failed to cast public key to ECDSA")
		return "", errors.New("Failed to cast public key to ECDSA")
	}

	// 从公钥生成地址
	address := crypto.PubkeyToAddress(*publicKeyECDSA)

	return address.Hex(), nil
}

func All(bools []bool) bool {
	for _, b := range bools {
		if !b {
			return false
		}
	}
	return true
}

func OR(bools []bool) bool {
	for _, b := range bools {
		if b {
			return true
		}
	}
	return false
}

func StructToMap(s any) map[string]any {
	result := make(map[string]interface{})
	val := reflect.ValueOf(s)
	typ := reflect.TypeOf(s)

	for i := 0; i < val.NumField(); i++ {
		field := val.Field(i)
		fieldName := typ.Field(i).Tag.Get("json")

		// 检查字段是否为零值
		zeroValue := reflect.Zero(field.Type())
		if reflect.DeepEqual(field.Interface(), zeroValue.Interface()) {
			continue
		}
		// 将非零值的字段添加到map中
		result[fieldName] = field.Interface()
	}

	return result
}

func RandFloat64(min, max float64, precision int) float64 {
	randF64 := min + rand.Float64()*(max-min)
	pn := math.Pow10(precision)
	randF64 = float64(int(randF64*pn)) / float64(pn) // 保留5位小数
	return randF64
}

func RandTime(min, max int) int {
	return rand.Intn(max-min+1) + min
}

func RandomSleep() {
	n := RandTime(8, 20)
	time.Sleep(time.Duration(n) * time.Second)
}

func NewFloat64(f float64) *float64 {
	return &f
}

func NewBool(f bool) *bool {
	return &f
}

func GetRand(min, max int) int {
	source := rand.NewSource(time.Now().UnixNano()) // 创建随机数种子
	r := rand.New(source)                           // 创建随机数生成器
	return r.Intn(max-min) + min
}

func GetRandArray(min, max, num int) []int {
	r := []int{}
	rm := make(map[int]struct{})

	if num > max {
		num = max
	}

	for len(rm) < num {
		y := GetRand(min, max)
		if _, ok := rm[y]; !ok {
			rm[y] = struct{}{}
		}

	}

	for k := range rm {
		r = append(r, k)
	}

	return r
}

func GetRandItem[T any](items []T) T {
	source := rand.NewSource(time.Now().UnixNano()) // 创建随机数种子
	r := rand.New(source)                           // 创建随机数生成器
	randomIndex := r.Intn(len(items))               // 生成一个范围在0到len(numSlice)-1的随机整数
	return items[randomIndex]                       // 从切片中获取随机元素的值
}

func HasText(s, sub string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(sub))
}

func NickName() string {
	return gofakeit.Name()
}

func Account() string {
	gofakeit.Contact()
	return gofakeit.Username()
}

func RandomPhoneNumber() string {
	rand.Seed(time.Now().UnixNano())
	prefix := []string{
		"139",
		"138",
		"137",
		"136",
		"135",
		"134",
		"133",
		"132",
		"131",
		"130",
		"159",
		"158",
		"157",
		"150",
		"151",
		"152",
		"188",
		"187",
		"182",
		"183",
		"184",
		"185",
		"186",
		"145",
		"144",
	}
	number := fmt.Sprintf("%s%08d", prefix[rand.Intn(len(prefix))], rand.Intn(100000000))
	return number
}

func PassWord() string {
	return gofakeit.Password(true, true, true, true, false, 9)
}

func Content(size int) string {
	return gofakeit.HipsterSentence(size)
}

// GetMidNight 获取凌晨时间
func GetMidNight() int64 {
	loc, _ := time.LoadLocation("Local")
	now := time.Now().In(loc)
	midnight := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	return midnight.Unix()
}

func GetTimes(t time.Duration) int64 {
	loc, _ := time.LoadLocation("Local")
	now := time.Now().In(loc)
	return now.Add(0 - t).Unix()
}

func HasHttp(s string) bool {
	return strings.Contains(s, "http://") || strings.Contains(s, "https://")
}

func ReadFile(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}
		logx.Error("打开文件失败：", path, err)
		return nil, err
	}
	defer file.Close()

	address := make([]string, 0)

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		id := scanner.Text()
		if id == "" {
			continue
		}
		address = append(address, id)
	}

	if err := scanner.Err(); err != nil {
		logx.Error("扫码文件内容 错误:", path, err)
		return nil, err
	}

	return address, nil
}

// Function to generate a private key and address from a mnemonic
func MnemonicToPrivateKeyAndAddress(mnemonic string) (string, string, string, error) {
	// Generate seed from mnemonic
	seed := bip39.NewSeed(mnemonic, "")

	// Create a new master key from the seed using Signet parameters
	masterKey, err := hdkeychain.NewMaster(seed, &chaincfg.SigNetParams)
	if err != nil {
		return "", "", "", err
	}

	// Define the BIP-84 path for Signet: m/84'/1'/0'/0/0
	purpose, _ := masterKey.Derive(84 + hdkeychain.HardenedKeyStart)
	coinType, _ := purpose.Derive(1 + hdkeychain.HardenedKeyStart)
	account, _ := coinType.Derive(0 + hdkeychain.HardenedKeyStart)
	change, _ := account.Derive(0)
	addressIndex, _ := change.Derive(0)

	// Get the private key
	privateKey, err := addressIndex.ECPrivKey()
	if err != nil {
		return "", "", "", err
	}

	// Convert the private key to WIF format
	wif, err := btcutil.NewWIF(privateKey, &chaincfg.SigNetParams, true)
	if err != nil {
		return "", "", "", err
	}

	// Get the address
	pubKey := privateKey.PubKey()
	address, err := btcutil.NewAddressWitnessPubKeyHash(
		btcutil.Hash160(pubKey.SerializeCompressed()),
		&chaincfg.SigNetParams,
	)
	if err != nil {
		return "", "", "", err
	}

	return wif.String(), hex.EncodeToString(
		pubKey.SerializeCompressed(),
	), address.EncodeAddress(), nil
}

func OnlyLogin(email, password string) error {
	host, user, pwd, port, _, err := PaseEmailInfo(email, password)
	if err != nil {
		logx.Error("GetEmailCode 解析邮箱失败")
		return err
	}
	return NewEmailService(
		fmt.Sprintf("%s:%d", host, port),
		user,
		pwd,
	).OnlyLogin()
}

func GetEmailCode(email, password, reg string, form ...string) (code string, err error) {
	host, user, pwd, port, folder, err := PaseEmailInfo(email, password)
	if err != nil {
		logx.Error("GetEmailCode 解析邮箱失败")
		return "", err
	}

	_f := ""
	if len(form) > 0 {
		_f = form[0]
	}

	now := time.Now()
	search := EmailSearch{
		Select:  folder,
		To:      email,
		EndTime: now.Add(-time.Second * 600).Unix(),
		From:    _f,
	}
	for i := 0; i < 15; i++ {
		time.Sleep(5 * time.Second)
		logx.Info("开始收取邮件。", fmt.Sprintf("%s:%d", host, port), user, pwd)

		emails, err := NewEmailService(
			fmt.Sprintf("%s:%d", host, port),
			user,
			pwd,
		).ReceiveEmail(search)
		if err != nil {
			logx.Error("GetEmailCode 获取邮件失败")
			continue
		}

		if len(emails) == 0 {
			continue
		}

		sort.Slice(emails, func(i, j int) bool {
			return emails[i].Date.Local().Unix() > emails[j].Date.Local().Unix()
		})

		if emails[0].Date.Local().Before(now.Add(-time.Second * 600)) {
			logx.Info("邮箱时间小于当前时间，可能是旧邮件", emails[0].Date.Local(), now)
			continue
		}

		if code = matchEmailCode(emails[0].Content, reg); code != "" {
			break
		}
	}
	return
}

func matchEmailCode(text, reg string) string {
	// 定义验证码提取的正则表达式
	re := regexp.MustCompile(reg)

	// 在文本中查找匹配的内容
	matches := re.FindStringSubmatch(text)

	// 如果找到匹配的内容
	if len(matches) > 1 {
		// 提取验证码
		verificationCode := matches[1]
		return verificationCode
	}
	return ""
}

func RetryFunc(f func() error, times int) error {
	for i := 0; i < times; i++ {
		if err := f(); err != nil {
			logx.Error("重试失败", err)
			continue
		}
		return nil
	}
	return errors.New("重试超过最大次数")
}
