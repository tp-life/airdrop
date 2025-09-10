from loguru import logger


from twocaptcha import TwoCaptcha

from py_app.config.config import settings


def twoCaptcha(site_key: str, page_url: str):
    keys = settings.APP.twoCaptcha_keys
    if not keys or len(keys) == 0:
        return ""
    solver = TwoCaptcha(keys[0])

    try:
        result = solver.recaptcha(
            site_key,
            page_url)

        return str(result)
    except Exception as e:
        logger.error(f"获取验证码失败, {e}")

    return ""
