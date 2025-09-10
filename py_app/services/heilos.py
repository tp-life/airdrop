
from loguru import logger
from py_app.exception.error import NoTaskException
from py_app.util.evm.evm_tool import sign_message
from time import sleep
from py_app.services.base import BaseService
from py_app.decorators import register
from py_app.util.utils import get_one_ip

@register("heilos")
class Heilos(BaseService):

    table = "heilos"
    code = "ZENITH-COSMIC-104"

    @property
    def headers(self):
        return {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://testnet.helioschain.network',
            'priority': 'u=1, i',
            'referer': 'https://testnet.helioschain.network/',
            'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
          }

    async def getIP(self):
        for _ in range(10):
            ip = get_one_ip(num = 10, timeout=10)
            account = await self.get_account("register_ip = :ip", {"ip": ip}, hasIP=False, raise_err=False, onlyWhere=True, lockedField='')
            if not account:
                return ip
        return ''

    async def work(self):
        sql = 'is_register = 0'
        account = await self.get_account(sql, hasIP=False)

        ip = await self.getIP()
        if not ip:
            logger.error("没有获取到一个可用的IP地址，可能其他的IP地址已经被使用过了")
            raise NoTaskException()

        self.ip = ip
        ok = await self.register(account)
        if not ok:
            return
        await self.startStep("add_helios_network")
        sleep(1)
        await self.complete("add_helios_network", "network_added")
        sleep(1)
        await self.startStep("claim_from_faucet")
        sleep(1)
        await self.complete("claim_from_faucet", "faucet_claimed")
        sleep(1)
        await self.startStep("mint_early_bird_nft")
        sleep(1)
        await self.complete("mint_early_bird_nft", "nft_minted")
        sleep(1)
        await self.claimReward()
        code = await self.getInfo()
        if code:
            await self.update_account("id = :id", {"referral_code": code}, {"id": account.get("id")})


    async def get_referral(self):
        account = await self.get_account("referral_code > '' AND referral_toal < 50", lockedField='referral_locked', lock_at=3, orderBy="referral_toal desc", hasIP=False, raise_err=False)
        if not account:
            return self.code

        return account.get('referral_code')

    async def register(self, account):


        message = f'Welcome to Helios! Please sign this message to verify your wallet ownership.\n\nWallet: {account["addr"]}'
        sign = sign_message(account['pk'], message)
        code = await self.get_referral()
        for _ in range(5):

            payload = {
            "wallet": account.get('addr'),
            "signature": sign,
            "inviteCode": code
            }

            url = "https://testnet-api.helioschain.network/api/users/confirm-account"

            def fn (resp):
                if "unavailable" in resp.text:
                    return {'token': 'xxxx', 'code':'code'}

                if "IP address" in resp.text:
                    return {'token': 'xxxx', 'code':'ip'}

            res = self.make_request('post', url, data=payload,fial_callback_fn=fn)
            if not res or not  res.get('token'):
                logger.error("注册账号失败")
                return False

            if res.get('code', '') == 'code':
                code = await self.get_referral()
                continue

            if res.get('code', '') == 'ip':
                ip = await self.getIP()
                if not ip:
                    logger.error("没有获取到一个可用的IP地址，可能其他的IP地址已经被使用过了")
                    raise NoTaskException()

                self.ip = ip
                continue

            if res:
                await self.update_account("id =:id", {"is_register":1,"register_ip": self.ip}, {"id": account['id']})
                await self.update_account("referral_code = :code", "referral_toal = referral_toal +1", {"code":code})
                self.jwt_token = res.get('token')
            return res
        return None

    async def startStep(self, step: str):
        data = {
          "stepKey": step
        }
        url = "https://testnet-api.helioschain.network/api/users/onboarding/start"
        res = self.make_request("post", url, data= data)
        return res


    async def complete(self, step:str, flag: str):
        data= {"stepKey":step,"evidence":flag}
        url = "https://testnet-api.helioschain.network/api/users/onboarding/complete"
        res = self.make_request("post", url, data= data)
        return res

    async def claimReward(self):
        url ="https://testnet-api.helioschain.network/api/users/onboarding/claim-reward"
        data = {"rewardType":"xp"}
        res = self.make_request("post", url, data= data)
        return res

    async def getInfo(self):
        url ="https://testnet-api.helioschain.network/api/users/referrals?page=1&limit=1"
        resp = self.make_request("get", url)
        if not resp or not resp.get("success"):
            return None

        code = resp.get("referralCode")
        return code
