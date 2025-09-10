from time import sleep
from typing import Callable, Tuple, Optional, Awaitable
from urllib.parse import urlparse
from dataclasses import dataclass

from DrissionPage import WebPage
from DrissionPage.items import ChromiumElement
from loguru import logger

from py_app.db.helper import GetTwitterToken, MaskTwitterTokenBlank, MaskTwitterTokenUse
from py_app.exception.error import BlankException, RetryException
from ..browser.browser import race, wait_for
from ..utils import get_timestamp
from .x import TwitterAPI

@dataclass
class TwitterAuthConfig:
    project: str
    auth_btn: str
    token: str = ''
    verify_follow: int = 0
    ip: str = ''
    stop_flag: str = ''
    x_query: str = ""
    new_tab: bool = True

class TwitterAuthenticator:
    """Handles Twitter authentication operations"""

    SUSPENDED_SELECTORS = [
        'x://*[contains(text(), "Your account is suspended")]',
        'x://*[contains(text(),"Your account has been locked")]',
        'x://*[contains(text(), "Access Denied")]'
    ]

    def __init__(self, token: str, url: str = 'https://twitter.com'):
        self.token = token
        self.url = url
        self._domain = urlparse(url).hostname

    def _set_cookies(self, page: WebPage) -> None:
        """Set required cookies for authentication"""
        end = get_timestamp(365)
        cookies = [
            {'name': 'auth_token', 'value': self.token, 'domain': ".x.com", 'expires': end},
            {'name': 'auth_token', 'value': self.token, 'domain': self._domain, 'expires': end}
        ]
        page.set.cookies(cookies)

    def check_suspended(self, page: WebPage, timeout: int = 3) -> bool:
        """Check if account is suspended"""
        return any(page.ele(selector, timeout=timeout) for selector in self.SUSPENDED_SELECTORS)

class TwitterConnector(TwitterAuthenticator):
    """Handles Twitter connection and authentication"""

    def connect(self, page: WebPage, close: bool = True) -> bool:
        """Connect to Twitter using the provided token"""
        self._set_cookies(page)
        n = page.new_tab(url='https://x.com')
        wait_for(n)

        try:
            return self._verify_connection(n)
        except BlankException:
            return False
        finally:
            if close and n:
                n.close()

    def _verify_connection(self, page: WebPage) -> bool:
        """Verify the Twitter connection status"""
        def blank(_) -> bool:
            raise BlankException("Twitter账号已被暂停")

        def success(_) -> bool:
            return True

        selectors = {
            'x://*[contains(text(), "Your account is suspended")]': blank,
            'x://a[@data-testid="SideNav_NewTweet_Button"]': success,
            'x://a[@data-testid="loginButton"]': blank,
            'x://div[contains(text(), "Your account has been locked")]': blank
        }

        ok, _ = race(page=page, ele=selectors)
        if ok and page.ele(self.SUSPENDED_SELECTORS[0], timeout=5):
            return False
        return ok

class TwitterAuthFrontend(TwitterConnector):
    """Handles frontend authentication flows"""

    def authenticate(self, page: WebPage, stop_flag: str = '', max_retries: int = 5) -> bool:
        """Perform frontend authentication"""
        wait_for(page)

        for _ in range(max_retries):
            if self.check_suspended(page):
                raise BlankException("Twitter账号已被暂停或锁定")

            try:
                if self._try_auth_flow(page, stop_flag):
                    return True
            except RetryException:
                logger.debug("Twitter authForFrontend 需要重试")
                continue

        return False

    def _try_auth_flow(self, page: WebPage, stop_flag: str) -> bool:
        """Single attempt at authentication flow"""
        def retry(_) -> bool:
            page.refresh(True)
            raise RetryException("Twitter 需要重试")

        def click_button(e: ChromiumElement) -> bool:
            return e.click()

        actions = {
            '#allow': click_button,
            'x://button[@data-testid="OAuth_Consent_Button"]': click_button,
            '.:errorContainer': retry
        }

        ok, msg = race(page=page, ele=actions, timeout=30)
        if ok or (stop_flag and page.ele(stop_flag, timeout=2)):
            return True
        logger.debug(f"Twitter authForFrontend error: {msg}")

        return False

class TwitterAuthManager:
    """Manages the complete Twitter authentication process"""

    @staticmethod
    async def get_verified_account(
        page: WebPage,
        config: TwitterAuthConfig,
        blank_fn: Optional[Callable[[str], Awaitable[None]]] = None,
        get_token_fn: Optional[Callable[[str], Awaitable[None]]] = None,
        source: Optional[Callable[[], Awaitable[Tuple[str, str]]]] = None
    ) -> Optional[TwitterAuthFrontend]:
        """Get a verified Twitter account"""
        for _ in range(10):
            token, username = await TwitterTokenHandler.get_token(
                config, source, get_token_fn
            )
            if not token:
                break

            if config.verify_follow > 0 and username and not await TwitterFollowerChecker.verify_follow_count(
                    token, config.ip, username, config.verify_follow, blank_fn, config.project
                ):
                continue

            twitter = TwitterAuthFrontend(token)
            if not twitter.connect(page):
                await TokenStatusHandler.handle_blank_token(token, config.project, blank_fn)
                continue

            await MaskTwitterTokenUse(token, config.project)
            return twitter

        return None

class TwitterTokenHandler:
    """Handles Twitter token related operations"""

    @staticmethod
    async def get_token(
        config: TwitterAuthConfig,
        source: Optional[Callable[[], Awaitable[Tuple[str, str]]]] = None,
        get_token_fn: Optional[Callable[..., Awaitable[None]]] = None
    ) -> Tuple[str, str]:
        """Retrieve and process Twitter token"""
        token = config.token
        username = ''

        async def _source():
            x = await GetTwitterToken(config.project, where=config.x_query)
            return x.token, x.username

        if not token:
            if not source:
                source = _source

            token, username = await source()
            if get_token_fn and token:
                await get_token_fn(token, username)

        return token, username

class TokenStatusHandler:
    """Handles token status updates"""

    @staticmethod
    async def handle_blank_token(
        token: str,
        project: str = '',
        blank_fn: Optional[Callable[[str], Awaitable[None]]] = None,
        is_blocked: int = 1
    ) -> None:
        """Handle blank/invalid tokens"""
        if project:
            await MaskTwitterTokenBlank(token, project,is_blocked)
        if blank_fn:
            await blank_fn(token)

class TwitterFollowerChecker:
    """Handles follower count verification"""

    @staticmethod
    async def verify_follow_count(
        token: str,
        ip: str,
        username: str,
        min_follow: int,
        blank_fn: Optional[Callable[[str], Awaitable[None]]] = None,
        project: str = ''
    ) -> bool:
        """Verify if account meets minimum follower count"""
        ft = TwitterFollowerChecker.get_follower_count(token, ip, username)
        if ft >= min_follow:
            return True

        logger.info(f"Twitter {username} follow count {ft} < {min_follow}")
        await TokenStatusHandler.handle_blank_token(token, project, blank_fn, is_blocked=2)
        return False

    @staticmethod
    def get_follower_count(token: str, ip: str, username: str) -> int:
        """Get follower count for a Twitter account"""
        x_api = TwitterAPI(token=token, ip=ip)
        x_api.Sign()
        info = x_api.info(username)
        return info.get('legacy', {}).get("followers_count", 0)

async def auto_x_auth(
    page: WebPage,
    config: TwitterAuthConfig,
    blank_fn: Optional[Callable[[str], Awaitable[None]]] = None,
    get_token_fn: Optional[Callable[[str], Awaitable[None]]] = None,
    source: Optional[Callable[[], Awaitable[Tuple[str, str]]]] = None
) -> bool:
    """Main function to automate Twitter authentication"""
    if not page.ele(config.auth_btn):
        raise Exception("未找到授权按钮")

    for _ in range(5):
        twitter = await TwitterAuthManager.get_verified_account(
            page, config, blank_fn, get_token_fn, source
        )
        if not twitter:
            raise Exception("未找到可用的推特账号")

        page.set.activate()
        auth_page = await navigate_to_auth_page(page, config)
        sleep(3)

        try:
            if twitter.authenticate(auth_page, config.stop_flag):
                return True
        except BlankException:
            await TokenStatusHandler.handle_blank_token(twitter.token, config.project, blank_fn)
            auth_page.close()
        except Exception as e:
            logger.error(f"授权推特失败：{e}")
            return False

    return False

async def navigate_to_auth_page(page: WebPage, config: TwitterAuthConfig) -> WebPage:
    """Navigate to authentication page based on configuration"""
    if config.new_tab:
        auth_page = page.ele(config.auth_btn).click.for_new_tab()
    else:
        if not page.ele(config.auth_btn).click():
            raise Exception("点击授权按钮失败")
        auth_page = page
    return auth_page if auth_page else page
