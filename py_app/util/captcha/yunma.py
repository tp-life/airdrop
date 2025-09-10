import time

from loguru import logger

from py_app.config import settings
from py_app.util import make_request

# 滑动验证码


def swip_captcha(slide_image: str, background_image: str, proxy: str = ''):
    token = settings.APP.jfbym
    payload = {
        "slide_image": slide_image,
        "background_image": background_image,
        "token": token,
        "type": "20111",
    }

    _headers = {
        "Content-Type": "application/json"
    }
    url = "http://api.jfbym.com/api/YmServer/customApi"
    captcha = make_request(url, "POST", data=payload,
                           proxy=proxy, header=_headers)
    if not captcha:
        logger.error("获取验证码凭证失败")
        return

    code = captcha.get("code")
    if code != 10000:
        logger.error("未获取到可用的验证码凭证，可能获取失败了")
        return

    return captcha.get("data", {}).get("data", 0)


def get_recaptcha_token(site_key: str, page_url: str, _type='40010', proxy=''):
    token = settings.APP.jfbym
    payload = {
        'type': _type,
        'googlekey': site_key,
        'pageurl': page_url,
        'token': token,
    }

    _headers = {
        "Content-Type": "application/json"
    }
    url = "http://api.jfbym.com/api/YmServer/funnelApi"
    captcha = make_request(url, "POST", data=payload,
                           proxy=proxy, header=_headers)
    print(captcha)
    if not captcha:
        logger.error("获取验证码凭证失败")
        return False

    captchaId = captcha.get("data", {}).get("captchaId")
    if not captchaId:
        logger.error("未获取到可用的验证码凭证，可能获取失败了")
        return False

    # _req = {"token": token, "captchaId": "53632246555","recordId": "260152603"}
    _req = {"token": token, "captchaId": captchaId,
            "recordId": captcha.get("data", {}).get("recordId")}
    for _ in range(10):
        time.sleep(10)
        rsp = make_request(
            "http://api.jfbym.com/api/YmServer/funnelApiResult", "POST", header=_headers, data=_req)
        if not rsp:
            logger.error("等待验证码结果出错")
            continue
        if rsp.get("code") != 10001:
            continue
        return rsp.get("data", {}).get("data")

    return False
