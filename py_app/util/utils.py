import concurrent.futures
import email
import hashlib
import imaplib
import os
import platform
import random
import re
import signal
import string
import subprocess
import threading
import time
from datetime import datetime, timedelta
from email.header import decode_header
from typing import List, Optional, Tuple, Dict, Callable

import jwt
import requests
from faker import Faker
from loguru import logger
from requests import Response

from py_app.config import settings


def reset_session():
    session = requests.Session()
    return session


def is_valid_proxy(proxy, test_url, timeout):
    """自定义函数，测试代理是否有效。"""
    try:
        proxies = {'http': proxy, 'https': proxy}
        start_time = time.time()
        session = reset_session()
        res = session.get(test_url, proxies=proxies, timeout=timeout)  # 转换为秒
        elapsed_time = time.time() - start_time
        return res.status_code == 200, elapsed_time
    except requests.RequestException as e:
        return False, None


def get_ip(test_url="https://ip.me", area="", timeout=1, stop_event=None, n=10):
    """获取有效的代理 IP。"""
    i = 0  # 重试次数
    for _ in range(n):
        if stop_event and stop_event.is_set():
            return None, None
        try:
            # 请求随机 IP
            session = reset_session()
            res = session.get(f"{settings.APP.ip_url}?area={area}", timeout=10)
            res.raise_for_status()  # 检查请求是否成功
            data = res.json()

            # 检查 error.code
            if data["error"]["code"] == 0:
                proxy = f'http://{data["host"]}:{data["port"]}'
                is_valid, elapsed_time = is_valid_proxy(
                    proxy, test_url, timeout)
                if is_valid:
                    return proxy, elapsed_time
            else:
                logger.error(f"获取IP信息错误，错误信息: {data['error']['message']}")

        except requests.RequestException as e:
            logger.error(f"请求错误: {e}")
            time.sleep(1)  # 每次失败后等待 1 秒
            continue
        except Exception as e:  # 11336 4060
            logger.error(f"其他错误: {e}")

        time.sleep(1)  # 每次失败后等待 1 秒
    return None, None


def get_one_ip(test_url="http://one.one.one.one", timeout=10,  port=0, mustPort=False, num=10):

    if settings.APP.debug and settings.APP.debug_proxy:
        return settings.APP.debug_proxy

    if port > 0:
        host = settings.APP.proxy_server  # 提取主机部分
        proxy_with_port = f'http://{host}:{port}'  # 使用新的端口
        is_valid, elapsed_time_with_port = is_valid_proxy(
            proxy_with_port, test_url, timeout)
        if is_valid and elapsed_time_with_port < timeout:
            logger.info(
                f"使用组合的代理: {proxy_with_port}，有效性检查通过, 延时 {elapsed_time_with_port:.2f} 秒")
            return proxy_with_port
        elif mustPort:
            return ""

    ip, elapsed_time = get_ip(timeout=timeout, n=num)
    if ip:
        fastest_ip = ip
    else:
        return ""

    logger.success(f"使用代理: {fastest_ip}，有效性检查通过, 延时 {elapsed_time:.2f} 秒")
    return fastest_ip


def get_fastest_ip(test_url="http://one.one.one.one", timeout=1, num_attempts=10, port=0, mustPort=False, num=10):

    if settings.APP.debug and settings.APP.debug_proxy:
        return settings.APP.debug_proxy

    """并发调用 get_ip，返回延迟最短的有效 IP。"""
    valid_ips = []
    # 创建一个全局事件对象
    stop_event = threading.Event()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_attempts) as executor:
        futures = {executor.submit(
            get_ip, test_url, "", timeout, stop_event, num): i for i in range(num_attempts)}

        for future in concurrent.futures.as_completed(futures, timeout=30):
            ip, elapsed_time = future.result()
            if ip:
                valid_ips.append((ip, elapsed_time))  # 存储 IP 和延迟时间

            # 达到有效 IP 数量的一半时，终止其他线程
            if len(valid_ips) >= (num_attempts + 1) // 2:
                stop_event.set()
                break

    # 如果在 30 秒内未找到有效 IP，返回 None
    if len(valid_ips) == 0:
        if not port or not settings.APP.proxy_server:
            return None

        valid_ips.append((f"http://{settings.APP.proxy_server}:{port}", 0))

    # 返回延时最小的有效 IP
    fastest_ip = min(valid_ips, key=lambda x: x[1])[0]  # x[1] 是延迟时间

    # 如果 port 不等于 0，进行有效性检测
    if port > 0:
        host = fastest_ip.split("//")[1]  # 提取主机部分
        proxy_with_port = f'http://{host.split(":")[0]}:{port}'  # 使用新的端口
        is_valid, elapsed_time_with_port = is_valid_proxy(
            proxy_with_port, test_url, timeout)
        if is_valid and elapsed_time_with_port < timeout:
            logger.info(
                f"使用组合的代理: {proxy_with_port}，有效性检查通过, 延时 {elapsed_time_with_port:.2f} 秒")
            return proxy_with_port
        elif mustPort:
            return ""

    logger.success(f"使用组合的代理: {fastest_ip}，有效性检查通过, 延时 {elapsed_time:.2f} 秒")
    return fastest_ip


def rand_ip(test_url="http://one.one.one.one", timeout=1):
    ip, _ = get_ip(test_url, timeout=timeout)
    return ip


def get_current_time_iso_format():
    # 获取当前 UTC 时间
    current_time = datetime.now()

    # 格式化为指定的字符串格式
    formatted_time = current_time.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    return formatted_time


def get_today_midnight(day=0):
    # 获取当前日期的年月日
    today = datetime.now()

    if day != 0:
        today = today + timedelta(days=day)

    # 将时间部分设为凌晨 00:00:00
    midnight = today.replace(hour=0, minute=0, second=0, microsecond=0)

    # 格式化为年月日的字符串格式
    formatted_date = midnight.strftime("%Y-%m-%d %H:%M:%S")

    return formatted_date


def get_timestamp(day=0) -> int:
    # 获取当前时间
    now = datetime.now()

    # 加上 368 天
    future_date = now + timedelta(days=day)

    # 获取未来日期的时间戳
    timestamp = future_date.timestamp()

    return int(timestamp)


def kill_process(pid):
    system = platform.system()

    try:
        if system == "Windows":
            # Windows: 使用 taskkill
            subprocess.run(f"taskkill /PID {pid} /F", shell=True)
        else:
            # Unix: 使用 os.kill
            os.kill(int(pid), signal.SIGKILL)
        print(f"成功关闭 PID {pid} 的进程。")
    except Exception as e:
        print(f"关闭进程时出错: {e}")


def get_pid_by_port(port):
    system = platform.system()

    if system == "Windows":
        # Windows: 使用 netstat 查询 PID
        cmd = f"netstat -ano | findstr :{port}"
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True)
        output = result.stdout

        # 提取 PID
        match = re.search(
            r'\s+TCP\s+.*:{}\s+.*\s+(\d+)\s*$'.format(port), output)
        if match:
            return int(match.group(1))
        else:
            print(f"没有找到端口 {port} 上的进程。")
            return None

    elif system in ["Linux", "Darwin"]:  # Darwin 是 macOS 的系统标识
        # Linux/macOS: 使用 lsof 查询 PID
        cmd = f"lsof -i :{port} | grep LISTEN"
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True)
        output = result.stdout

        # 提取 PID
        match = re.search(r'(\S+)\s+(\d+)', output)
        if match:
            return int(match.group(2))
        else:
            print(f"没有找到端口 {port} 上的进程。")
            return None

    else:
        logger.warning("不支持的操作系统")
        return None


def random_string(length: int = 6) -> str:
    # 定义可用字符集：字母（大写和小写）+ 数字
    characters = string.ascii_letters + string.digits
    # 随机选择字符并生成字符串
    return ''.join(random.choice(characters) for _ in range(length))


def generateEmail() -> str:
    fake = Faker()
    name = fake.user_name()
    name = name.replace(" ", "")
    domains = settings.EMAIL.domains
    domain = random.choice(domains)
    email = f"{name}@{domain}"
    return email


def parse_email_info(
    email: str,
    password: str
) -> Tuple[str, str, str, int, List[str]]:
    host, user, pwd, port = "", email, password, 993
    folder = ["INBOX"]

    # 将邮箱转换为小写
    email = email.lower()

    # 检查邮箱格式
    if "@" not in email:
        raise "传入邮箱格式不正确"

    # 分割域名
    _, domain = email.split("@")

    # 根据域名设置 host 和 folder
    if domain in ["outlook.com", "hotmail.com"]:
        host = "outlook.office365.com"
        folder.append("Junk")
    elif domain == "rambler.ru":
        host = "imap.rambler.ru"
        folder.append("Spam")
    elif domain in ["bk.ru", "inbox.ru", "list.ru", "mail.ru"]:
        host = "imap.mail.ru"
        folder.append("Spam")
    elif domain in [
        "lapasamail.com", "lamesamail.com", "faldamail.com",
        "lechemail.com", "firstmail.ltd", "firstmail.com",
        "superocomail.com", "veridicalmail.com", "reevalmail.com",
        "velismail.com"
    ]:
        host = "imap.firstmail.ltd"
        folder.append("Junk")
    elif domain in [""
                    "gmx.com"]:
        host = "imap.gmx.com"
        folder.append("Spam")
    else:
        host = settings.EMAIL.host
        user = settings.EMAIL.user
        pwd = settings.EMAIL.password
        port = settings.EMAIL.port
        folder.append("Spam")

    return host, user, pwd, port, folder


def onlyLoginEmail(email: str, password: str):
    try:
        host, user, pwd, port, _ = parse_email_info(email, password)
    except Exception as e:
        logger.error(f"解析邮箱信息失败，错误信息：{e}")
        return None

    try:
        imap = imaplib.IMAP4_SSL(host, port)
        imap.login(user, pwd)
        imap.logout()
        return True
    except Exception as e:
        logger.error(f"登录邮箱失败，错误信息：{e}")
        return False
    return False


"""
接收邮件并按需求筛选和返回。

:param host: 邮箱服务器地址
:param port: 邮箱服务器端口
:param user: 登录用户名
:param password: 登录密码
:param folders: 邮箱文件夹列表
:param limit: 查询邮件数量上限
:param from_email: 发送方邮箱（可选）
:param to_email: 接收方邮箱（可选）
:param title_keyword: 邮件标题关键字（可选）
:return: 按时间降序返回的邮件列表，每个邮件包含基本信息
"""


def receive_emails(
    host: str,  user: str, password: str, port: int = 993,
    folders: List[str] = ["INBOX"], limit: int = 10,
    from_email: Optional[str] = None, to_email: Optional[str] = None,
    title_keyword: Optional[str] = None, recent_minutes: Optional[int] = None
) -> List[Dict[str, str]]:
    emails = []
    now = datetime.now()  # 当前时间（UTC）
    time_threshold = now - \
        timedelta(minutes=recent_minutes) if recent_minutes else None

    try:
        # 连接到 IMAP 服务器
        mail = imaplib.IMAP4_SSL(host, port)
        mail.login(user, password)

        for folder in folders:
            # 选择指定文件夹
            try:
                mail.select(folder)
            except Exception as e:
                print(f"无法选择文件夹 {folder}：{e}")
                continue

            # 构建搜索条件
            search_criteria = ["ALL"]
            if from_email:
                search_criteria.append(f'FROM "{from_email}"')
            if to_email:
                search_criteria.append(f'TO "{to_email}"')
            if title_keyword:
                search_criteria.append(f'SUBJECT "{title_keyword}"')

            # 搜索邮件
            status, messages = mail.search(None, *search_criteria)
            if status != "OK":
                print(f"在文件夹 {folder} 搜索邮件失败")
                continue

            # 获取邮件 ID 列表
            mail_ids = messages[0].split()
            mail_ids = mail_ids[::-1]  # 按降序排列

            for mail_id in mail_ids:
                # 获取邮件内容
                status, msg_data = mail.fetch(mail_id, "(RFC822)")
                if status != "OK":
                    print(f"无法获取邮件 ID {mail_id}")
                    continue

                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])

                        # 获取邮件的时间戳
                        date = msg.get("Date")
                        if '(' in date:
                            date = date.split(' (')[0]  # 去除括号和里面的内容
                        email_date = datetime.strptime(
                            date, "%a, %d %b %Y %H:%M:%S %z")
                        email_date_utc = email_date.astimezone(
                            tz=None).replace(tzinfo=None)  # 转换为 UTC 无时区

                        # 如果指定了时间限制并且邮件超出范围，跳过
                        if time_threshold and email_date_utc < time_threshold:
                            break

                        # 获取其他信息
                        subject, encoding = decode_header(
                            msg.get("Subject"))[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding or "utf-8")
                        from_ = msg.get("From")
                        to_ = msg.get("To")

                        # 提取正文
                        body = None
                        # 获取邮件的编码信息
                        charset = msg.get_content_charset()
                        if msg.is_multipart():
                            for part in msg.walk():
                                content_type = part.get_content_type()
                                content_disposition = str(
                                    part.get("Content-Disposition"))
                                if content_type == "get_text/plain" and "attachment" not in content_disposition:
                                    body = part.get_payload(
                                        decode=True).decode("utf-8")
                                    break
                                if content_type == "text/html":
                                    body = part.get_payload(
                                        decode=True).decode("utf-8")
                                    break
                        else:
                            # 获取邮件正文
                            payload = msg.get_payload(decode=True)
                            # 识别编码
                            if charset:
                                body = payload.decode(charset, errors="ignore")
                            else:
                                body = payload.decode(
                                    "utf-8", errors="ignore")  # 默认 UTF-8

                        emails.append({
                            "subject": subject,
                            "from": from_,
                            "to": to_,
                            "date": email_date.isoformat(),
                            "body": body,
                        })

                # 如果已达到 limit，停止处理
                if len(emails) >= limit:
                    break

            # 如果已达到 limit，停止处理其他文件夹
            if len(emails) >= limit:
                break

        mail.logout()

    except Exception as e:
        print(f"发生错误：{e}")

    return emails


def queryEmailCode(email: str, password: str, reg: str | list, from_email=None, needNum=False):
    try:
        host, user, pwd, port, folder = parse_email_info(email, password)
    except Exception as e:
        logger.error(f"解析邮箱信息失败，错误信息：{e}")
        return None

    for i in range(5):
        time.sleep(15)
        emails = receive_emails(host, user, pwd, port, folder, limit=10,
                                recent_minutes=30, to_email=email, from_email=from_email)
        if not emails:
            continue

        _rs = [reg]
        if isinstance(reg, list):
            _rs = reg

        for _r in _rs:
            code = match_email_code(emails[0]["body"], _r)
            code = code.replace(" ", "")
            if code != "":
                if needNum and not code.isdigit():
                    continue
                return code
    return None


def match_email_code(text: str, reg: str) -> str:
    """
    从文本中提取验证码。

    :param text: 包含验证码的文本
    :param reg: 用于提取验证码的正则表达式
    :return: 提取到的验证码，如果未匹配则返回空字符串
    """
    # 编译正则表达式
    pattern = re.compile(reg)

    # 查找匹配的内容
    matches = pattern.search(text)

    # 如果找到匹配内容并且有捕获组
    if matches and len(matches.groups()) > 0:
        # 提取验证码
        verification_code = matches.group(1)
        return verification_code

    return ""


def generate_random_decimal(start: float, end: float, decimal_places: int) -> float:
    # 生成随机数并保留指定的小数位数
    return round(random.uniform(start, end), decimal_places)


def manage_processes(max_processes=0, app_name="Google Chrome", max_runtime_minutes=30):
    """
    精确查找 Google Chrome 进程并管理（支持 Windows、Linux、macOS），检测运行时长并清理超时进程。
    :param max_processes: 最大允许的运行进程数量
    :param app_name: 目标进程名称（例如 "Google Chrome"）
    :param max_runtime_minutes: 进程最大允许运行时间（分钟）
    :return: 是否清理了多余进程
    """
    if not max_processes:
        return False

    system = platform.system()
    zombie_processes = []
    running_processes = []

    try:
        if system == "Windows":
            # Windows 使用 tasklist 获取进程完整路径
            result = subprocess.run(
                ["wmic", "process", "get", "ProcessId,CreationDate,CommandLine"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5
            )
            for line in result.stdout.splitlines():
                parts = line.strip().split()
                if len(parts) >= 3:
                    creation_date, *cmd_parts, pid = parts
                    cmd = " ".join(cmd_parts)
                    if app_name.lower() in cmd.lower() and "--remote-debugging-port" in cmd.lower() and "--type=renderer" not in cmd.lower():
                        # 计算运行时长
                        start_time = datetime.strptime(
                            creation_date.split('.')[0], "%Y%m%d%H%M%S")
                        uptime = datetime.now() - start_time
                        running_processes.append(
                            {"pid": int(pid), "uptime": uptime})

        else:
            # Linux/macOS 使用 ps 获取进程完整路径
            result = subprocess.run(
                ["ps", "-eo", "pid,etime,stat,comm,args"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5
            )
            for line in result.stdout.splitlines():
                parts = line.strip().split(maxsplit=4)
                if len(parts) < 5:
                    continue
                pid, etime, status, name, cmd = parts
                if app_name.lower() in cmd.lower() and "--remote-debugging-port" in cmd.lower() and "--type=renderer" not in cmd.lower():
                    if "Z" in status:  # 状态包含 Z 即为僵尸进程
                        zombie_processes.append(pid)
                    else:
                        uptime = parse_etime(etime)  # 解析运行时间
                        running_processes.append(
                            {"pid": int(pid), "uptime": uptime})

    except subprocess.TimeoutExpired:
        logger.error("检测进程时命令执行超时")
        return False
    except Exception as e:
        logger.error(f"检测进程时出错: {e}")
        return False

    logger.info(
        f"当前 {app_name} 精确匹配进程总数: {len(running_processes) + len(zombie_processes)}")

    # 清理运行时间超出限制的进程
    exceeded_runtime_processes = [
        process for process in running_processes if process["uptime"] > timedelta(minutes=max_runtime_minutes)
    ]
    if exceeded_runtime_processes:
        logger.warning(
            f"检测到 {len(exceeded_runtime_processes)} 个 {app_name} 进程运行时间超出 {max_runtime_minutes} 分钟限制，开始清理...")
        for process in exceeded_runtime_processes:
            kill_process(process["pid"])
        return True

    # 清理僵尸进程
    if zombie_processes:
        logger.warning("发现僵尸进程，开始清理...")
        for pid in zombie_processes:
            try:
                kill_process(pid)
            except Exception as e:
                logger.error(f"无法清理僵尸进程 {pid}: {e}")

    # 判断正常运行的进程是否超过限制
    if len(running_processes) > max_processes:
        logger.warning(
            f"运行的 {app_name} 进程数量超过限制 ({len(running_processes)}/{max_processes})")
        # 按顺序清理多余的进程
        for process in running_processes:
            kill_process(process["pid"])
        return True
    else:
        logger.info(
            f"运行的 {app_name} 进程数量在限制范围内 ({len(running_processes)}/{max_processes})")

    return False


def parse_etime(etime):
    """
    将进程运行时间（etime 格式）解析为 timedelta 对象。
    :param etime: 进程运行时间，格式可能为 1-12:34:56、12:34:56、34:56。
    :return: 运行时长（timedelta）
    """
    try:
        if '-' in etime:  # 包含天数
            days, rest = etime.split('-')
            h, m, s = map(int, rest.split(':'))
            return timedelta(days=int(days), hours=h, minutes=m, seconds=s)
        else:
            parts = list(map(int, etime.split(':')))
            if len(parts) == 3:
                h, m, s = parts
                return timedelta(hours=h, minutes=m, seconds=s)
            elif len(parts) == 2:
                m, s = parts
                return timedelta(minutes=m, seconds=s)
    except Exception as e:
        logger.error(f"无法解析 etime: {etime}，错误: {e}")
        return timedelta(0)


def make_request(url, method, header=None, data={}, proxy=None, fail_callback_fn: Callable[[Response], dict] | None = None, only_resp=False, files=None,  timeout = 60):
    if header is None:
        header = {}
    try:
        logger.debug(f"正在尝试请求: {url}")
        response = requests.request(method, url, headers=header, proxies=get_proxy_agent(proxy),
                                    json=data, files=files, timeout=timeout)
        logger.debug(
            f"{url} 请求完成，状态码：{response.status_code}, response: {response.text}")
        if fail_callback_fn and response.status_code != 200:
            _rs = fail_callback_fn(response)
            if _rs:
                return _rs
        response.raise_for_status()

        if only_resp:
            return response

        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(
            f"{url} Request error: {e}，method:{method},data: {data}。header：{header}。")

    return None


def get_proxy_agent(proxy=None):
    if proxy:
        if proxy.startswith('http://'):
            return {'http': proxy, 'https': proxy}
        elif proxy.startswith('socks4://') or proxy.startswith('socks5://'):
            return {'http': proxy, 'https': proxy}
        else:
            logger.warning(f"不支持的代理类型: {proxy}")
            return None
    return None


def gen_txt(ans: str):
    fake = Faker()
    return fake.sentence()


# 生成随机文本内容的文件
def generate_random_file():
    file_size = random.randint(1024, 10240)  # 1KB 到 10KB 随机大小
    content = ''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=file_size)).encode(
        'utf-8')

    sha256_hash = hashlib.sha256(content).hexdigest()  # 计算 SHA-256 作为文件名
    file_path = f"/tmp/{sha256_hash}.txt"  # 存储到 /tmp 目录

    with open(file_path, "wb") as f:
        f.write(content)

    return file_path, sha256_hash


def readNumber(text: str = '') -> float:
    match = re.search(r"[-+]?\d*\.?\d+", text)
    if match:
        number = float(match.group())
        return number
    return 0


def is_jwt_expired(token: str) -> bool:
    """检查 JWT 是否过期
    Args:
        token: JWT 字符串
    Returns:
        bool: True=已过期, False=未过期或无过期时间
    """
    try:
        payload = jwt.decode(
            token, options={"verify_signature": False}, algorithms=["HS256"])
        exp = payload.get('exp')
        now = datetime.now().timestamp()
        return exp is not None and now > exp
    except jwt.DecodeError:
        return True  # 无效token视为过期


def str_to_bytes32(strings: list[str]):
    bytes32_list = []

    for _str in strings:
        # 将字符串转换为字节类型
        string_bytes = _str.encode('utf-8')

        # 如果字符串长度超过 32 字节，截断它
        if len(string_bytes) > 32:
            raise ValueError(
                f"String '{_str}' exceeds 32 bytes and cannot be converted to bytes32")

        # 用右侧填充空字节，使每个字符串正好为 32 字节
        padded_bytes = string_bytes.ljust(32, b'\x00')

        # 将 32 字节数组转换为 bytes32 类型
        bytes32_list.append(padded_bytes)

    return bytes32_list


def str_to_uint256(amount_str):
    try:
        # 将字符串转换为整数
        amount_int = int(amount_str)

        # 检查是否超出 uint256 范围
        if amount_int < 0 or amount_int >= 2**256:
            raise ValueError("Value is out of bounds for uint256")

        return amount_int
    except ValueError:
        raise ValueError(f"Invalid amount: {amount_str}")
