from abc import ABC
from time import sleep
from typing import Dict, Any, Callable

from fake_useragent import UserAgent
from requests import Response


from py_app.config import settings
from py_app.db.account import QueryOneTaskV2, UpdateTask
from py_app.exception.error import NoTaskException
from py_app.util.browser.browser import BrowserDriver
from py_app.util.utils import make_request


class BaseService(ABC):
    ip: str = ""
    browser: BrowserDriver | None = None
    retry_count = 10
    table = ""

    headers = {}
    jwt_token = ''

    userAgent = ''

    def __init__(self, arg=None):
        self.arg = arg
        self.userAgent = UserAgent(browsers=["chrome"], os=[
                                   "macos", "windows"], min_version=120).random

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()

    async def run(self):
        await self.work()

    async def work(self):
        pass

    async def stop(self):
        if self.browser:
            self.browser.close()
            self.browser = None

    async def get_account(self, where: str = "", args=None, orderBy="RAND()", hasIP=True, lockedField='locked_at', saveIP=True, onlyWhere=False, raise_err=True, lock_at=30):
        onlyWhere = settings.APP.debug if not onlyWhere else onlyWhere
        if not self.table or not where:
            raise ValueError("查询缺少参数，请检查是否设定了table，where")

        account, ip = await QueryOneTaskV2(self.table, where=where, args=args, orderBy=orderBy, hasIP=hasIP, lockedField=lockedField, saveIP=saveIP, onlyWhere=onlyWhere, lockAt=lock_at)
        if not account:
            if raise_err:
                raise NoTaskException("No account available")
            return account

        if hasIP:
            if not ip:
                raise NoTaskException("No ip available")
            self.ip = ip
        return account

    async def update_account(self, where: str, doc: Dict[str, Any] | str, args=None):
        if args is None:
            args = {}

        if not doc or not where or not self.table:
            raise ValueError("更新缺少参数，请检查是否设定了table，where, doc")

        _doc = ""
        if isinstance(doc, dict):
            doc_items = []
            for key, v in doc.items():
                if not key or v is None:
                    continue
                doc_items.append(f"{key} = :{key}")
                args[key] = v
            _doc = ", ".join(doc_items)
        else:
            _doc = doc

        await UpdateTask(self.table, where, _doc, args)

    def make_request(self, method: str, url, headers=None, data=None, retry=10, fial_callback_fn: Callable[[Response], dict] | None = None, only_resp=False, files=None, overly_header=False, timeout = 60):
        if headers is None:
            headers = {}

        _h = self.headers.copy()
        if self.jwt_token:
            _h['authorization'] = f'Bearer {self.jwt_token}'

        _headers = {**_h, **headers}

        if overly_header:
            _headers = headers

        for _ in range(retry):
            rsp = make_request(url, method.upper(), data=data, header=_headers, proxy=self.ip,
                               fail_callback_fn=fial_callback_fn, only_resp=only_resp, files=files, timeout= timeout)
            if rsp is not None:
                return rsp
            sleep(1)
        return None
