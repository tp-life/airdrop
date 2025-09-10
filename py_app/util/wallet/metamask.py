from time import sleep
from DrissionPage import WebPage
from DrissionPage._pages.chromium_tab import ChromiumTab
from loguru import logger
from typing import Optional, Union

from py_app.util.browser.browser import click_by, wait_for, input_content

# Constants
METAMASK_EXTENSION_ID = "nkbihfbeogaeaoehlefnkodbefgpgknn"
METAMASK_PASSWORD = "aHeywangGae999Xnt"
DEFAULT_SLEEP_TIME = 0.5
MAX_RETRIES = 10


class WalletDoSomethingOption:
    """Configuration options for wallet operations."""

    def __init__(self, max_idle=4, dont_close_page=False, custom_spending_cap="", click_max_btn=False):
        self.max_idle = max_idle
        self.dont_close_page = dont_close_page
        self.custom_spending_cap = custom_spending_cap
        self.click_max_btn = click_max_btn


def MetaMaskDoSomething(browser: WebPage, opt: Optional[WalletDoSomethingOption] = None) -> Union[bool, str]:
    """Perform operations with MetaMask wallet."""
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

        sleep(DEFAULT_SLEEP_TIME)
        try:
            wallet_page = _get_metamask_tab(browser)
            if not wallet_page:
                continue

            wallet_page.scroll.to_bottom()

            # Unlock wallet if needed
            _unlock_wallet(wallet_page)

            # Check balance
            if _check_insufficient_balance(wallet_page):
                return False

            # Perform main operations
            for _ in range(MAX_RETRIES):
                if not _click_primary_button(wallet_page):
                    break

        except Exception:
            continue

    # Clean up
    if not options.dont_close_page:
        _close_metamask_tab(browser)

    return True


def MetamaskImport(browser: WebPage, private_key: str) -> bool:
    """Import an account into MetaMask using private key."""
    if not _validate_inputs(browser, private_key):
        return False

    try:
        wallet_page = _get_or_create_metamask_tab(browser)
        wallet_page.clear_cache()
        wallet_page.set.activate()

        if not _complete_onboarding_steps(wallet_page):
            return False

        return _import_account(wallet_page, private_key)

    except Exception as e:
        logger.error(f"Failed to import wallet: {e}")
        return False


# Helper functions
def _get_metamask_tab(browser: WebPage) -> Optional[ChromiumTab]:
    """Get the MetaMask tab if it exists."""
    try:
        return browser.get_tab(url=METAMASK_EXTENSION_ID)
    except Exception:
        sleep(3)
        return None


def _close_metamask_tab(browser: WebPage) -> None:
    """Close the MetaMask tab if it exists."""
    try:
        if tab := browser.get_tab(url=METAMASK_EXTENSION_ID):
            tab.close()
    except Exception:
        pass


def _unlock_wallet(wallet_page: ChromiumTab) -> None:
    """Unlock the MetaMask wallet if needed."""
    unlock = wallet_page.ele('x://input[@data-testid="unlock-password"]', timeout=1)
    if unlock:
        unlock.input(METAMASK_PASSWORD, True)
        click_by(wallet_page, 'x://button[data-testid="unlock-submit"]')


def _check_insufficient_balance(wallet_page: ChromiumTab) -> bool:
    """Check for insufficient balance warning."""
    insufficient = wallet_page.ele('x://*[contains(text(),"不足")]', timeout=5)
    if insufficient:
        logger.error("Insufficient balance, aborting operation")
        click_by(wallet_page, 'x://button[@data-testid="page-container-footer-cancel"]')
        return True
    return False


def _get_or_create_metamask_tab(browser: WebPage) -> ChromiumTab:
    """Get existing MetaMask tab or create a new one."""
    try:
        if tab := browser.get_tab(url=f"chrome-extension://{METAMASK_EXTENSION_ID}/home.html"):
            return tab
    except Exception:
        pass

    return browser.new_tab(f"chrome-extension://{METAMASK_EXTENSION_ID}/home.html#onboarding/welcome")


def _validate_inputs(browser: WebPage, private_key: str) -> bool:
    """Validate input parameters."""
    if not private_key or len(private_key) < 40:
        logger.error("Invalid private key")
        return False
    if not browser:
        logger.error("Invalid browser instance")
        return False
    return True


def _complete_onboarding_steps(wallet_page: ChromiumTab) -> bool:
    """Complete MetaMask onboarding steps."""
    if not click_by(wallet_page, ele="#onboarding__terms-checkbox", timeout=20):
        logger.error("Failed to click terms checkbox")
        return False

    # Click through primary buttons
    while _click_primary_button(wallet_page):
        sleep(DEFAULT_SLEEP_TIME)

    # Set password
    password_fields = wallet_page.eles(".:form-field__input")
    if not password_fields:
        logger.error("Password fields not found")
        return False

    for field in password_fields:
        field.input(METAMASK_PASSWORD)

    # Complete remaining steps
    steps = [
        ('x://input[@data-testid="create-password-terms"]', "Failed to click terms checkbox"),
        ('x://button[@data-testid="create-password-wallet"]', "Failed to create a new wallet"),
        ('x://button[@data-testid="secure-wallet-later"]', "Failed to click 'Remind me later'"),
        ('x://input[@data-testid="skip-srp-backup-popover-checkbox"]', "Failed to click backup warning checkbox"),
        ('x://button[@data-testid="skip-srp-backup"]', "Failed to click 'Skip backup'")
    ]

    for selector, error_msg in steps:
        if not click_by(wallet_page, selector):
            logger.error(error_msg)
            return False
        sleep(DEFAULT_SLEEP_TIME)

    # Click through any remaining primary buttons
    while _click_primary_button(wallet_page):
        sleep(DEFAULT_SLEEP_TIME)

    return True


def _import_account(page: Union[ChromiumTab, WebPage], private_key: str) -> bool:
    """Import an account using private key."""
    if private_key.endswith("000000000000000000000000000000"):
        logger.info("Skipping import for dummy private key")
        return True

    wait_for(page, "x://button[@data-testid='account-menu-icon']")

    # Open account menu
    for _ in range(3):
        if (click_by(page, "x://button[@data-testid='account-menu-icon']") and click_by(page, "x://button[@data-testid='multichain-account-menu-popover-action-button']")):
            break
        sleep(1)
    else:
        return False

    # Import account
    steps = [
        ("x://button[text()='导入账户' or text()='Import account']", "Failed to click import account"),
        ("#private-key-box", "Failed to input private key", private_key),
        ("x://button[@data-testid='import-account-confirm-button']", "Failed to confirm import")
    ]

    for step in steps:
        if len(step) == 2:
            if not click_by(page, step[0]):
                logger.warning(step[1])
                return False
        else:
            if not input_content(page, ele=step[0], content=step[2]):
                logger.warning(step[1])
                return False
        sleep(DEFAULT_SLEEP_TIME)

    page.close()
    return True


def _click_primary_button(page: Union[ChromiumTab, WebPage]) -> bool:
    """Click the primary button if available."""
    return click_by(page, "@|class:btn-primary@|class:mm-button-primary", timeout=3, _wait=False)


def _click_close_button(page: Union[ChromiumTab, WebPage]) -> bool:
    """Click the close button if available."""
    return click_by(page, "xpath://button[@data-testid='popover-close']")
