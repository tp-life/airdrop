from time import sleep

from DrissionPage import WebPage
from loguru import logger

from py_app.config import settings
from py_app.util.browser.browser import BrowserDriver, wait_for
from .metamask import MetamaskImport, WalletDoSomethingOption, WalletDoSomethingOption, MetaMaskDoSomething
from .okx import ImportOKXByPrivateKey, OkxDoSomething
from .phantom import ImportWithWords, PhantomDoSomething


def okxBrowser(ip: str = "", userDir="", exts: list = [], rand_user_path=True, url="", pk=""):

    exts.append(settings.BROWSER_EXT.okx)

    browser = BrowserDriver(proxy=ip, userDir=userDir,
                            exts=exts, rand_user_path=rand_user_path)
    page = None
    if not ImportOKXByPrivateKey(browser.driver, pk):
        logger.error(f"导入钱包失败")
        return browser, None

    if url:
        page = browser.open(url)
        page.set.window.max()
        if not wait_for(page, timeout=90):
            return browser, None
        page.set.activate()
        page.close_tabs(others=True)
    return browser, page


def metaBrowser(ip: str = "", userDir="", exts=None, rand_user_path=True, url="", pk=""):

    if exts is None:
        exts = []
    exts.append(settings.BROWSER_EXT.metamask)

    browser = BrowserDriver(proxy=ip, userDir=userDir,
                            exts=exts, rand_user_path=rand_user_path)
    page = None
    if not MetamaskImport(browser.driver, pk):
        logger.error(f"导入钱包失败")
        return browser, None

    if url:
        page = browser.open(url)
        # page.set.window.max()
        if not wait_for(page, timeout=90):
            return browser, None
        page.set.activate()
        page.close_tabs(others=True)

    return browser, page


def phantomBrowser(ip: str = "", userDir="", exts=None, rand_user_path=True, url="", pk=""):

    if exts is None:
        exts = []
    exts.append(settings.BROWSER_EXT.phantom)

    browser = BrowserDriver(proxy=ip, userDir=userDir,
                            exts=exts, rand_user_path=rand_user_path)
    page = None
    if not ImportWithWords(browser.driver, pk):
        logger.error(f"导入钱包失败")
        return browser, None

    if url:
        page = browser.open(url)
        # page.set.window.max()
        if not wait_for(page, timeout=90):
            return browser, None
        page.set.activate()
        page.close_tabs(others=True)

    return browser, page


class WalletBrowser:
    browser: BrowserDriver = None
    title = ''

    def __init__(self, drive: str, ip: str = "", randUserPath=True) -> None:
        self.drive = drive
        self.ip = ip
        self.randUserPath = randUserPath

    def newBrowser(self, pk: str, userDir="", url="", exts=[]) -> tuple[BrowserDriver, WebPage]:
        browser, page = None, None
        print(self.drive)
        if self.drive == "okx":
            browser, page = okxBrowser(
                ip=self.ip, userDir=userDir, rand_user_path=self.randUserPath, pk=pk, url=url, exts=exts)
        if self.drive == "metamask":
            browser, page = metaBrowser(
                ip=self.ip, userDir=userDir, rand_user_path=self.randUserPath, pk=pk, url=url, exts=exts)
        if self.drive == "phantom":
            browser, page = phantomBrowser(
                ip=self.ip, userDir=userDir, rand_user_path=self.randUserPath, pk=pk, url=url, exts=exts)
        self.browser = browser
        return browser, page

    def doSomething(self, opts: WalletDoSomethingOption = WalletDoSomethingOption(), wait_num=30):
        fn = None
        title = ""
        if self.drive == "okx":
            fn = OkxDoSomething
            title = "OKX Wallet"
        if self.drive == "metamask":
            fn = MetaMaskDoSomething
            title = "MetaMask"
        if self.drive == "phantom":
            fn = PhantomDoSomething
            title = "Phantom"

        self.title = title
        if self._waitWallet(title=title, x=wait_num):
            return fn(self.browser.driver, opt=opts)

        return False

    def _waitWallet(self, x=30, title="") -> bool:
        for _ in range(x):
            if len(self.browser.driver.get_tabs(title=title)) > 0:
                return True
            sleep(2)

        return False
