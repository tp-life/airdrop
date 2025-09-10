import axios from "axios";
import logger from "../infrastructure/logger";
import { BlockedError } from "../types/error";
import { simpleParser } from "mailparser";
import { ImapFlow, SearchObject } from "imapflow";

export interface ReceiveEmailWithHttpOption {
  Email: string;
  Password: string;
  Limit?: number;
  From?: string;
  To?: string;
  Text?: string;
}
interface ApiResponse {
  TrackID: string;
  Success: boolean;
  Error: {
    Code: number;
    Message: string;
  };
  Data: Array<{
    Subject: string;
    Sender: string;
    Date: string;
    Content: string;
  }>;
}

export interface EmailResult {
  Subject: string;
  Sender: string;
  Content: string;
  Date: Date;
}

// 通过 http API 代理接收邮件,若登录失败会标记邮件 is_blocked 字段
export async function ReceiveEmailWithHttp(
  opt: ReceiveEmailWithHttpOption,
): Promise<EmailResult[] | null> {
  const url = "https://anvil.campone.io/email/receive";
  try {
    const response = await axios.post<ApiResponse>(url, opt, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status != 200) {
      logger.warn(`😱 邮件API返回了异常的状态码:${response.status}`);
    }
    if (response.data.Success) {
      const emailResults: EmailResult[] = response.data.Data.map((item) => ({
        Subject: item.Subject,
        Sender: item.Sender,
        Content: item.Content,
        Date: new Date(item.Date),
      }));
      return emailResults;
    } else {
      logger.error(
        `ReceiveEmailWithHttp():收件API响应了错误的信息:${response.data.Error.Message}`,
      );
      // 接收邮件出错:EmailService.ReceiveEmail() 登录失败
      let blocked = false;
      if (response.data.Error.Message.includes(`登录失败`)) {
        blocked = true;
      }
      if (response.data.Error.Message.includes(`authentication failed`)) {
        blocked = true;
      }
      if (blocked) {
        logger.error(`🚫 登录失败:邮箱账号废了`);
        throw new BlockedError();
      }
      // console.log(response);
    }
  } catch (error) {
    logger.error(`Error occurred: ${error}`);
  }
  return null;
}

// src/emailReceiver.ts

export interface EmailReceiverOptions {
  user: string;
  password: string;
  host?: string;
  port?: number;
  tls?: boolean;
  from?: string;
  to?: string;
  maxEmails?: number;
}

export interface EmailSummary {
  subject: string;
  text: string;
  date: Date;
  from: { name: string; address: string } | null;
}

export class EmailReceiver {
  private client: ImapFlow;

  constructor(private options: EmailReceiverOptions) {
    this.client = new ImapFlow({
      host: options.host || "imap.gmail.com",
      port: options.port || 993,
      secure: this.options.tls ?? true,
      auth: {
        user: this.options.user,
        pass: this.options.password,
      },
      logger: false,
    });
  }

  public async fetchEmails(): Promise<EmailSummary[]> {
    const foldersToCheck = ["INBOX", "Junk", "Spam"];
    const collected: EmailSummary[] = [];

    await this.client.connect();

    for (const folder of foldersToCheck) {
      try {
        await this.client.mailboxOpen(folder);

        // 构建搜索条件
        const searchCriteria: SearchObject = {
          // seen: false,
          since: new Date(Date.now() - 30 * 60 * 1000), // 最近半小时
        };

        if (this.options.from) {
          searchCriteria.from = this.options.from;
        }
        if (this.options.to) {
          searchCriteria.to = this.options.to;
        }

        const searchResults = await this.client.search(searchCriteria);

        if (!searchResults || !searchResults.length) continue;

        const emailIds = searchResults
          .slice(-1 * (this.options.maxEmails || 5))
          .reverse();

        for (const seq of emailIds) {
          const fetched = await this.client.fetchOne(seq, {
            source: true,
            envelope: true,
            internalDate: true,
          });

          if (!fetched) {
            console.warn(`⚠️ fetchOne(${seq}) 返回 false，跳过`);
            continue;
          }

          const parsed = await simpleParser(fetched.source);
          // ✅ 类型处理：确保 date 为 Date
          const date: Date =
            parsed.date ?? toSafeDate(fetched.internalDate) ?? new Date();

          // ✅ 类型处理：确保 from 为 null 或结构体
          const fromValue = parsed.from?.value?.[0];
          const from: { name: string; address: string } | null = fromValue
            ? {
                name: fromValue.name || "",
                address: fromValue.address || "",
              }
            : null;

          collected.push({
            subject: parsed.subject || fetched.envelope.subject || "",
            text: parsed.text || "",
            date,
            from,
          });

          // 设置为已读
          await this.client.messageFlagsAdd(seq, ["\\Seen"]);
        }
      } catch (err) {
        console.warn(`⚠️  跳过文件夹 "${folder}": ${(err as Error).message}`);
      }
    }

    await this.client.logout();

    // 时间倒序返回
    return collected.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

function toSafeDate(input: unknown): Date {
  if (input instanceof Date) return input;
  if (typeof input === "string") {
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(); // fallback
}
