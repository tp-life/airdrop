import datetime
from typing import Self

from loguru import logger
from web3 import AsyncWeb3

from py_app.util import make_request
from py_app.util.api import BaseAPIClient
from py_app.util.evm.depoly_contract import DeployContractWorker


class DeployContractByMintair():

    base_url = "https://contracts-api.mintair.xyz/api"

    @property
    def headers(self):
        return {
            'accept': '*/*',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'origin': 'https://contracts.mintair.xyz',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': 'https://contracts.mintair.xyz/',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
        }

    def __init__(self, pk: str,rpc:str , proxy:str= ''):
        self.deploy_contract_worker = DeployContractWorker(pk, rpc, proxy)
        self.wallet = self.deploy_contract_worker.eth.account.from_key(pk)
        self.proxy = proxy

    def _get_headers(self):
        _h = self.headers
        _h['wallet-address'] = self.wallet.address
        return _h

    async def check_daily_streak(self) -> bool:

        payload = {"walletAddress": self.wallet.address}

        response = make_request(self.base_url+"/v1/user/login", "POST", self.headers, data=payload, proxy=self.proxy)
        if not response.get("success"):
            logger.error("注册用户失败")
            return False


        logger.info(f"Checking to see if we can do 'Daily Streak'")
        response = make_request(self.base_url + "/v1/user/streak", "GET", self._get_headers(), proxy=self.proxy)
        logger.debug(f"Response: {response}")

        streak_data = response.get('data', {}).get('streak')

        if not streak_data:
            return True

        updated_at_str = streak_data.get('updatedAt')

        if not updated_at_str:
            return True

        updated_at = datetime.datetime.strptime(updated_at_str, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=datetime.timezone.utc)

        current_time = datetime.datetime.now(datetime.timezone.utc)

        time_difference = current_time - updated_at

        return time_difference.total_seconds() >= 24 * 3600

    async def daily_streak(self, contract_address: str, metaData=None) -> tuple[bool, str]:
        if metaData is None:
            metaData = {}
        try:
            logger.info(f"Send a request to the 'Daily Streak'")
            json_data = {
                'transactionHash': contract_address,
                'metaData': metaData,
            }

            rsp = make_request(self.base_url+"/v1/user/transaction", "POST", data=json_data, header=self._get_headers())
            if not rsp :
                logger.error(f"status_code == 404 or Account not found. error during 'Daily Streak' task. Response: {rsp}")
                return True, "Account not found"

            if rsp.get("success"):
                logger.success(f"Successfully completed the 'Daily Streak' task")
                return True, "Successfully completed the 'Daily Streak' task"

            else:
                logger.error(f"Unknown error during 'Daily Streak' task. Response: {rsp}")
                return False, "Unknown error"

        except Exception as e:
            logger.error(f"Error during 'Daily Streak' task: {str(e)}")
            return False, str(e)

    async def mintair_erc20(self, network_name:str) -> tuple[bool, str]:
        logger.info(f"Beginning the contract deployment process...")

        if not await self.check_daily_streak():
            logger.error("Waiting 24 hours")
            return True, "Waiting 24 hours"

        try:
            logger.info("Selected ERC20 contract deployment")
            status, result = await self.deploy_contract_worker.deploy_erc_20_contract()

            status, result = await self.daily_streak(result, {
                    'name': network_name,
                    'type': 'ERC-20',
                })

            return status, result

        except (ValueError, ConnectionError) as e:
            logger.error(f"Error during contract deployment: {str(e)}")
            return False, str(e)
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return False, str(e)
