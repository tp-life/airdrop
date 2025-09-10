from loguru import logger
from py_app.config import settings
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 数据库连接字符串，替换为你的数据库连接信息
DATABASE_URI = f'mysql+pymysql://{settings.MYSQL.user}:{settings.MYSQL.password}@{settings.MYSQL.host}:{settings.MYSQL.port}/{settings.MYSQL.db}'

# 创建一个带连接池的引擎
engine = create_engine(DATABASE_URI, pool_size=10, max_overflow=20, echo=settings.APP.debug)

# 创建一个session工厂
Session = sessionmaker(bind=engine)


class DatabaseConnection:
    # _instance = None
    def execute_query(self, query, params=None):
        session = Session()
        try:
            result = session.execute(text(query), params).all()
        finally:
            session.close()
        return result

    def execute_update(self, query, params=None):
        session = Session()
        try:
            session.execute(
                text(query),
                params
            )
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"数据库更新失败: {e}")
            raise  # 可选择抛出或处理
        finally:
            session.close()


class DB:
    def __init__(self):
        try:
            self.db = DatabaseConnection()
        except Exception as err:
            print(err)

    async def getTasks(self, query: str, params: dict = {}):

        try:
            logger.debug(f"执行查询: {query}, 参数: {params}")
            rows = self.db.execute_query(query, params)
            if rows:
                return rows
            else:
                return None
        except Exception as err:
            logger.error("数据库查询执行任务失败", err)

        return None

    async def getFirstTask(self, sql: str, params: dict = {}):
        rows = await self.getTasks(sql, params)
        if rows is None or len(rows) == 0:
            return None
        return rows[0]

    async def updateTask(self, sql: str, params: dict = {}):
        logger.info(f"{sql}, {params}")
        self.db.execute_update(sql, params)
