from .sql import DB
from datetime import datetime, timedelta
from py_app.util.utils import get_one_ip
from loguru import logger
from urllib.parse import urlparse
from py_app.util.encode import AesHelper

class Account:

    def __init__(self, table: str, where: str = "", args = {}, orderBy = "RAND()", limit = 1, hasIP = True, lockedField = 'locked_at', field = "*"):
        self.table = table
        self.where = where
        self.args = args
        self.orderBy = orderBy
        self.limit = limit
        self.hasIP = hasIP
        self.lockedField = lockedField
        self.field = field

    async def QueryOne(self, saveIP = True, timeout = 10):
        account = await DB().getFirstTask(self.pasreSql(), self.args)
        if not account:
            logger.info("No account available")
            return account, ""

        _port = 0
        port = 0
        ip = ''

        if self.hasIP:
            if account.port:
                _port = account.port

            ip = get_one_ip(port=_port, num = 10, timeout=timeout)
            if not ip:
                logger.info("No ip available")
                return account, ""

        if self.lockedField:
            sql = f"UPDATE {self.table} SET {self.lockedField} = :locked_at"
            if saveIP and ip:
                parsed_url = urlparse(ip)
                # 提取端口
                port = parsed_url.port

                if not account.port or int(port) != int(account.port):
                    sql += " , port = :port"

            sql += f" WHERE id = :id"

            await DB().updateTask(sql, {"locked_at":datetime.now(), "port":port, "id":account.id})

        return account, ip

    async def QueryOneByDict(self, saveIP = True, timeout = 10):
        _account = await DB().getFirstTask(self.pasreSql(), self.args)
        if not _account:
            logger.info("No account available")
            return _account, ""

        account = _account._asdict()
        _port = 0
        port = 0
        ip = ''

        if self.hasIP:
            if account.get("port", 0):
                _port = account.get("port")

            ip = get_one_ip(port=_port, num = 10, timeout=timeout)
            if not ip:
                logger.info("No ip available")
                return account, ""

        if self.lockedField:
            sql = f"UPDATE {self.table} SET {self.lockedField} = :locked_at"
            if saveIP and ip:
                parsed_url = urlparse(ip)
                # 提取端口
                port = parsed_url.port

                if "port" in account and  (not account.get("port") or int(port) != int(account.get("port"))):
                    sql += " , port = :port"

            if "sort" in account:
                sql += " , sort = :sort"

            sort = account.get("sort", 0)
            if not sort:
                sort = 0

            sql += f" WHERE id = :id"
            await DB().updateTask(sql, {"locked_at":datetime.now(), "port":port, "id":account.get('id'),"sort":  sort + 1})

        if account.get("pk") and account.get("pk").endswith("="):
            account["ori_pk"] = account.get("pk")
            account["pk"] = AesHelper().decrypt_and_base64(account.get('pk')).decode('utf-8')

        if account.get("private_key") and account.get("private_key").endswith("="):
            account["ori_private_key"] = account.get("private_key")
            account["private_key"] = AesHelper().decrypt_and_base64(account.get('private_key')).decode('utf-8')

        return account, ip


    async def OnlyQuery(self):
        return  await DB().getTasks(self.pasreSql(), self.args)

    def pasreSql(self):
        if not self.table:
            raise "请输入要查询的表名"

        sql = f"SELECT {self.field} FROM {self.table} "
        if self.where:
            sql += f" WHERE {self.where} "

        if self.orderBy:
            sql += f" ORDER BY {self.orderBy} "

        if self.limit:
            sql += f" LIMIT {self.limit}"

        return sql + f" FOR UPDATE SKIP LOCKED"


async def QueryOneTask(table: str, where: str = "", args = {}, orderBy = "RAND()",  hasIP = True, lockedField = 'locked_at', field = "*", saveIP = True, lockAt =30, ipTimeout = 10, onlyWhere = False):

    if not onlyWhere and lockedField:
        if where:
            where += " AND "

        lk = datetime.now() - timedelta(minutes=lockAt)
        where += f"({lockedField} is null OR {lockedField} < :lk ) "

        args["lk"] = lk
    _act = Account(table=table,
                   where=where,
                   orderBy=orderBy,
                   args=args,
                   hasIP=hasIP,
                   lockedField=lockedField,
                   field=field)
    return await _act.QueryOne( saveIP=saveIP, timeout=ipTimeout)

async def QueryOneTaskV2(table: str, where: str = "", args=None, orderBy ="RAND()", hasIP = True, lockedField ='locked_at', field ="*", saveIP = True, lockAt =30, ipTimeout = 10, onlyWhere = False):

    if args is None:
        args = {}

    if not onlyWhere and lockedField:
        if where:
            where = f"( {where} ) AND "
        lk = datetime.now() - timedelta(minutes=lockAt)
        where += f"({lockedField} is null OR {lockedField} < :lk ) "

        args["lk"] = lk
    _act = Account(table=table,
                   where=where,
                   orderBy=orderBy,
                   args=args,
                   hasIP=hasIP,
                   lockedField=lockedField,
                   field=field)
    return await _act.QueryOneByDict( saveIP=saveIP, timeout=ipTimeout)


async def UpdateTask(table: str, where: str, doc ,args ={}):
    if not table:
        raise "请输入要更新的表名"

    if not where:
        raise "请输入变更的条件"

    if not doc:
        raise "请输入要变更的内容"

    sql = f"UPDATE {table} SET {doc} WHERE {where} "

    await DB().updateTask(sql, args)
