import mysql from 'mysql2/promise';
import logger from "../infrastructure/logger";
import cfg from '../config';

let _conn: mysql.Pool;

export function conn(): mysql.Pool {
    if (_conn) {
        logger.info(`db.conn(): 📶 找到有已存在的数据库连接,直接使用`);
        return _conn
    }
    logger.info(`db.conn(): 🆕 📶 未找到已有的的数据库连接,创建新连接..`);

    logger.info(`connection --> db host:${cfg.mysql.host}`);
    _conn = mysql.createPool({
        host: cfg.mysql.host,
        user: cfg.mysql.user,
        database: cfg.mysql.db,
        password: cfg.mysql.password,
        port: cfg.mysql.port,
        connectTimeout: 8000,
        debug: false,
    });
    return _conn;
}

