from time import sleep
from DrissionPage import WebPage
from loguru import logger
from py_app.util.browser.browser import click_by, input_content, wait_for
from py_app.util.wallet.metamask import WalletDoSomethingOption

# Constants
OKX_EXTENSION_ID = "mcohilncbfahbmgdjkbpemcciiolgcge"
OKX_PASSWORD = "abc123456"
DEFAULT_WAITE_TIME=5
DEFAULT_SLEEP_TIME = 2
MAX_RETRIES = 10
MAX_IDLE_ATTEMPTS = 10


def ImportOKXByPrivateKey(browser: WebPage, private_key: str) -> bool:
    """Import an account into OKX wallet using private key."""
    if not private_key or len(private_key) < 40:
        logger.error("ImportOKXByPrivateKey() received invalid private_key")
        return False

    if not browser:
        logger.error("ImportOKXByPrivateKey() received invalid browser")
        return False

    try:
        sleep(DEFAULT_WAITE_TIME)
        page = browser.new_tab(f"chrome-extension://{OKX_EXTENSION_ID}/notification.html")
        page.clear_cache()
        page.set.activate()
        wait_for(page)
        sleep(DEFAULT_SLEEP_TIME)

        # Check if password unlock is needed
        if "请输入密码" in page.html:
            if not input_content(page=page, ele="@type=password", content=OKX_PASSWORD):
                return False
            wait_for(page)
            if not click_by(page=page, ele="tag:button@text()=解锁"):
                return False
            wait_for(page)
            page.close()
            return True

        # Execute import steps
        if not _execute_import_steps(page, private_key):
            page.close()
            return False

        page.close()
        return True

    except Exception as e:
        logger.error(f"OKX import failed: {e}")
        if 'page' in locals():
            page.close()
        return False


def _execute_import_steps(page: WebPage, private_key: str) -> bool:
    """Execute the step-by-step import process."""
    steps = [
        # (description, action_type, selector, content, timeout)
        ("Find import wallet option", "click", 'tag:button@|text():导入已有钱包@|text():Import wallet', None, 60),
        ("Select private key option", "click", 'tag:div@|text()=Seed phrase or private key@|text()=助记词或私钥', None, 30),
        ("Choose private key method", "click", 'x://div[@data-e2e-okd-tabs-pane="2"]', None, None), #
        ("Input private key field", "input", '@type=password', private_key, None),
        ("Confirm private key", "click", 'x:(//button[@data-testid="okd-button"][1])', None, None),
        ("Second confirmation", "click", 'x:(//button[@data-testid="okd-button"][2])', None, None),
        ("Password verification", "click", 'tag:div@|text():密码验证@|text()=Password', None, None),
        ("Next step button", "click", 'x://button[@data-testid="okd-button"]', None, None),
        ("First password input", "input", "x:(//input[@type='password'])[1]", OKX_PASSWORD, None),
        ("Confirm password input", "input", "x:(//input[@type='password'])[2]", OKX_PASSWORD, None),
        ("Final confirmation", "click", 'x://button[@data-testid="okd-button"]', None, None),
        ("Complete onboarding", "click", 'x://button[@data-testid="okd-button"]', None, 2)
    ]

    for step in steps:
        desc, action, selector, content, timeout = step
        logger.debug(f"Executing step: {desc}")

        try:
            wait_for(page, ele=selector, timeout=timeout or 30)
            # sleep(DEFAULT_SLEEP_TIME)

            if action == "click":
                if not click_by(page=page, ele=selector, timeout=timeout):
                    logger.error(f"Failed at step: {desc}")
                    return False
            elif action == "input":
                if not input_content(page=page, ele=selector, content=content):
                    logger.error(f"Failed at step: {desc}")
                    return False

            sleep(0.5)
        except Exception as e:
            logger.error(f"Error at step '{desc}': {str(e)}")
            return False

    return True


def ClickBtnPrimary(page: WebPage) -> bool:
    """Click the primary button in OKX interface."""
    return click_by(page, "@|class:btn-fill-highlight", timeout=5)


def OkxDoSomething(browser: WebPage, opt=None) -> bool:
    """Perform operations with OKX wallet."""
    if not browser:
        logger.error("OkxDoSomething() received invalid browser")
        sleep(5)
        return False

    options = opt or WalletDoSomethingOption()
    idle_count = 0

    for _ in range(MAX_RETRIES):
        if idle_count >= options.MaxIdle:
            break

        sleep(1)
        try:
            wallet_page = _get_okx_tab(browser)
            if not wallet_page:
                idle_count += 1
                sleep(3)
                continue

            sleep(0.5)
            if _check_insufficient_balance(wallet_page):
                return False

            for _ in range(MAX_RETRIES):
                if not ClickBtnPrimary(wallet_page):
                    break

        except Exception:
            idle_count += 1
            sleep(3)
            continue

    _close_okx_tab(browser)
    return True


def _get_okx_tab(browser: WebPage):
    """Get the OKX extension tab if it exists."""
    try:
        return browser.get_tab(url=OKX_EXTENSION_ID)
    except Exception:
        return None


def _close_okx_tab(browser: WebPage) -> None:
    """Close the OKX extension tab if it exists."""
    try:
        if tab := browser.get_tab(url=OKX_EXTENSION_ID):
            tab.close()
    except Exception:
        pass


def _check_insufficient_balance(page: WebPage) -> bool:
    """Check for insufficient balance warning."""
    insufficient = page.ele('@|text():足够@|text():enough', timeout=5)
    if insufficient:
        logger.error("Insufficient balance, aborting operation")
        click_by(page, 't:button@data-testid=page-container-footer-cancel')
        return True
    return False
