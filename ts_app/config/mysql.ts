// config/MySQLConfig.ts
import { SQLConfig } from './types';

export class MySQLConfig implements SQLConfig {
  host: string;
  port: number;
  db: string;
  user: string;
  password: string;
  charset: string;
  max_idle_conns: number;
  max_open_conns: number;
  conn_max_lifetime: number;
  is_plaintext?: boolean;

  constructor(config: Partial<SQLConfig> = {}) {
    this.host = config.host || '';
    this.port = config.port || 3306;
    this.db = config.db || '';
    this.user = config.user || '';
    this.password = config.password || '';
    this.charset = config.charset || 'utf8mb4';
    this.max_idle_conns = config.max_idle_conns || 10;
    this.max_open_conns = config.max_open_conns || 64;
    this.conn_max_lifetime = config.conn_max_lifetime || 60;
    this.is_plaintext = config.is_plaintext;
  }

  validate(): void {
    if (!this.host) throw new Error('MySQL host is required');
    if (!this.db) throw new Error('MySQL database name is required');
    if (!this.user) throw new Error('MySQL user is required');
    if (!this.password) throw new Error('MySQL password is required');
    
    if (this.port <= 0 || this.port > 65535) {
      throw new Error('Invalid MySQL port number');
    }
  }
}