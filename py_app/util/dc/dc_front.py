from time import sleep
from typing import Callable, Optional, Awaitable
from dataclasses import dataclass

from DrissionPage import WebPage
from loguru import logger

from py_app.db.helper import GetDcToken, MaskDcTokenBlank, MaskDcTokenUse
from py_app.exception.error import BlankException
from py_app.util.browser.browser import race, wait_for, click_by

@dataclass
class DCAuthConfig:
    project: str
    auth_btn: str
    token: str = ''
    dc_query: str=''
    max_retries: int = 5
    token_attempts: int = 10
    new_tab: bool = True

class DiscordAuthenticator:
    """Handles Discord authentication operations"""

    LOGIN_SELECTORS = [
        'x://button[contains(@class, "colorBrand")]',
        'x://input[@name="email"]'
    ]

    def __init__(self, token: str):
        self.token = token

    def _inject_token(self, page: WebPage) -> bool:
        """Inject Discord token into localStorage"""
        try:
            page.run_js('''
                const iframe = document.createElement('iframe');
                document.head.append(iframe);
                const pd = Object.getOwnPropertyDescriptor(iframe.contentWindow, 'localStorage');
                iframe.remove();
                Object.defineProperty(window, 'localStorage', pd);
            ''')

            page.run_js('''
                window.localStorage.setItem('token','"'+arguments[0]+'"');
            ''', self.token)
            return True
        except Exception as e:
            logger.error(f"Discord token injection failed: {e}")
            return False

    def connect(self, page: WebPage) -> bool:
        """Connect to Discord using the provided token"""
        auth_page = page.new_tab("https://discord.com")
        wait_for(page=auth_page)

        try:
            return self._inject_token(auth_page)
        finally:
            auth_page.close()

    def _wait_for_login_page(self, page: WebPage) -> None:
        """Wait for Discord login page to load"""
        for _ in range(10):
            if any(page.ele(selector, timeout=20) for selector in self.LOGIN_SELECTORS):
                return
            page.refresh()
            sleep(2)

    def authenticate(self, page: WebPage) -> bool:
        """Perform Discord authentication"""
        self._wait_for_login_page(page)

        def handle_blank(_) -> bool:
            raise BlankException("账号已禁用")

        def handle_auth_button(e: WebPage) -> bool:
            for _ in range(10):
                sleep(2)
                if click_by(page=page, ele=e):
                    return True
                logger.debug(f"Auth button click failed: {e}")
            return False

        handlers = {
            self.LOGIN_SELECTORS[1]: handle_blank,
            self.LOGIN_SELECTORS[0]: handle_auth_button
        }

        ok, _ = race(page=page, ele=handlers, timeout=120)
        return ok

class DCAuthManager:
    """Manages the complete Discord authentication process"""

    @staticmethod
    async def get_valid_token(
        config: DCAuthConfig,
        page: WebPage,
        blank_fn: Optional[Callable[[str], Awaitable[None]]] = None,
        get_token_fn: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> Optional[DiscordAuthenticator]:
        """Get a working Discord token"""
        token = config.token

        for _ in range(config.token_attempts):
            if not token:
                token_data = await GetDcToken(config.project)  # Changed to await
                if not token_data:
                    break

                if get_token_fn:
                    await get_token_fn(token_data.token)  # Changed to await
                token = token_data.token

            dc = DiscordAuthenticator(token)
            if dc.connect(page):
                await MaskDcTokenUse(token, config.project)  # Changed to await
                return dc

            await DCAuthManager.handle_invalid_token(token, config.project, blank_fn)  # Changed to await
            token = ''

        return None

    @staticmethod
    async def handle_invalid_token(
        token: str,
        project: str,
        blank_fn: Optional[Callable[[str], Awaitable[None]]]
    ) -> None:
        """Process invalid tokens"""
        await MaskDcTokenBlank(token, project)  # Changed to await
        if blank_fn:
            await blank_fn(token)  # Changed to await

async def auto_discord_auth(
    page: WebPage,
    config: DCAuthConfig,
    blank_fn: Optional[Callable[[str], Awaitable[None]]] = None,
    get_token_fn: Optional[Callable[[str], Awaitable[None]]] = None
) -> bool:
    """Main function to automate Discord authentication"""
    if not page.ele(config.auth_btn):
        raise Exception("未找到授权按钮")

    for _ in range(config.max_retries):
        dc = await DCAuthManager.get_valid_token(config, page, blank_fn, get_token_fn)  # Changed to await
        if not dc:
            raise Exception("未找到可用的DC账号")

        page.set.activate()
        auth_page = navigate_to_auth_page(page, config)
        if not auth_page:
            raise Exception("点击授权按钮失败")

        try:
            return dc.authenticate(auth_page)
        except BlankException:
            await DCAuthManager.handle_invalid_token(dc.token, config.project, blank_fn)  # Changed to await
            logger.debug("授权DC失败：账号已禁用")
        except Exception as e:
            logger.error(f"授权DC失败：{e}")
            return False

    return False
def navigate_to_auth_page(page: WebPage, config: DCAuthConfig) -> WebPage:
    """Navigate to authentication page based on configuration"""
    if config.new_tab:
        auth_page = page.ele(config.auth_btn).click.for_new_tab()
    else:
        if not page.ele(config.auth_btn).click():
            raise Exception("点击授权按钮失败")
        auth_page = page
    return auth_page if auth_page else page
