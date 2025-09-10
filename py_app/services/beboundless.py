

from loguru import logger
from py_app.decorators import register
from py_app.services.base import BaseService
from py_app.util.evm.evm_tool import sign_message

@register("beboundless")
class BeboundLess(BaseService):

    table = "beboundless"

    headers = {
      'accept': '*/*',
      'accept-language': 'zh-CN,zh;q=0.6',
      'origin': 'https://manifesto.beboundless.xyz',
      'priority': 'u=1, i',
      'referer': 'https://manifesto.beboundless.xyz/',
      'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'sec-gpc': '1',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    }

    async def work(self):
        sql = "do_sign = 0"
        account = await self.get_account(sql)
        r = await self.sign(account)
        if r:
            await self.update_account("id = :id", {"do_sign": 1}, {"id": account['id']})

    async def sign(self, account):
        msg = "I have read the Boundless manifesto."
        s = sign_message(account['pk'], msg)
        url = f"https://boundless-signal.vercel.app/api/manifesto?signature={s}&address={account['addr']}&message=I+have+read+the+Boundless+manifesto."

        def fail(rs):
            if "User already has a signature" in rs.text:
                return True
            return False

        res = self.make_request('GET', url, timeout=240, fial_callback_fn=fail)
        if not res:
            logger.error("sign 错误")
            return
        return True
