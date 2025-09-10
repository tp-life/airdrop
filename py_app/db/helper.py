from .account import QueryOneTask
from .sql import DB


async def GetTwitterToken(project: str, follows: int = 0, where = ""):
    sql = "is_blocked=0  AND projects NOT LIKE :project "
    if follows > 0 :
        sql += " AND follows >= :follows"
    if where:
        sql += " AND " + where

    data, _ = await QueryOneTask(
        'twitter_tokens',
        sql,
        hasIP=False,
        args={"project": f"%{project}%", "follows": follows}
    )

    return data

async def MaskTwitterTokenBlank(token: str, project: str, is_blocked = 1):
    await DB().updateTask("UPDATE twitter_tokens SET is_blocked=:is_blocked WHERE token = :token AND projects Like :project", {"token": token, "project": f"%{project}%", "is_blocked": is_blocked})


async def MaskTwitterTokenUse(token: str, project: str):
    await DB().updateTask("UPDATE twitter_tokens SET projects = CONCAT(projects, ',', :project) WHERE token = :token", {"token": token, "project": project})


async def GetDcToken(project: str, where = ''):
    sql = "is_blocked=0  AND projects NOT LIKE :project "

    if where:
        sql += " AND " + where

    data, _  = await QueryOneTask(
        'dc_token',
        sql,
        hasIP=False,
        args={"project": f"%{project}%"}
    )

    return data

async def MaskDcTokenBlank(token: str, project: str):
    await DB().updateTask("UPDATE dc_token SET is_blocked=1 WHERE token = :token AND projects Like :project", {"token": token, "project": f"%{project}%"})


async def MaskDcTokenUse(token: str, project: str):
    await DB().updateTask("UPDATE dc_token SET projects = CONCAT(projects, ',', :project) WHERE token = :token", {"token": token, "project": project})