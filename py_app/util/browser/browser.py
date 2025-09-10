import platform
import os
import random
import shutil
import time
from typing import Callable, Any

import psutil
from DrissionPage import ChromiumPage, ChromiumOptions, Chromium
from DrissionPage._pages.web_page import WebPage
from DrissionPage.items import ChromiumElement, NoneElement
from DrissionPage._functions.elements import get_eles
from loguru import logger
from py_app.config import settings
from py_app.util.utils import get_pid_by_port, kill_process, random_string
from fake_useragent import UserAgent
import atexit
from contextlib import AbstractContextManager


glTimeout = settings.APP.timeout


class BrowserDriver(AbstractContextManager):

    driver: WebPage = None
    userDir: str
    debugMode = False

    def __init__(self,
                 driverBinary="",
                 extPath=settings.APP.ext_path,
                 exts=[],
                 userDir='',
                 releateUserDir=True,
                 proxy="",
                 noImg=False,
                 cache_path='',
                 rand_user_path=True,
                 rand_user_agent=False,
                 timeout=120,
                 debug_port=None,
                 ):

        if releateUserDir:
            self.userDir = os.path.join("_browser_user_data", userDir)
        else:
            self.userDir = userDir

        if rand_user_path:
            self.userDir = self.userDir+'-' + random_string(6)

        port = self.randomPort()

        if debug_port:
            self.debugMode = True
            port = debug_port

        self.port = port

        co = ChromiumOptions().set_local_port(port)
        co.no_imgs(noImg)

        try:
            if not os.path.exists(self.userDir):
                os.makedirs(self.userDir)

            co.set_user_data_path(self.userDir).set_timeouts(
                page_load=timeout, base=60)
            co.set_argument(
                "--proxy-bypass-list", "update.googleapis.com,*.update.googleapis.com,safebrowsing.googleapis.com,*.gvt1.com,*.gvt1-cn.com")
            co.set_pref("credentials_enable_service", False)
            co.set_pref("settings.language.preferred_languages", "en-US")
            co.set_pref("intl.accept_languages", "en-US,en")
            co.set_argument("--hide-crash-restore-bubble")
            if proxy != "":
                co = co.set_proxy(proxy)

            if settings.APP.exe != "":
                co.set_browser_path(settings.APP.exe)

            if driverBinary != "":
                co = co.set_browser_path(driverBinary)

            if cache_path != "":
                co = co.set_cache_path(cache_path)
                co = co.set_argument("--enable-application-cache")

            for ext in exts:
                co = co.add_extension(os.path.join(
                    extPath, ext) if extPath else ext)

            if rand_user_agent:
                ua = UserAgent(browsers=["chrome"], os=[
                               "macos", "windows"], min_version=120)
                co.set_user_agent(user_agent=ua.random)
            # shutil.rmtree(self.userDir)
            co = co.set_argument("--disable-extensions-file-access-check").set_argument("--safebrowsing-disable-extension-blacklist").set_argument(
                "--disable-extensions-http-throttling").set_argument("--allow-running-insecure-content").set_argument("--no-sandbox")

            self.driver = WebPage(chromium_options=co)
            self.pid = self.driver.process_id
            logger.info(f"浏览器启动成功, pid:{self.pid}")
            self.loading_captcha(exts)
            atexit.register(self.close)
        except Exception as e:
            self.close()
            self._cleanup_on_fail()
            raise RuntimeError(f"浏览器启动错误: {e}")

    def _cleanup_on_fail(self):
        """清理因启动失败而残留的进程和数据"""
        _p = get_pid_by_port(self.port)
        if _p:
            kill_process(_p)
        shutil.rmtree(self.userDir, ignore_errors=True)

    def __enter__(self):
        """支持 with 语法"""
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        """with 语句退出时，确保浏览器关闭"""
        self.close()

    def randomPort(self):
        return random.randint(9600, 59600)

    def open(self, url: str, timeout=glTimeout) -> ChromiumPage:
        page = self.driver.get(url, show_errmsg=True, timeout=timeout)
        # self.driver.set.window.max()
        wait_for(self.driver)
        self.driver.set.activate()
        return self.driver

    def newTab(self, url: str, others=False) -> ChromiumPage:
        page = self.driver.new_tab(url)
        if others:
            self.driver.close_tabs(others=True)
        return page

    def max(self):
        self.driver.set.window.max()

    # 关闭浏览器，并清除缓存
    def close(self, clearCache: bool = True):

        if not self.driver:
            return

        if self.debugMode:
            return

        try:
            self.driver.quit()
        except Exception as e:
            logger.error(f"关闭浏览器失败: {e}")

        try:
            kill_process(self.pid)
        except Exception as e:
            logger.error(f"关闭进程失败: {e}")

        if not clearCache:
            return

        try:
            remove_directory(self.userDir)
            logger.success(f"删除目录成功：{self.userDir}")
        except Exception as e:
            logger.error(f"删除目录失败: {e}")

    def loading_captcha(self, exts=[]):
        if settings.BROWSER_EXT.nope in exts:
            if not settingNope(self.driver):
                self.close()
                raise ValueError("nope 验证码插件加载失败")

        if settings.BROWSER_EXT.yesCaptcha in exts:
            if not settingYesCaptcha(self.driver):
                self.close()
                raise ValueError("YesCaptcha 验证码插件加载失败")

        if settings.BROWSER_EXT.twoCaptcha in exts:
            if not settingTwoCaptcha(self.driver):
                self.close()
                raise ValueError("twoCaptcha 验证码插件加载失败")


def terminate_processes_using_path(target_path):
    """终止占用 target_path 的进程"""
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            for open_file in proc.open_files():
                if target_path in open_file.path:
                    print(
                        f"Terminating process {proc.pid} ({proc.name()}) using {target_path}")
                    proc.terminate()  # 终止进程
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue


def remove_directory(directory):
    """删除目录，自动终止 Windows 下的占用进程"""
    abs_directory = os.path.abspath(directory)  # 转换为绝对路径
    if not os.path.exists(abs_directory):
        print(f"Directory '{abs_directory}' does not exist.")
        return

    if platform.system() == "Windows":
        terminate_processes_using_path(abs_directory)  # Windows 终止占用进程

    try:
        shutil.rmtree(abs_directory, ignore_errors=True)
        print("Directory deleted successfully.")
    except Exception as e:
        print(f"Failed to delete directory: {e}")


def click_by(page: ChromiumPage | WebPage, ele: str | tuple[str, str], timeout=5, _wait: bool = True, showMsg=False) -> bool:
    if _wait and not wait_for(page, ele, 30):
        logger.error(f"{ele}元素未找到")
        return False
    try:
        el = page.ele(ele, timeout=timeout)
        if not el:
            return False
        # return  el.wait.clickable().click()
        return el.click()
    except Exception as e:
        showMsg and logger.debug(f"{ele} 元素点击失败。{e}")
        return False


def input_content(page: ChromiumPage | WebPage, ele: str, content: str, timeout=5, showMsg=False) -> bool:
    try:
        el = page.ele(ele, timeout=timeout)
        return el.input(vals=content, clear=True) if el else False
    except Exception as e:
        showMsg and logger.debug(f"{ele} 元素输入{content}失败。{e}")
        return False


def wait_for(page: ChromiumPage | WebPage, ele: str | tuple[str, str] = None, timeout=glTimeout) -> bool:
    return page.wait.ele_displayed(ele, timeout=timeout) if ele else page.wait.doc_loaded(timeout=timeout)


def get_text(page: ChromiumPage, ele: str, timeout=glTimeout, raw=False) -> str:
    return page.ele(ele, timeout=timeout).raw_text if raw else page.ele(ele, timeout=timeout).text


# 多选择器匹配，执行满足条件的第一个，否则返回False。
# 主要用于需要根据不同的元素执行不同的操作的场景， 如登录成功或失败的场景
def race(page: ChromiumPage | WebPage, ele: dict[str, Callable[[ChromiumElement], Any]], timeout=glTimeout):
    el = get_eles(locators=ele.keys(), owner=page,
                  timeout=timeout, any_one=True)
    if not el:
        return False, '等待元素超时'

    for key, value in el.items():
        if value and value is not NoneElement:
            return ele.get(key)(value), ""

    return False, '等待元素超时'


def settingNope(wp: WebPage):

    page = wp.new_tab(
        "chrome-extension://dknlfmjaanfblgfdfebhijalfmhmjjjo/popup.html")
    wait_for(page)
    page.set.activate()
    for key in settings.APP.nope_keys:
        if not click_by(page, ele=".:key-icon"):
            page.close()
            return False
        if not input_content(page, ele=".:key-input", content=key):
            page.close()
            return False

        time.sleep(1)

        if not click_by(page, ele="t:span@@title=Credits remaining"):
            page.close()
            return False

        time.sleep(1)

        total = get_text(page, ele="t:span@@title=Credits remaining")
        if not total:
            continue

        if total != "0":
            page.close()
            return True
    page.close()
    return False


def settingYesCaptcha(wp: WebPage):

    page = wp.new_tab(
        "chrome-extension://jiofmdifioeejeilfkpegipdjiopiekl/option/index.html")
    wait_for(page)
    page.set.activate()
    for key in settings.APP.yesCaptcha_keys:

        if not input_content(page, ele=".:MuiInput-input", content=key):
            return False

        time.sleep(1)

        if not click_by(page, ele='x://button[contains(text(),"save")]'):
            return False

        time.sleep(1)

    text = page.ele(".:MuiInput-input").value
    if not text:
        return False

    if not click_by(page, ele='x://span[text()="cloudflare"]'):
        return True

    if not click_by(page, ele='.:PrivateSwitchBase-input'):
        return True

    click_by(page, ele='x://button[contains(text(), "save")]')

    return True


def settingTwoCaptcha(wp: WebPage):
    page = wp.new_tab(
        "chrome-extension://ifibfemgeogfhoebkmokieepdoobkbpo/options/options.html")
    wait_for(page)
    page.set.activate()
    # page.set.auto_handle_alert()
    inputEl = 'x://input[@name="apiKey"]'
    for key in settings.APP.twoCaptcha_keys:

        if not input_content(page, inputEl, content=key):
            return False

        time.sleep(1)

        if not click_by(page, ele='x://button[@data-lang="login"]'):
            return False

        time.sleep(1)

    text = page.handle_alert()
    if "成功" in text:
        return True
    return False


# def selectYesCaptchaOnCf(wp: WebPage):
