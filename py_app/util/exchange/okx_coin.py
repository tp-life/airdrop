import okx.Funding as Funding


class OkxService:
    def __init__(self, apikey, secretkey, passphrase,proxy=None):
        # API 初始化
        self.apikey = apikey
        self.secretkey = secretkey
        self.passphrase = passphrase
        self.proxy = proxy
        flag = "0"  # 实盘: 0, 模拟盘: 1
        self.fundingAPI = Funding.FundingAPI(apikey, secretkey, passphrase, False, flag, proxy=proxy)

    def withdrawal(self, ccy, toAddr, amt, dest, chain):
        """
        提币
        :param ccy: 币种
        :param toAddr: 提币地址
        :param amt: 提币数量
        :param dest: 提币来源
        :param chain: 提币链
        :return: 返回结果
        """
        flag = "0"  # 实盘: 0, 模拟盘: 1

        # fundingAPI = Funding.FundingAPI(self.apikey, self.secretkey, self.passphrase, False, flag, proxy=self.proxy)

        # 提币
        result = self.fundingAPI.withdrawal(
            ccy=ccy,
            toAddr=toAddr,
            amt=amt,
            dest=dest,
            chain=chain
        )
        print(result)
        if result.get('code') != '0':
            raise Exception(result.get('msg'))
        return result.get('data')


    def queryCoin(self, ccy=''):
        """
        查询币种列表
        :return: 返回结果
        """
        flag = "0"  # 实盘: 0, 模拟盘: 1
        # fundingAPI = Funding.FundingAPI(self.apikey, self.secretkey, self.passphrase,False, flag,proxy=self.proxy)
        # 获取币种列表
        result = self.fundingAPI.get_currencies(ccy)
        if result.get('code') != '0':
            raise Exception(result.get('msg'))
        
        data = result.get('data',[])
        if len(data) == 0 :
            return []
        return data

    def queryBalances(self,coin:str = ''):
        flag = "0"  # 实盘: 0, 模拟盘: 1

        # fundingAPI = Funding.FundingAPI(self.apikey, self.secretkey, self.passphrase,False, flag,proxy=self.proxy)

        # 获取资金账户余额
        result = self.fundingAPI.get_balances(ccy=coin)
        if result.get('code') != '0':
            raise Exception(result.get('msg'))
        
        data = result.get('data',[])
        if len(data) == 0 :
            return 0
        return data[0].get('availBal', 0)
    