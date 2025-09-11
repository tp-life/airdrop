import { drizzle } from "drizzle-orm/mysql2";
import { conn } from "../db/db";
import { and, eq, getTableName, SQL, sql } from "drizzle-orm";
import { NoTaskError } from "../types/error";
import { randProxyIP } from "../utils/proxy-ip";
import { ProxyIP } from "../types/proxy";
import { BrowserManage } from "../utils/browser";
import { MySqlTable, MySqlUpdateSetSource } from "drizzle-orm/mysql-core";
import path from "path";
import * as fs from "fs";
import { AesHelper } from "../utils/encode/aes";
import {
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from "axios";
import { HttpClient } from "../utils/http";
import logger from "../infrastructure/logger";
import { ethers } from "ethers";
import config, { USER_DIR } from "../config";
import { generateEmail } from "../utils/help";
import { EmailAccount, EmailTable } from "../schema/emails";
import { PageWithCursor } from "puppeteer-real-browser";
import { queryToken } from "../utils/encode/cf";
import { cf } from "../utils/encode/2captcha";
import { Page } from "rebrowser-puppeteer-core";
import { Wallet } from "../utils/wallet/wallet";
import { getTypeByExt } from "../utils/wallet/config";
import { WithCommonFields } from "../schema/base_models";
import { autoXAuth } from "../utils/twitter/x_front";
import { autoDiscordAuth } from "../utils/dc/dc_front";

export abstract class APP {
  constructor(
    protected args: Record<string, any>,
    protected timeout: number,
  ) {}

  abstract run(): Promise<void>;

  abstract stop(): Promise<void>;
}

type QueryOptions = {
  where?: any; // 可以是 sql 片段、eq()、and() 等
  orderBy?: any;
  hasIP?: boolean;
  raise?: boolean;
  lockKey?: string;
  lockTime?: number;
};

export class Base extends APP {
  protected _db = drizzle(conn(), { logger: true });
  protected ip: ProxyIP;
  protected browser: BrowserManage = null;
  protected jwt: string = "";
  protected pk: string = "";
  protected walletExt = "";
  public table: MySqlTable = null;
  private httClient: HttpClient = null;

  get headers(): RawAxiosRequestHeaders | AxiosHeaders {
    return {};
  }

  get strIP() {
    const ip = this.ip.username
      ? `http://${this.ip.username}:${this.ip.password}@${this.ip.host}:${this.ip.port}`
      : `http://${this.ip.host}:${this.ip.port}`;
    return ip;
  }

  get param(): string {
    return this.args["arg"] ?? "";
  }

  get walletManager() {
    return new Wallet(getTypeByExt(this.walletExt));
  }

  get project() {
    if (!this.table) {
      return "project_default";
    }
    return getTableName(this.table);
  }

  async run(): Promise<void> {}

  async closeBrowser() {
    if (this.browser) {
      logger.info("开始进行浏览器关闭");
      this.browser.close();
      this.browser = null;
    }
  }

  async stop(): Promise<void> {
    await this.closeBrowser();
  }

  async getAccount<T>(option: QueryOptions = {}) {
    if (option.lockKey === undefined) {
      option.lockKey = "locked_at";
    }

    if (option.hasIP === undefined) {
      option.hasIP = true;
    }
    if (option.raise === undefined) {
      option.raise = true;
    }

    if (option.lockTime === undefined) {
      option.lockTime = 30;
    }

    let q = option.where;
    if (config.app.debug) {
      option.lockTime = 1;
    }

    q = and(
      q,
      sql.raw(
        `(${option.lockKey} is null OR ${option.lockKey} < DATE_SUB(NOW(), INTERVAL ${option.lockTime} MINUTE))`,
      ),
    );

    const order = option.orderBy ?? sql`RAND()`;

    const query = await this._db
      .select()
      .from(this.table)
      .where(q)
      .orderBy(order)
      .limit(1);

    if (query.length < 1) {
      if (option.raise) throw new NoTaskError();
      return null;
    }

    if (option.hasIP) {
      this.ip = await randProxyIP();
      if (!this.ip) {
        throw new Error("Failed to get proxy IP");
      }
    }
    const account = query[0];

    if (option.raise && ("pk" in account || "private_key" in account)) {
      this.pk = this.decodePK(
        (account["pk"] ?? account["private_key"] ?? "") as string,
      );
    }

    if (config.app.debug) {
      return account as T;
    }

    await this._db
      .update(this.table)
      .set({ [option.lockKey]: sql`NOW()` })
      .where(eq(sql`id`, account.id));
    return account as T;
  }

  async updateAccount<T extends MySqlTable>(
    doc: MySqlUpdateSetSource<T>,
    where: SQL,
  ) {
    await this._db.update(this.table).set(doc).where(where);
  }

  async updateAccountByID<T extends MySqlTable>(
    doc: MySqlUpdateSetSource<T>,
    id: number,
  ) {
    await this.updateAccount(doc, sql`id = ${id}`);
  }

  async insertAccount<T extends MySqlTable>(doc: MySqlUpdateSetSource<T>) {
    await this._db.insert(this.table).values([doc]);
  }

  decodePK(key: string) {
    if (!key.includes("=")) {
      return key;
    }
    const aes = new AesHelper();
    return aes.decryptAndBase64(key).toString();
  }

  userDataDir(dirName: string = "") {
    if (!dirName) {
      dirName = this.project;
    }
    const userDataDir = path.join(
      USER_DIR,
      `${dirName}_${crypto.randomUUID()}`,
    );
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true });
    }
    fs.mkdirSync(userDataDir, { recursive: true });
    return userDataDir;
  }

  async request<T>(
    method: "get" | "post" | "put",
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    stopFn?: (data: AxiosResponse) => boolean,
  ): Promise<T> {
    if (!this.httClient) {
      this.httClient = new HttpClient({
        timeout: 30_000,
        proxy: this.strIP,
      });
    }

    const cfg = config ?? { headers: this.headers };

    if (!cfg?.headers) {
      cfg.headers = this.headers;
    }

    if (this.jwt && !("authorization" in cfg.headers)) {
      cfg.headers["authorization"] = `Bearer ${this.jwt}`;
    }

    try {
      let res;
      if (method == "get") {
        res = await this.httClient.get<T>(url, cfg, stopFn);
      }

      if (method == "post") {
        res = await this.httClient.post<T>(url, data, cfg, stopFn);
      }

      if (method == "put") {
        res = await this.httClient.put<T>(url, data, cfg, stopFn);
      }

      return res.data;
    } catch (err) {
      const errorMsg = err.response
        ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data || {})}`
        : err.message;
      logger.error(
        `${method}: ${url} ->-> 请求失败: ${errorMsg} . data ： ${JSON.stringify(data)}, config : ${JSON.stringify(cfg)}`,
      );
    }
    return null;
  }

  async requestByFetch<T>(
    page: Page,
    method: "get" | "post" | "put",
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ) {
    const cfg = config ?? { headers: this.headers };

    if (!cfg?.headers) {
      cfg.headers = this.headers;
    }

    if (this.jwt && !("authorization" in cfg.headers)) {
      cfg.headers["authorization"] = `Bearer ${this.jwt}`;
    }
    const result = await page.evaluate(
      async (method, url, headers, data) => {
        for (let i = 0; i < 3; i++) {
          try {
            const res = await fetch(url, {
              method: method.toLocaleUpperCase(),
              credentials: "include",
              headers: headers as {},
              body: data,
            });
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            const rawData = await res.json();
            return rawData as T;
          } catch (error) {
            console.log(error);
          }
        }
        return null;
      },
      method,
      url,
      cfg.headers,
      data,
    );
    return result;
  }

  checkSum(addr: string): string {
    return ethers.getAddress(addr);
  }

  async getResource<T>(
    resource: MySqlTable,
    project: string,
    limit = 1,
  ): Promise<T> {
    const q = sql`projects not like ${"%" + project + "%"} AND locked_at < UNIX_TIMESTAMP() - 300 AND is_blocked = 0`;
    const result = await this._db
      .select()
      .from(resource)
      .where(q)
      .orderBy(sql`RAND()`)
      .limit(limit);

    if (!result.length) {
      return null;
    }
    const account = result[0];
    await this._db
      .update(resource)
      .set({
        locked_at: sql`UNIX_TIMESTAMP()`,
        projects: sql`CONCAT(projects, ',', ${project})`,
      })
      .where(eq(sql`id`, account.id));
    return result[0] as T;
  }

  async blockedResource(resource: MySqlTable, where: SQL) {
    return await this._db.update(resource).set({ isBlocked: 1 }).where(where);
  }

  async getEmail(project: string, random: boolean = false) {
    if (random) {
      return { email: generateEmail(), password: config.email.password };
    }

    const em = await this.getResource<EmailAccount>(EmailTable, project);
    if (!em) {
      return { email: generateEmail(), password: config.email.password };
    }
    return { email: em.email, password: em.password };
  }

  async setAccountEmail<T extends MySqlTable>(
    account: WithCommonFields<T>,
    random: boolean = true,
  ) {
    if (!!account.email) {
      return;
    }
    const { email, password } = await this.getEmail(this.project, random);
    account.email = email;
    account.email_pass = password;
    await this.updateAccount(
      { email, email_pass: password },
      sql`id =${account.id}`,
    );
  }

  async newBrowser(
    url: string,
    exts: string[] = [],
    userDir: string = "",
    autoClick: boolean = true,
  ): Promise<PageWithCursor> {
    this.browser = new BrowserManage(this.userDataDir(userDir), exts, this.ip);
    const page = await this.browser.open({
      url: url,
      pk: this.pk,
      autoClick,
    });
    if (!page) {
      return null;
    }
    return page;
  }

  async getCfToken(pageurl: string, siteKey: string) {
    let token: string = "";
    const params = {
      pageurl,
      siteKey,
    };

    if (!config.app.cf_self) {
      return await cf(params);
    }

    try {
      token = await queryToken({
        url: params.pageurl,
        siteKey: params.siteKey,
        proxy: this.strIP,
      });
      if (!token) throw new Error("no token ");
    } catch {
      token = await cf(params);
    }

    return token;
  }

  async bind_x<T extends MySqlTable>(
    page: Page,
    account: WithCommonFields<T>,
    btn: string,
    query: SQL = null,
  ) {
    const that = this;
    const ok = await autoXAuth(
      page,
      {
        token: account.x_token,
        project: this.project,
        auth_btn: btn,
        x_query: query,
      },
      async (token: string) => {
        await that.updateAccount({ x_token: "" }, sql`id = ${account.id}`);
      },
      async (token: string, u: string) => {
        await that.updateAccount({ x_token: token }, sql`id = ${account.id}`);
      },
    );

    return ok;
  }

  async bind_dc<T extends MySqlTable>(
    page: Page,
    account: WithCommonFields<T>,
    btn: string,
    query: SQL = null,
  ) {
    const that = this;
    const ok = await autoDiscordAuth(
      page,
      {
        token: account.dc_token,
        project: this.project,
        authBtn: btn,
        dcQuery: query,
      },
      async (token: string) => {
        await that.updateAccount({ dc_token: "" }, sql`id = ${account.id}`);
      },
      async (token: string) => {
        await that.updateAccount({ dc_token: token }, sql`id = ${account.id}`);
      },
    );

    return ok;
  }
}
