import time
from enum import Enum
from dataclasses import dataclass
from typing import Optional
from DrissionPage._elements.chromium_element import ChromiumElement
from DrissionPage import WebPage, ChromiumPage
from py_app.util.browser.browser import click_by, input_content, wait_for, get_text
from py_app.util.wallet.browser_wallet import WalletBrowser
from py_app.util.wallet.metamask import WalletDoSomethingOption


class OpType(Enum):
    CLICK = 1 # 点击
    INPUT = 2 # 输入
    WAIT = 3 # 等待
    TEXT = 4 # 获取文本
    WALLET = 5 # 钱包do something

@dataclass
class BrowserOpType:
    type: OpType
    ele: str = ""
    timeout: int = 0
    sleep: float = 0.5
    content: str = ""
    wallet: Optional[WalletBrowser] = None
    num: int = 1
    wait: bool = True
    raise_err: bool = True

    def getEle(self, page: ChromiumPage) -> ChromiumElement:
        _e =  page.ele(self.ele, timeout= self.timeout)
        if not _e and self.raise_err:
            raise ValueError(f"未找到{self.ele}相关元素")
        return _e

    def _do(self, page: ChromiumPage):
        if self.sleep:
            time.sleep(self.sleep)

        result = False
        if self.type == OpType.CLICK:
            for _ in range(self.num):
                result = click_by(page, self.ele, timeout=self.timeout, _wait=self.wait, showMsg=True)
                if not result:
                    return  result
                time.sleep(0.1)
        elif self.type == OpType.INPUT:
            for _ in range(self.num):
                result = input_content(page, self.ele, content=self.content, timeout=self.timeout, showMsg=True)
                if not result:
                    return  result
                time.sleep(0.1)
        elif self.type == OpType.WAIT:
            result = wait_for(page, self.ele, timeout=self.timeout)
        elif self.type == OpType.TEXT:
            return get_text(page, self.ele, timeout=self.timeout)
        elif self.type == OpType.WALLET:
            ok = self.wallet.doSomething(WalletDoSomethingOption(max_idle=self.num))
            return ok

        if not result and self.raise_err:
            raise ValueError(f"{self.ele}元素 {self.type}失败")

        return  result

    def do(self, page: ChromiumPage):
        return self._do(page)


def _click(ele ="", _sleep = 0.45, timeout = 5, num = 1):
    return BrowserOpType(OpType.CLICK, ele, timeout=timeout, num=num, sleep=_sleep)

def _input(ele="", content="", _sleep = 0.45, timeout = 5):
    return  BrowserOpType(OpType.INPUT, ele, timeout=timeout, content=content,sleep=_sleep)

def _wallet( wallet = None ,num = 3):
    return  BrowserOpType(OpType.WALLET, wallet = wallet, num=num)

def _wait(ele = "", _sleep = 0.45, timeout = 30):
    return  BrowserOpType(OpType.WAIT, ele=ele, timeout=timeout,sleep=_sleep)

def _text(ele = '',_sleep = 0.45, timeout = 10):
    return BrowserOpType(OpType.TEXT, ele=ele, timeout=timeout,sleep=_sleep)


def do_browser_op(page: WebPage, op: list[BrowserOpType] = None):
    if not op:
        return True

    try:
        for o in op:
            if not o.do(page):
                return False
            time.sleep(0.1)
    except Exception as e:
        print(e)
        return False

    return True
