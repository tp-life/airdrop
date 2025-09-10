package wallet

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/programs/system"
	"github.com/gagliardetto/solana-go/programs/token"
	"github.com/gagliardetto/solana-go/rpc"
	"github.com/tidwall/gjson"
	"github.com/tp-life/utils/logx"
)

const (
	defaultRetryCount     = 50
	defaultRetryDelay     = 2 * time.Second
	defaultConfirmTimeout = 2 * time.Minute
	maxConcurrentTx       = 9
	lamportsPerSol        = 1e9
)

type RPCClient struct {
	*rpc.Client
}

// 通用RPC调用包装函数
func (r *RPCClient) rpcCall(ctx context.Context, call func() (interface{}, error)) (interface{}, error) {
	result, err := call()
	if err != nil {
		if strings.Contains(err.Error(), "exceeded limit for rpc") {
			time.Sleep(1 * time.Second)
			return r.rpcCall(ctx, call)
		}
		return result, err
	}
	return result, nil
}

func (r *RPCClient) NewGetLatestBlockhash(ctx context.Context, commitment rpc.CommitmentType) (*rpc.GetLatestBlockhashResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetLatestBlockhash(ctx, commitment)
	})
	if err != nil {
		return nil, err
	}
	return result.(*rpc.GetLatestBlockhashResult), nil
}

func (r *RPCClient) NewGetBalance(ctx context.Context, address solana.PublicKey, commitment rpc.CommitmentType) (*rpc.GetBalanceResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetBalance(ctx, address, commitment)
	})
	if err != nil {
		return nil, err
	}
	return result.(*rpc.GetBalanceResult), nil
}

func (r *RPCClient) NewGetTokenAccountsByOwner(ctx context.Context, owner solana.PublicKey, conf *rpc.GetTokenAccountsConfig, opts *rpc.GetTokenAccountsOpts) (*rpc.GetTokenAccountsResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetTokenAccountsByOwner(ctx, owner, conf, opts)
	})
	if err != nil {
		return nil, err
	}
	return result.(*rpc.GetTokenAccountsResult), nil
}

func (r *RPCClient) NewGetTokenAccountBalance(ctx context.Context, address solana.PublicKey, commitment rpc.CommitmentType) (*rpc.GetTokenAccountBalanceResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetTokenAccountBalance(ctx, address, commitment)
	})
	if err != nil {
		return nil, err
	}
	return result.(*rpc.GetTokenAccountBalanceResult), nil
}

func (r *RPCClient) NewGetRecentBlockhash(ctx context.Context, commitment rpc.CommitmentType) (*rpc.GetRecentBlockhashResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetRecentBlockhash(ctx, commitment)
	})
	if err != nil {
		return nil, err
	}
	return result.(*rpc.GetRecentBlockhashResult), nil
}

func (r *RPCClient) NewGetMinimumBalanceForRentExemption(ctx context.Context, size uint64, commitment rpc.CommitmentType) (uint64, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetMinimumBalanceForRentExemption(ctx, size, commitment)
	})
	if err != nil {
		return 0, err
	}
	return result.(uint64), nil
}

func (r *RPCClient) NewGetAccountInfo(ctx context.Context, account solana.PublicKey) (*rpc.GetAccountInfoResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetAccountInfo(ctx, account)
	})
	if err != nil {
		return nil, err
	}
	return result.(*rpc.GetAccountInfoResult), nil
}

func (r *RPCClient) NewGetProgramAccounts(ctx context.Context, program solana.PublicKey) (rpc.GetProgramAccountsResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetProgramAccounts(ctx, program)
	})
	if err != nil {
		return nil, err
	}
	return result.(rpc.GetProgramAccountsResult), nil
}

func (r *RPCClient) NewGetSignatureStatuses(ctx context.Context, searchTransactionHistory bool, transactionSignatures ...solana.Signature) (*rpc.GetSignatureStatusesResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetSignatureStatuses(ctx, searchTransactionHistory, transactionSignatures...)
	})
	if err != nil {
		return nil, err
	}
	return result.(*rpc.GetSignatureStatusesResult), nil
}

func (r *RPCClient) NewGetTransaction(ctx context.Context, signature solana.Signature, opts *rpc.GetTransactionOpts) (*rpc.GetTransactionResult, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.GetTransaction(ctx, signature, opts)
	})
	if err != nil {
		return nil, err
	}
	return result.(*rpc.GetTransactionResult), nil
}

func (r *RPCClient) NewSendTransactionWithOpts(ctx context.Context, tx *solana.Transaction, opts rpc.TransactionOpts) (solana.Signature, error) {
	result, err := r.rpcCall(ctx, func() (interface{}, error) {
		return r.Client.SendTransactionWithOpts(ctx, tx, opts)
	})
	if err != nil {
		return solana.Signature{}, err
	}
	return result.(solana.Signature), nil
}

type Solana struct {
	rpcClient *RPCClient
	pk        string
}

func NewSol(rpcURL string, pk string) *Solana {
	var r *RPCClient
	if rpcURL != "" {
		r = &RPCClient{rpc.New(rpcURL)}
	}
	return &Solana{
		rpcClient: r,
		pk:        pk,
	}
}

func (*Solana) GenAddress() (addr, pk string) {
	wallet := solana.NewWallet()
	pk = wallet.PrivateKey.String()
	addr = wallet.PublicKey().String()
	return
}

// 从字符串解析账户私钥
func parseAccountFromString(pk string, index int, operation string) (solana.PrivateKey, error) {

	fromAccount, err := solana.PrivateKeyFromBase58(pk)
	if err != nil {
		logx.Error(operation, "序号", index+1, "状态", "解析私钥失败!", "错误", err)
		return solana.PrivateKey{}, err
	}

	return fromAccount, nil
}

// SendTransaction 发送交易并处理重试逻辑
func (sol *Solana) SendTransaction(ctx context.Context, transaction *solana.Transaction) (solana.Signature, error) {
	opts := rpc.TransactionOpts{
		SkipPreflight:       false,
		PreflightCommitment: rpc.CommitmentFinalized,
	}

	for i := 0; i < defaultRetryCount; i++ {
		sig, err := sol.rpcClient.NewSendTransactionWithOpts(ctx, transaction, opts)
		if err == nil {
			return sig, nil
		}

		if !strings.Contains(err.Error(), "exceeded limit for sendTransaction") {
			return solana.Signature{}, fmt.Errorf("发送交易失败: %w", err)
		}

		select {
		case <-ctx.Done():
			return solana.Signature{}, ctx.Err()
		case <-time.After(defaultRetryDelay):
			continue
		}
	}

	return solana.Signature{}, fmt.Errorf("发送交易超过最大重试次数 (%d)", defaultRetryCount)
}

// WaitForConfirmation 等待交易确认并处理各种状态
func (sol *Solana) WaitForConfirmation(ctx context.Context, sig solana.Signature) (bool, error) {
	for range 30 {
		rsp, err := sol.rpcClient.GetSignatureStatuses(ctx, true, sig)
		if err != nil || len(rsp.Value) == 0 {
			time.Sleep(2 * time.Second)
			continue
		}

		if rsp.Value[0].Err != nil {
			return false, fmt.Errorf("交易已确认但执行失败: %v", rsp.Value[0].Err)
		}
		return true, nil
	}

	return false, errors.New("等待交易超时")
}

// 批量分发SOL
func (sol *Solana) BatchSend(recipients []string, amount float64, batch int) error {
	ctx := context.Background()

	feePayer, err := solana.PrivateKeyFromBase58(sol.pk)
	if err != nil {
		logx.Error("批量分发", "状态", "解析私钥失败!", "错误", err)
		return err
	}

	// 使用WaitGroup和信号量控制并发
	var wg sync.WaitGroup
	sem := make(chan struct{}, maxConcurrentTx)
	defer close(sem)

	if batch < 1 {
		batch = 1
	}

	batchSize := batch
	totalBatches := int(math.Ceil(float64(len(recipients)) / float64(batchSize)))

	for i := range totalBatches {
		start := i * batchSize
		end := start + batchSize
		end = min(end, len(recipients))
		instructions := make([]solana.Instruction, 0, end-start)
		for _, recipient := range recipients[start:end] {

			recipientPubkey, err := solana.PublicKeyFromBase58(recipient)
			if err != nil {
				logx.Error("批量分发", "批次", i+1, "状态", "解析接收地址失败!", "错误", err)
				continue
			}

			instruction := system.NewTransferInstruction(
				uint64(amount*lamportsPerSol),
				feePayer.PublicKey(),
				recipientPubkey,
			).Build()

			instructions = append(instructions, instruction)
		}

		if len(instructions) == 0 {
			logx.Error("批量分发", "批次", i+1, "状态", "没有有效的交易指令!")
			continue
		}

		recent, err := sol.rpcClient.NewGetLatestBlockhash(ctx, rpc.CommitmentFinalized)
		if err != nil {
			logx.Error("批量分发", "批次", i+1, "状态", "获取最新区块哈希失败!", "错误", err)
			continue
		}

		tx, err := solana.NewTransaction(
			instructions,
			recent.Value.Blockhash,
			solana.TransactionPayer(feePayer.PublicKey()),
		)
		if err != nil {
			logx.Error("批量分发", "批次", i+1, "状态", "创建交易失败!", "错误", err)
			continue
		}

		_, err = tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {
			if feePayer.PublicKey().Equals(key) {
				return &feePayer
			}
			return nil
		})
		if err != nil {
			logx.Error("批量分发", "批次", i+1, "状态", "签名交易失败!", "错误", err)
			continue
		}

		// 控制并发发送交易
		sem <- struct{}{} // 获取信号量
		wg.Add(1)

		go sol.sendAndConfirmTransaction(ctx, tx, i+1, "批量分发", nil, sem, &wg)
	}

	wg.Wait() // 等待所有交易完成
	logx.Info("批量分发", "状态", "所有批次处理完成!")

	return nil
}

// 归集SOL到主账户,大号支付手续费
func (sol *Solana) BatchCollect(pks []string, batch int) error {
	ctx := context.Background()
	if batch < 0 {
		batch = 1
	}

	// 解码主账户私钥
	feePayer, err := solana.PrivateKeyFromBase58(sol.pk)
	if err != nil {
		logx.Error("归集SOL", "状态", "解析主账户私钥失败!", "错误", err)
		return err
	}

	// 使用WaitGroup和信号量控制并发
	var wg sync.WaitGroup
	sem := make(chan struct{}, maxConcurrentTx)
	defer close(sem)

	type accountInfo struct {
		privateKey solana.PrivateKey
		balance    uint64
	}

	// 创建一个批次处理函数
	processBatch := func(batchNum int, accounts []accountInfo) {
		var instructions []solana.Instruction

		// 构建转账指令
		for _, account := range accounts {
			instruction := system.NewTransferInstruction(
				account.balance,
				account.privateKey.PublicKey(),
				feePayer.PublicKey(),
			).Build()

			instructions = append(instructions, instruction)
		}

		recent, err := sol.rpcClient.NewGetLatestBlockhash(ctx, rpc.CommitmentFinalized)
		if err != nil {
			logx.Error("归集SOL", "批次", batchNum, "状态", "获取最新区块哈希失败!", "错误", err)
			return
		}

		tx, err := solana.NewTransaction(
			instructions,
			recent.Value.Blockhash,
			solana.TransactionPayer(feePayer.PublicKey()),
		)
		if err != nil {
			logx.Error("归集SOL", "批次", batchNum, "状态", "创建交易失败!", "错误", err)
			return
		}

		// 签名交易
		_, err = tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {
			if feePayer.PublicKey().Equals(key) {
				return &feePayer
			}
			for _, account := range accounts {
				if account.privateKey.PublicKey().Equals(key) {
					pk := account.privateKey
					return &pk
				}
			}
			return nil
		})
		if err != nil {
			logx.Error("归集SOL", "批次", batchNum, "状态", "签名交易失败!", "错误", err)
			return
		}

		// 控制并发发送交易
		sem <- struct{}{} // 获取信号量
		wg.Add(1)

		go sol.sendAndConfirmTransaction(ctx, tx, batchNum, "归集SOL", nil, sem, &wg)
	}

	currentBatch := make([]accountInfo, 0, batch)
	batchNum := 1
	totalAccounts := 0

	// 处理每个账户
	for i, recipient := range pks {
		fromAccount, err := parseAccountFromString(recipient, i, "归集SOL")
		if err != nil {
			continue
		}

		balance, err := sol.rpcClient.NewGetBalance(
			ctx,
			fromAccount.PublicKey(),
			rpc.CommitmentFinalized,
		)
		if err != nil {
			logx.Error("归集SOL", "序号", i+1, "状态", "获取余额失败!", "错误", err)
			continue
		}

		if balance.Value <= 0 {
			logx.Error("归集SOL", "序号", i+1, "状态", "账户余额不足!", "地址", fromAccount.PublicKey())
			continue
		}

		currentBatch = append(currentBatch, accountInfo{
			privateKey: fromAccount,
			balance:    balance.Value,
		})
		totalAccounts++

		// 当收集到足够的账户时，立即处理这个批次
		if len(currentBatch) >= batch {
			processBatch(batchNum, currentBatch)
			currentBatch = make([]accountInfo, 0, batch)
			batchNum++
		}
	}

	// 处理最后一个不完整的批次
	if len(currentBatch) > 0 {
		processBatch(batchNum, currentBatch)
	}

	wg.Wait() // 等待所有交易完成
	logx.Info("归集SOL", "状态", "所有批次处理完成!", "总账户数", totalAccounts)

	return nil
}

// 批量归集代币
func (sol *Solana) TokenTransferBatch(recipients []string, tokenaddress string, closeAta bool) error {
	ctx := context.Background()

	feePayer, err := solana.PrivateKeyFromBase58(sol.pk)
	if err != nil {
		logx.Error("归集代币", "状态", "解析主账户私钥失败!", "错误", err)
		return err
	}

	tokenMint, err := solana.PublicKeyFromBase58(tokenaddress)
	if err != nil {
		logx.Error("归集代币", "状态", "解析代币地址失败!", "错误", err)
		return err
	}

	// 使用WaitGroup和信号量控制并发
	var wg sync.WaitGroup
	sem := make(chan struct{}, maxConcurrentTx)
	defer close(sem)

	type accountInfo struct {
		privateKey solana.PrivateKey
		ataAccount solana.PublicKey
		balance    uint64
		decimals   uint8
	}

	// 获取大号代币账户
	feePayerAta, _, err := solana.FindAssociatedTokenAddress(feePayer.PublicKey(), tokenMint)
	if err != nil {
		logx.Error("归集代币", "状态", "获取大号代币账户失败!", "错误", err)
		return err
	}

	var processingError error
	var errorMutex sync.Mutex

	// 创建批次处理函数
	processBatch := func(batchNum int, accounts []accountInfo) {
		var instructions []solana.Instruction

		// 构建转账指令
		for _, account := range accounts {
			// 转账指令
			transferIx := token.NewTransferInstruction(
				account.balance,
				account.ataAccount,
				feePayerAta,
				account.privateKey.PublicKey(),
				[]solana.PublicKey{},
			).Build()

			instructions = append(instructions, transferIx)

			if closeAta {
				// 关闭代币账户指令
				closeIx := token.NewCloseAccountInstruction(
					account.ataAccount,
					feePayer.PublicKey(),
					account.privateKey.PublicKey(),
					[]solana.PublicKey{},
				).Build()
				instructions = append(instructions, closeIx)
			}
		}

		recent, err := sol.rpcClient.NewGetLatestBlockhash(ctx, rpc.CommitmentFinalized)
		if err != nil {
			logx.Error("归集代币", "批次", batchNum, "状态", "获取最新区块哈希失败!", "错误", err)
			errorMutex.Lock()
			processingError = err
			errorMutex.Unlock()
			return
		}

		tx, err := solana.NewTransaction(
			instructions,
			recent.Value.Blockhash,
			solana.TransactionPayer(feePayer.PublicKey()),
		)
		if err != nil {
			logx.Error("归集代币", "批次", batchNum, "状态", "创建交易失败!", "错误", err)
			errorMutex.Lock()
			processingError = err
			errorMutex.Unlock()
			return
		}

		// 签名交易
		_, err = tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {
			if feePayer.PublicKey().Equals(key) {
				return &feePayer
			}
			for _, account := range accounts {
				if account.privateKey.PublicKey().Equals(key) {
					pk := account.privateKey
					return &pk
				}
			}
			return nil
		})
		if err != nil {
			logx.Error("归集代币", "批次", batchNum, "状态", "签名交易失败!", "错误", err)
			errorMutex.Lock()
			processingError = err
			errorMutex.Unlock()
			return
		}

		// 控制并发发送交易
		sem <- struct{}{} // 获取信号量
		wg.Add(1)

		addresses := make([]string, len(accounts))
		for i, acc := range accounts {
			addresses[i] = acc.privateKey.PublicKey().String()
		}
		go sol.sendAndConfirmTransaction(ctx, tx, batchNum, "归集代币", addresses, sem, &wg)
	}

	currentBatch := make([]accountInfo, 0, 5) // 代币归集使用固定的批次大小5
	batchNum := 1
	totalAccounts := 0
	var hasErrors bool

	// 处理每个账户
	for i, recipient := range recipients {
		fromAccount, err := parseAccountFromString(recipient, i, "归集代币")
		if err != nil {
			hasErrors = true
			continue
		}

		// 获取小号代币账户
		fromAccountAta, _, err := solana.FindAssociatedTokenAddress(fromAccount.PublicKey(), tokenMint)
		if err != nil {
			logx.Error("归集代币", "序号", i+1, "状态", "获取小号代币账户失败!", "错误", err)
			hasErrors = true
			continue
		}

		// 获取代币余额
		balance, err := sol.rpcClient.NewGetTokenAccountBalance(ctx, fromAccountAta, rpc.CommitmentFinalized)
		if err != nil {
			logx.Error("归集代币", "序号", i+1, "状态", "获取代币余额失败!", "错误", err)
			hasErrors = true
			continue
		}

		if balance.Value.Amount == "0" {
			continue
		}

		// 计算实际转账金额
		amount := uint64(*balance.Value.UiAmount * math.Pow10(int(balance.Value.Decimals)))

		currentBatch = append(currentBatch, accountInfo{
			privateKey: fromAccount,
			ataAccount: fromAccountAta,
			balance:    amount,
			decimals:   balance.Value.Decimals,
		})
		totalAccounts++

		// 当收集到足够的账户时，立即处理这个批次
		if len(currentBatch) >= 5 { // 代币归集使用固定的批次大小5
			processBatch(batchNum, currentBatch)
			currentBatch = make([]accountInfo, 0, 5)
			batchNum++
		}
	}

	// 处理最后一个不完整的批次
	if len(currentBatch) > 0 {
		processBatch(batchNum, currentBatch)
	}

	wg.Wait() // 等待所有交易完成
	logx.Info("归集代币", "状态", "所有批次处理完成!", "总账户数", totalAccounts)

	if processingError != nil {
		return processingError
	}
	if hasErrors {
		return fmt.Errorf("部分账户处理失败")
	}
	return nil
}

// 发送并等待交易确认
func (sol *Solana) sendAndConfirmTransaction(ctx context.Context, tx *solana.Transaction, batchNum int, operation string, addresses []string, sem chan struct{}, wg *sync.WaitGroup) {
	defer func() {
		<-sem // 释放信号量
		wg.Done()
	}()

	sig, err := sol.SendTransaction(ctx, tx)
	if err != nil {
		logx.Error(operation, "批次", batchNum, "状态", "发送交易失败!", "错误", err)
		return
	}

	if len(addresses) > 0 {
		logx.Info(operation, "批次", batchNum, "状态", "转账发送成功!", "交易ID", sig, "账户数量", len(addresses), "账户地址", strings.Join(addresses, ","))
	} else {
		logx.Info(operation, "批次", batchNum, "状态", "转账发送成功!", "交易ID", sig)
	}

	// 等待交易确认
	confirmed, err := sol.WaitForConfirmation(ctx, sig)
	if err != nil {
		logx.Error(operation, "批次", batchNum, "状态", "转账确认失败!", "错误", err)
		return
	}

	if confirmed {
		logx.Info(operation, "批次", batchNum, "状态", "转账确认成功!", "交易ID", sig)
	}
}

// 关闭指定代币的所有空余额ATA账户
func (sol *Solana) CloseSpecificTokenAtas(accounts []string, tokenaddress string) error {
	ctx := context.Background()

	feePayer, err := solana.PrivateKeyFromBase58(sol.pk)
	if err != nil {
		logx.Error("关闭ATA", "状态", "解析主账户私钥失败!", "错误", err)
		return err
	}

	tokenMint, err := solana.PublicKeyFromBase58(tokenaddress)
	if err != nil {
		logx.Error("关闭ATA", "状态", "解析代币地址失败!", "错误", err)
		return err
	}

	// 使用WaitGroup和信号量控制并发
	var wg sync.WaitGroup
	sem := make(chan struct{}, maxConcurrentTx)
	defer close(sem)

	type accountInfo struct {
		privateKey solana.PrivateKey
		ataAccount solana.PublicKey
	}

	var processingError error
	var errorMutex sync.Mutex

	// 创建批次处理函数
	processBatch := func(batchNum int, accounts []accountInfo) {
		var instructions []solana.Instruction
		if err != nil {
			errorMutex.Lock()
			if processingError == nil {
				processingError = fmt.Errorf("error parsing fee payer key in batch %d: %v", batchNum, err)
			}
			errorMutex.Unlock()
			return
		}

		// 构建关闭账户指令
		for _, account := range accounts {
			closeIx := token.NewCloseAccountInstruction(
				account.ataAccount,
				feePayer.PublicKey(),
				account.privateKey.PublicKey(),
				[]solana.PublicKey{account.privateKey.PublicKey()},
			).Build()
			instructions = append(instructions, closeIx)
		}

		// 如果没有指令，直接返回
		if len(instructions) == 0 {
			return
		}

		// 获取最新区块哈希
		recent, err := sol.rpcClient.NewGetLatestBlockhash(context.Background(), rpc.CommitmentFinalized)
		if err != nil {
			errorMutex.Lock()
			if processingError == nil {
				processingError = fmt.Errorf("error getting latest blockhash in batch %d: %v", batchNum, err)
			}
			errorMutex.Unlock()
			return
		}

		// 创建交易
		tx, err := solana.NewTransaction(
			instructions,
			recent.Value.Blockhash,
			solana.TransactionPayer(feePayer.PublicKey()),
		)
		if err != nil {
			errorMutex.Lock()
			if processingError == nil {
				processingError = fmt.Errorf("error creating transaction in batch %d: %v", batchNum, err)
			}
			errorMutex.Unlock()
			return
		}

		// 签名交易
		_, err = tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {
			if feePayer.PublicKey().Equals(key) {
				return &feePayer
			}
			for _, account := range accounts {
				if account.privateKey.PublicKey().Equals(key) {
					pk := account.privateKey
					return &pk
				}
			}
			return nil
		})
		if err != nil {
			errorMutex.Lock()
			if processingError == nil {
				processingError = fmt.Errorf("error signing transaction in batch %d: %v", batchNum, err)
			}
			errorMutex.Unlock()
			return
		}

		// 控制并发发送交易
		sem <- struct{}{} // 获取信号量
		wg.Add(1)

		addresses := make([]string, len(accounts))
		for i, acc := range accounts {
			addresses[i] = acc.privateKey.PublicKey().String()
		}
		go sol.sendAndConfirmTransaction(context.Background(), tx, batchNum, "关闭ATA", addresses, sem, &wg)
	}

	currentBatch := make([]accountInfo, 0, 5)
	batchNum := 1
	totalAccounts := 0
	var hasErrors bool

	// 处理每个账户
	for i, recipient := range accounts {
		fromAccount, err := parseAccountFromString(recipient, i, "关闭ATA")
		if err != nil {
			hasErrors = true
			continue
		}

		// 获取小号代币账户
		fromAccountAta, _, err := solana.FindAssociatedTokenAddress(fromAccount.PublicKey(), tokenMint)
		if err != nil {
			logx.Error("关闭ATA", "序号", i+1, "状态", "获取小号代币账户失败!", "错误", err)
			hasErrors = true
			continue
		}

		// 获取代币余额
		balance, err := sol.rpcClient.NewGetTokenAccountBalance(ctx, fromAccountAta, rpc.CommitmentFinalized)
		if err != nil {
			logx.Error("关闭ATA", "序号", i+1, "状态", "获取代币余额失败!", "错误", err)
			hasErrors = true
			continue
		}

		// 只处理余额为0的账户
		if balance.Value.Amount != "0" {
			continue
		}

		currentBatch = append(currentBatch, accountInfo{
			privateKey: fromAccount,
			ataAccount: fromAccountAta,
		})
		totalAccounts++

		// 当收集到足够的账户时，立即处理这个批次
		if len(currentBatch) >= 5 {
			processBatch(batchNum, currentBatch)
			currentBatch = make([]accountInfo, 0, 5)
			batchNum++
		}
	}

	// 处理最后一个不完整的批次
	if len(currentBatch) > 0 {
		processBatch(batchNum, currentBatch)
	}

	if hasErrors {
		return fmt.Errorf("部分账户处理失败")
	}

	logx.Info("关闭ATA", "状态", "所有批次处理完成!", "总账户数", totalAccounts)
	return processingError
}

// 关闭所有空余额ATA账户
func (sol *Solana) CloseAllAtas(pks []string) error {
	ctx := context.Background()

	feePayer, err := solana.PrivateKeyFromBase58(sol.pk)
	if err != nil {
		logx.Error("关闭所有ATA", "状态", "解析主账户私钥失败!", "错误", err)
		return err
	}

	// 使用WaitGroup和信号量控制并发
	var wg sync.WaitGroup
	sem := make(chan struct{}, maxConcurrentTx)
	defer close(sem)

	type accountInfo struct {
		privateKey solana.PrivateKey
		ataAccount solana.PublicKey
	}

	var processingError error
	var errorMutex sync.Mutex

	// 创建批次处理函数
	processBatch := func(batchNum int, accounts []accountInfo) {
		var instructions []solana.Instruction

		// 构建关闭账户指令
		for _, account := range accounts {
			closeIx := token.NewCloseAccountInstruction(
				account.ataAccount,
				feePayer.PublicKey(),
				account.privateKey.PublicKey(),
				[]solana.PublicKey{},
			).Build()
			instructions = append(instructions, closeIx)
		}

		recent, err := sol.rpcClient.NewGetLatestBlockhash(ctx, rpc.CommitmentFinalized)
		if err != nil {
			logx.Error("关闭所有ATA", "批次", batchNum, "状态", "获取最新区块哈希失败!", "错误", err)
			errorMutex.Lock()
			processingError = err
			errorMutex.Unlock()
			return
		}

		tx, err := solana.NewTransaction(
			instructions,
			recent.Value.Blockhash,
			solana.TransactionPayer(feePayer.PublicKey()),
		)
		if err != nil {
			logx.Error("关闭所有ATA", "批次", batchNum, "状态", "创建交易失败!", "错误", err)
			errorMutex.Lock()
			processingError = err
			errorMutex.Unlock()
			return
		}

		// 签名交易
		_, err = tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {
			if feePayer.PublicKey().Equals(key) {
				return &feePayer
			}
			for _, account := range accounts {
				if account.privateKey.PublicKey().Equals(key) {
					pk := account.privateKey
					return &pk
				}
			}
			return nil
		})
		if err != nil {
			logx.Error("关闭所有ATA", "批次", batchNum, "状态", "签名交易失败!", "错误", err)
			errorMutex.Lock()
			processingError = err
			errorMutex.Unlock()
			return
		}

		// 控制并发发送交易
		sem <- struct{}{} // 获取信号量
		wg.Add(1)

		addresses := make([]string, len(accounts))
		for i, acc := range accounts {
			addresses[i] = acc.privateKey.PublicKey().String()
		}
		go sol.sendAndConfirmTransaction(ctx, tx, batchNum, "关闭所有ATA", addresses, sem, &wg)
	}

	currentBatch := make([]accountInfo, 0, 5)
	batchNum := 1
	totalAccounts := 0
	var hasErrors bool

	// 处理每个账户
	for i, recipient := range pks {
		fromAccount, err := parseAccountFromString(recipient, i, "关闭所有ATA")
		if err != nil {
			hasErrors = true
			continue
		}

		// 获取账户所有代币账户
		accounts, err := sol.rpcClient.NewGetTokenAccountsByOwner(
			ctx,
			fromAccount.PublicKey(),
			&rpc.GetTokenAccountsConfig{
				ProgramId: &solana.TokenProgramID,
			},
			&rpc.GetTokenAccountsOpts{
				Commitment: rpc.CommitmentFinalized,
			},
		)
		if err != nil {
			logx.Error("关闭所有ATA", "序号", i+1, "状态", "获取代币账户失败!", "错误", err)
			hasErrors = true
			continue
		}

		// 处理每个代币账户
		for _, account := range accounts.Value {
			balance, err := sol.rpcClient.NewGetTokenAccountBalance(
				ctx,
				account.Pubkey,
				rpc.CommitmentFinalized,
			)
			if err != nil {
				logx.Error("关闭所有ATA", "序号", i+1, "状态", "获取代币余额失败!", "错误", err)
				hasErrors = true
				continue
			}

			// 只处理余额为0的账户
			if balance.Value.Amount != "0" {
				continue
			}

			currentBatch = append(currentBatch, accountInfo{
				privateKey: fromAccount,
				ataAccount: account.Pubkey,
			})
			totalAccounts++

			// 当收集到足够的账户时，立即处理这个批次
			if len(currentBatch) >= 5 {
				processBatch(batchNum, currentBatch)
				currentBatch = make([]accountInfo, 0, 5)
				batchNum++
			}
		}
	}

	// 处理最后一个不完整的批次
	if len(currentBatch) > 0 {
		processBatch(batchNum, currentBatch)
	}

	if hasErrors {
		return fmt.Errorf("部分账户处理失败")
	}

	logx.Info("关闭所有ATA", "状态", "所有批次处理完成!", "总账户数", totalAccounts)
	return processingError
}

// 查询SOL余额
func (sol *Solana) GetBalance(pubkey string) (float64, error) {
	// 解析公钥
	publicKey, err := solana.PublicKeyFromBase58(pubkey)
	if err != nil {
		return 0, fmt.Errorf("解析公钥失败: %v", err)
	}

	// 查询余额
	balance, err := sol.rpcClient.NewGetBalance(
		context.TODO(),
		publicKey,
		rpc.CommitmentFinalized,
	)
	if err != nil {
		return 0, fmt.Errorf("查询余额失败: %v", err)
	}

	// 将 lamports 转换为 SOL
	solBalance := float64(balance.Value) / 1e9
	return solBalance, nil
}

// 查询指定代币余额
func (sol *Solana) GetTokenBalance(pubkey string, tokenMint solana.PublicKey) (float64, error) {
	// 解析公钥
	publicKey, err := solana.PublicKeyFromBase58(pubkey)
	if err != nil {
		return 0, fmt.Errorf("解析公钥失败: %v", err)
	}

	// 获取代币账户
	atas, err := sol.rpcClient.GetTokenAccountsByOwner(
		context.TODO(),
		publicKey,
		&rpc.GetTokenAccountsConfig{
			Mint: &tokenMint,
		},
		&rpc.GetTokenAccountsOpts{})

	if err != nil || len(atas.Value) == 0 {
		return 0, fmt.Errorf("获取代币账户失败: %v", err)
	}

	// 获取代币余额
	balance, err := sol.rpcClient.GetTokenAccountBalance(
		context.TODO(),
		atas.Value[0].Pubkey,
		rpc.CommitmentFinalized,
	)
	if err != nil {
		return 0, fmt.Errorf("查询代币余额失败: %v", err)
	}
	// 将余额转换为浮点数
	amount, err := strconv.ParseFloat(balance.Value.Amount, 64)
	if err != nil {
		return 0, fmt.Errorf("解析代币余额失败: %v", err)
	}
	tokenBalance := amount / math.Pow10(int(balance.Value.Decimals))
	return tokenBalance, nil
}

type AccountToken struct {
	Token  string
	Amount float64
}

// 获取账户所有代币账户
func (sol *Solana) GetAccountToken(pubkey string) ([]AccountToken, error) {
	PublicKey, err := solana.PublicKeyFromBase58(pubkey)
	if err != nil {
		logx.Error("获取账户代币", "状态", "解析主账户地址失败!", "错误", err)
		return nil, err
	}

	accounts, err := sol.rpcClient.NewGetTokenAccountsByOwner(
		context.TODO(),
		PublicKey,
		&rpc.GetTokenAccountsConfig{
			ProgramId: &solana.TokenProgramID,
		},
		&rpc.GetTokenAccountsOpts{
			Commitment: rpc.CommitmentFinalized,
		},
	)
	if err != nil {
		logx.Error("获取代币账户", "状态", "获取代币账户失败!", "错误", err)
		return nil, err
	}

	if len(accounts.Value) == 0 {
		logx.Info("获取代币账户", "状态", "没有代币账户!")
		return nil, nil
	}

	var names []string
	var balances []string
	var hasErrors bool
	args := []AccountToken{}

	for _, account := range accounts.Value {
		balance, err := sol.rpcClient.NewGetTokenAccountBalance(
			context.TODO(),
			account.Pubkey,
			rpc.CommitmentFinalized,
		)
		if err != nil {
			logx.Error("获取代币账户", "状态", "获取代币余额失败!", "错误", err)
			hasErrors = true
			continue
		}

		data := gjson.ParseBytes(account.Account.Data.GetRawJSON())
		name := data.Get("parsed.info.name").String()
		decimals := data.Get("parsed.info.decimals").Int()
		balanceStr := strconv.FormatFloat(*balance.Value.UiAmount, 'f', int(decimals), 64)

		names = append(names, name)
		balances = append(balances, balanceStr)
		args = append(args, AccountToken{
			Amount: *balance.Value.UiAmount,
			Token:  name,
		})
	}

	logx.Info("获取账户代币", args)

	if hasErrors {
		return args, fmt.Errorf("部分代币余额获取失败")
	}
	return args, nil
}
