import time
from DrissionPage import WebPage
from DrissionPage._pages.chromium_tab import ChromiumTab
from loguru import logger
from typing import Optional, Union

from py_app.util.wallet.metamask import WalletDoSomethingOption
from py_app.util.browser.browser import click_by, input_content, wait_for,race

password = 'abc123456'
DEFAULT_SLEEP_TIME = 0.5
MAX_RETRIES = 10

class WalletDoSomethingOption:
    """Configuration options for wallet operations."""

    def __init__(self, max_idle=4, dont_close_page=False, custom_spending_cap="", click_max_btn=False):
        self.max_idle = max_idle
        self.dont_close_page = dont_close_page
        self.custom_spending_cap = custom_spending_cap
        self.click_max_btn = click_max_btn
def PhantomDoSomething(browser:WebPage, opt= None):
    if not browser:
        logger.error("Invalid browser instance received")
        sleep(5)
        return "browser == nil"

    options = opt or WalletDoSomethingOption()
    idle_count = 0

    for _ in range(MAX_RETRIES):
        idle_count += 1
        if idle_count > options.max_idle:
            break
        try:
            wallet_page = browser.get_tab(
                url="bfnaelmomeimhlpmgjnjophhpkkoljpa"
            )  # 获取浏览器所有页面

            if not wallet_page:
                time.sleep(1)
                continue
        except Exception as e:
            time.sleep(1)
            continue

        # if wait_for(wallet_page,ele='x://*[@data-testid="primary-button"]',timeout=60) or wait_for(wallet_page,ele='x://button[text()="Confirm anyway"]',timeout=60):
        #     logger.info(f"phantom 找到确认按钮")
        if not wait_either(wallet_page, timeout=60):
            return False
        for _ in range(MAX_RETRIES):
            if not _click_primary_button(wallet_page):
                break

        time.sleep(1)
    return True

# def ImportWithWords(browser:WebPage, words: str):
#     if not browser:
#         logger.error("MetaMaskImport() 收到无效的 browser")
#         return False
#
#     page = GetWallet(browser)
#     if not page:
#         return False
#
#     arrWords = words.split(" ")
#     if len(arrWords) != 12:
#         return False
#
#     if not click_by(page=page, ele='x://button[@data-testid="import-recovery-phrase-button"]'):
#         return False
#
#     time.sleep(0.5)
#
#     for i in range(len(arrWords)):
#         input_content(page=page, ele=f'x://input[@data-testid="secret-recovery-phrase-word-input-{i}"]', content=arrWords[i])
#         time.sleep(0.1)
#     # 循环点击确认按钮
#     sucess=0
#     for _ in range(10):
#         if click_by(page=page,
#                  ele='x://button[@data-testid="onboarding-form-submit-button"]',timeout=10):
#             sucess+=1
#             if sucess==2:
#                 break
#     else:
#         return False
#
#     errTimes = 0
#     try:
#         for i in range(30):
#             # 密码框
#             if page.ele('x://button[@data-testid="onboarding-form-submit-button"]', timeout=1.5):
#                 input_content(page=page, ele='x://input[@data-testid="onboarding-form-password-input"]', content=password)
#                 time.sleep(0.2)
#                 input_content(page=page, ele='x://input[@data-testid="onboarding-form-confirm-password-input"]', content=password)
#                 time.sleep(0.2)
#                 click_by(page=page, ele='x://input[@data-testid="onboarding-form-terms-of-service-checkbox" and @aria-checked="false"]')
#                 time.sleep(0.2)
#
#             if errTimes > 2:
#                 break
#
#             # dictEle = {
#             #     'x://button[@data-testid="onboarding-form-submit-button"]': lambda e: e.click(),
#             #     'x://input[@data-testid="onboarding-form-terms-of-service-checkbox"]': lambda e: e.click()
#             # }
#             # ok, _msg = race(page=page, ele=dictEle)
#             # if not ok:
#             #     errTimes += 1
#             sucess=0
#             for _ in range(10):
#                 if click_by(page=page,
#                             ele='x://button[@data-testid="onboarding-form-submit-button"]', timeout=10):
#                     sucess += 1
#                     if sucess == 2:
#                         break
#             else:
#                 return False
#             return True
#     except Exception as e:
#         logger.error(f"导入数据报错{e}")
#         pass
#     return True
def wait_either(page, timeout=60, interval=1):
    """等待两个元素中的任意一个出现，任意一个出现就返回 True"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        if page.ele('x://*[@data-testid="primary-button"]', timeout=0.5):
            return True
        if page.ele('x://button[text()="Confirm anyway"]', timeout=0.5):
            return True
        time.sleep(interval)
    return False
def ImportWithWords(browser: WebPage, words: str):
    if not browser:
        logger.error("MetaMaskImport() 收到无效的 browser")
        return False

    page = GetWallet(browser)
    if not page:
        return False

    arrWords = words.split(" ")
    if len(arrWords) != 12:
        return False

    if not click_by(page=page, ele='x://button[text()="I already have a wallet"]'):
        return False

    time.sleep(0.5)

    if not click_by(page=page, ele='x://div[text()="Import Recovery Phrase"]'):
        return False

    time.sleep(0.5)

    for i in range(len(arrWords)):
        input_content(page=page, ele=f'x://input[@data-testid="secret-recovery-phrase-word-input-{i}"]',
                      content=arrWords[i])
        time.sleep(0.1)
    # 循环点击确认按钮
    sucess = 0
    for _ in range(10):
        if click_by(page=page,
                    ele='x://button[@data-testid="onboarding-form-submit-button"]', timeout=10):
            sucess += 1
            if sucess == 2:
                break
    else:
        return False

    errTimes = 0
    try:
        for i in range(30):
            # 密码框
            if page.ele('x://button[@data-testid="onboarding-form-submit-button"]', timeout=1.5):
                input_content(page=page, ele='x://input[@data-testid="onboarding-form-password-input"]',
                              content=password)
                time.sleep(0.2)
                input_content(page=page, ele='x://input[@data-testid="onboarding-form-confirm-password-input"]',
                              content=password)
                time.sleep(0.2)
                click_by(page=page,
                         ele='x://input[@data-testid="onboarding-form-terms-of-service-checkbox" and @aria-checked="false"]')
                time.sleep(0.2)

            if errTimes > 2:
                break

            # dictEle = {
            #     'x://button[@data-testid="onboarding-form-submit-button"]': lambda e: e.click(),
            #     'x://input[@data-testid="onboarding-form-terms-of-service-checkbox"]': lambda e: e.click()
            # }
            # ok, _msg = race(page=page, ele=dictEle)
            # if not ok:
            #     errTimes += 1
            sucess = 0
            for _ in range(10):
                if click_by(page=page,
                            ele='x://button[@data-testid="onboarding-form-submit-button"]', timeout=10):
                    sucess += 1
                    if sucess == 2:
                        break
            else:
                return False
            if not click_by(page=page, ele='x://button[text()="Continue"]'):
                return False

            time.sleep(0.5)

            return True
    except Exception as e:
        logger.error(f"导入数据报错{e}")
        pass
    return True

def ImportWithPrivate(browser:WebPage, pk: str):
    if not browser:
        logger.error("MetaMaskImport() 收到无效的 browser")
        return False

    page = GetWallet(browser)
    if not page:
        return False

    time.sleep(0.5)

    if not click_by(page=page, ele='x://div[@data-testid="settings-menu-open-button"]'):
        return False

    time.sleep(0.6)

    if not click_by(page=page, ele='x://div[@data-testid="sidebar_menu-button-add_account"]'):
        return False

    time.sleep(0.6)

    if not click_by(page=page, ele='x://p[contains(text(), "导入私钥")]'):
        return False

    time.sleep(0.6)

    if not input_content(page=page, ele='x://input[name="name"]', content="phantom"):
        return False

    if not input_content(page=page, ele='x://textarea[name="privateKey"]', content=pk):
        return False

    time.sleep(0.5)

    if not click_by(page=page, ele='x://button[type="submit"]'):
        return False

    time.sleep(1)
    page.close()
    return True

def GetWallet(browser:WebPage) ->WebPage:
    try:
        wallet_page = browser.get_tab(
            url="chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/onboarding.html"
        )  # 获取浏览器所有页面
        if not wallet_page:
            wallet_page = browser.new_tab("chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/onboarding.html")
    except Exception as e:
        logger.warning("未找到页面，继续尝试")
        time.sleep(1)
        wallet_page = browser.new_tab("chrome-extension://bfnaelmomeimhlpmgjnjophhpkkoljpa/onboarding.html")

    wait_for(wallet_page)
    wallet_page.clear_cache()
    wallet_page.set.activate()
    return wallet_page

def _click_primary_button(page: Union[ChromiumTab, WebPage]) -> bool:
    """Click the primary button if available."""
    # return click_by(page, 'x://*[@data-testid="primary-button"]', timeout=3, _wait=False)
    actions = {
        'x://*[@data-testid="primary-button"]': lambda e: e.click(),
        'x://button[text()="Confirm anyway"]': lambda e: e.click()
    }

    ok, msg = race(page=page, ele=actions, timeout=3)
    if ok:
        return True
    # return (
    #         click_by(page, 'x://*[@data-testid="primary-button"]', timeout=3, _wait=False)
    #         or click_by(page, 'x://button[text()="Confirm anyway"]', timeout=3, _wait=False)
    # )
