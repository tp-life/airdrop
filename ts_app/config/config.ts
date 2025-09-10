import toml from "toml";
import { readFileSync } from "fs";
import { FullConfig } from "./types";
import { MySQLConfig } from "./mysql";
import { AppConfig } from "./app";
import { WebConfig } from "./web";
import { EmailConfig } from "./email";
import { ENV_DEV, ENV_RELEASE, ENV_TEST } from ".";

export class Config implements FullConfig {
  mysql: MySQLConfig;
  app: AppConfig;
  web: WebConfig;
  email: EmailConfig;

  constructor(rawConfig: Partial<FullConfig> = {}) {
    this.mysql = new MySQLConfig(rawConfig.mysql);
    this.app = new AppConfig(rawConfig.app);
    this.web = new WebConfig(rawConfig.web);
    this.email = new EmailConfig(rawConfig.email);
  }

  validate(): void {
    this.mysql.validate();
    this.app.validate();
    // this.web.validate();
    // this.email.validate();
  }

  loadEnv(): Config {
    if (process.env.NODE_ENV === ENV_RELEASE) {
      const host = process.env.MYSQL_HOST_RELEASE;
      if (!host) {
        return this;
      }
      const port = process.env.MYSQL_PORT_RELEASE;
      const db = process.env.MYSQL_DB_RELEASE;
      const user = process.env.MYSQL_USER_RELEASE;
      const password = process.env.MYSQL_HOST_RELEASE;
      const p = Number(port);
      const dbConfig = new MySQLConfig({
        password,
        host,
        db,
        user,
        port: p,
      });
      dbConfig.validate();
      this.mysql = dbConfig;
    } else if (process.env.NODE_ENV === ENV_TEST) {
      const host = process.env.MYSQL_HOST_TEST;
      if (!host) {
        return this;
      }
      const port = process.env.MYSQL_PORT_TEST;
      const db = process.env.MYSQL_DB_TEST;
      const user = process.env.MYSQL_USER_TEST;
      const password = process.env.MYSQL_HOST_TEST;
      const p = Number(port);
      const dbConfig = new MySQLConfig({
        password,
        host,
        db,
        user,
        port: p,
      });
      dbConfig.validate();
      this.mysql = dbConfig;
    } else if (process.env.NODE_ENV === ENV_DEV) {
      const host = process.env.MYSQL_HOST_DEV;
      if (!host) {
        return this;
      }
      const port = process.env.MYSQL_PORT_DEV;
      const db = process.env.MYSQL_DB_DEV;
      const user = process.env.MYSQL_USER_DEV;
      const password = process.env.MYSQL_HOST_DEV;
      const p = Number(port);
      const dbConfig = new MySQLConfig({
        password,
        host,
        db,
        user,
        port: p,
      });
      dbConfig.validate();
      this.mysql = dbConfig;
    }

    return this;
  }
}

export class ConfigLoader {
  private static _instance: Config;
  static fromFile(filePath: string): Config {
    try {
      const fileContent = readFileSync(filePath, "utf-8");
      const rawConfig = toml.parse(fileContent);
      const config = new Config(rawConfig);
      config.validate();
      return config;
    } catch (error) {
      throw new Error(
        `Failed to load config: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static fromObject(configObj: Partial<FullConfig>): Config {
    try {
      const config = new Config(configObj);
      config.validate();
      return config;
    } catch (error) {
      throw new Error(
        `Invalid config object: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public static get instance(): Config {
    if (!this._instance) {
      this._instance = new Config();
    }
    return this._instance;
  }
}
