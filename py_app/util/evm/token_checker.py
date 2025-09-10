from web3 import Web3

class TokenBalanceChecker:
    def __init__(self, rpc, contracts = [],ip = ''):
        # 配置代理
        proxy = {
            "http":ip,
            "https":ip,
        }
        self.web3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={
            "timeout": 30,  # 超时时间
            "proxies": proxy if ip else None,  # 代理设置
        }))
        self.erc20_abi = [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function",
            },
            {
                "constant": True,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function",
            },
            {
                "constant": True,
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function",
            },
        ]
        self.token_contract_addresses = contracts

    def getBalance(self, addr=''):
        """返回字典形式的余额，键为 symbol，值为余额"""
        if not addr:
            raise ValueError("Address must be provided")
        
        addr = self.web3.to_checksum_address(addr)  # 校验地址格式
        balances = {}

        for token_address in self.token_contract_addresses:
            token_address = self.web3.to_checksum_address(token_address)
            token_contract = self.web3.eth.contract(address=token_address, abi=self.erc20_abi)
            
            # 获取代币余额、符号、和小数位
            try:
                balance = token_contract.functions.balanceOf(addr).call()
                decimals = token_contract.functions.decimals().call()
                symbol = token_contract.functions.symbol().call()
            except Exception as e:
                print(f"Error fetching data for token {token_address}: {e}")
                continue

            # 转换为可读余额
            readable_balance = balance / (10 ** decimals)
            balances[symbol] = readable_balance

        balance_wei = self.web3.eth.get_balance(addr)
        balance_ether = self.web3.from_wei(balance_wei, 'ether')
        balances['ETH'] = balance_ether
        return balances