from loguru import logger
from pydantic import BaseModel, ValidationError
import os

from dynaconf import Dynaconf


class Mysql(BaseModel):
    host: str = ''
    user: str = ''
    password: str = ''
    db: str = ''
    port: int = 3306


class App(BaseModel):
    geet_api: str = ''
    thread_num: int = 1
    ext_path: str = ''
    ip_url: str = ''
    timeout: int = 60  # 浏览器操作默认超时时间（秒）
    debug: bool = False
    debug_proxy: str = ''
    exe: str = ''
    nope_keys: list[str] = []
    yesCaptcha_keys: list[str] = []
    twoCaptcha_keys: list[str] = []
    proxy_server: str = ''
    jfbym: str = ''


class Web(BaseModel):
    port: int = 3030


class BrowserExt(BaseModel):
    metamask: str = os.path.join(
        'nkbihfbeogaeaoehlefnkodbefgpgknn', '12.12.0_0')
    okx: str = os.path.join("mcohilncbfahbmgdjkbpemcciiolgcge", "3.26.18_0")
    cdn: str = os.path.join('localcdn')
    nope: str = os.path.join('dknlfmjaanfblgfdfebhijalfmhmjjjo', "0.4.7_0")
    yesCaptcha: str = os.path.join(
        'jiofmdifioeejeilfkpegipdjiopiekl', '1.1.62_0')
    twoCaptcha: str = os.path.join(
        'ifibfemgeogfhoebkmokieepdoobkbpo', '3.7.2_0')
    phantom: str = os.path.join(
        'bfnaelmomeimhlpmgjnjophhpkkoljpa', '25.15.0_0')


class Email(BaseModel):
    user: str = ''
    password: str = ''
    host: str = ''
    port: int = 993
    domains: list[str] = []


class Settings(BaseModel):
    MYSQL: Mysql = Mysql()
    APP: App = App()
    WEB: Web = Web()
    BROWSER_EXT: BrowserExt = BrowserExt()
    EMAIL: Email = Email()


# 加载配置
configs = Dynaconf(
    settings_files=['config.toml']
)
# 将配置映射到 Pydantic 模型
try:

    settings = Settings(**configs.as_dict())
except ValidationError as e:
    logger.error(f"配置验证错误: {e}")
    raise (f"配置验证错误: {e}")
