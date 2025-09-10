import { faker } from "@faker-js/faker";
import config, { RESOURCE_DIR } from "../config";
import { EmailReceiver, EmailReceiverOptions, EmailSummary } from "./email";
import logger from "../infrastructure/logger";
import path from "node:path";
import { readdirSync } from "node:fs";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateEmail(): string {
  let name = faker.internet.username();
  name = name.replace(/\s+/g, "").toLocaleLowerCase(); // 移除空格
  const domains = config.email.domains;
  if (!domains.length) return "";
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name}@${domain}`;
}

export function generateName(): string {
  let name = faker.internet.displayName();
  name = name.replace(/\s+/g, ""); // 移除空格
  return name;
}

export async function receiveCode(
  emailOpt: EmailReceiverOptions,
  reg: RegExp | string,
  num = 15,
) {
  try {
    let emails: EmailSummary[] = [];
    for (let i = 0; i < num; i++) {
      await sleep(5000);
      logger.info(`开始第${i + 1}次接收邮件`);
      const receiver = new EmailReceiver(emailOpt);

      emails = await receiver.fetchEmails();
      if (emails.length) {
        break;
      }
    }

    if (!emails.length) {
      logger.error(`未找到相关邮件`);
      return;
    }

    const text = emails[0].text;
    const pattern = new RegExp(reg);
    const matches = pattern.exec(text);

    if (matches && matches.length > 1) {
      return matches[1]; // 第一个捕获组
    }
    logger.error(`未获取到验证码。${emails[0].text}`);
    return "";
  } catch (err) {
    logger.error(`收取邮件失败，${err}`);
    return "";
  }
}

export async function quickReceiveCode(
  email: string,
  password: string,
  from?: string,
  reg: RegExp = /\b(\d{6})\b/,
): Promise<string> {
  const emailConnctInfo = parseEmailInfo(email, password);
  const emialOpts = {
    host: emailConnctInfo.host,
    user: emailConnctInfo.user,
    password: emailConnctInfo.pwd,
    from,
    to: email,
    maxEmails: 1,
  };
  const code = await receiveCode(emialOpts, reg);
  return code;
}

export function padToTen(str: string, len = 15) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  while (str.length < len) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

interface ParseEmailInfoResult {
  host: string;
  user: string;
  pwd: string;
  port: number;
  folder: string[];
}

export function parseEmailInfo(
  email: string,
  password: string,
): ParseEmailInfoResult {
  let host = "";
  let user = email;
  let pwd = password;
  let port = 993;
  let folder: string[] = ["INBOX"];

  // Convert email to lowercase
  email = email.toLowerCase();

  // Check email format
  if (!email.includes("@")) {
    throw new Error("Invalid email format");
  }

  // Split domain
  const [, domain] = email.split("@");

  // Set host and folder based on domain
  if (["outlook.com", "hotmail.com"].includes(domain)) {
    host = "outlook.office365.com";
    folder.push("Junk");
  } else if (domain === "rambler.ru") {
    host = "imap.rambler.ru";
    folder.push("Spam");
  } else if (["bk.ru", "inbox.ru", "list.ru", "mail.ru"].includes(domain)) {
    host = "imap.mail.ru";
    folder.push("Spam");
  } else if (
    [
      "lapasamail.com",
      "lamesamail.com",
      "faldamail.com",
      "lechemail.com",
      "firstmail.ltd",
      "firstmail.com",
      "superocomail.com",
      "veridicalmail.com",
      "reevalmail.com",
      "velismail.com",
    ].includes(domain)
  ) {
    host = "imap.firstmail.ltd";
    folder.push("Junk");
  } else if (domain === "gmx.com") {
    host = "imap.gmx.com";
    folder.push("Spam");
  } else {
    if (!config.email.host) {
      throw new Error(
        "Settings with EMAIL configuration is required for custom domains",
      );
    }
    host = config.email.host;
    user = config.email.user;
    pwd = config.email.password;
  }

  return { host, user, pwd, port, folder };
}

/**
 * 从数组中随机获取一个元素
 * @param array 要获取元素的数组
 * @returns 随机选择的数组元素，如果数组为空则返回 undefined
 */
export function getRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) {
    return undefined;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// 生成单个地址信息
export function generateProfile() {
  // const faker = new Faker({
  //   locale: [en, en_US, base],
  // });
  // countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
  const country = faker.location.language();
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phoneNumber: generateUSPhoneNumber("national"),
    country: country.name,
    countryCode: country.alpha2,
    state: faker.location.state(),
    city: faker.location.city(),
    streetAddress: faker.location.streetAddress(),
    zipCode: faker.location.zipCode(),
    locale: country,
  };
}

export function generateUSPhoneNumber(
  format: "national" | "international" = "international",
): string {
  // 随机生成北美区号（201-999，避免保留号码如 555）
  const areaCode = faker.number.int({ min: 601, max: 610 });

  // 中间三位：避开 555、000 开头
  const exchangeCode = faker.number.int({ min: 200, max: 999 });

  // 后四位
  const subscriberNumber = faker.number
    .int({ min: 0, max: 9999 })
    .toString()
    .padStart(4, "0");

  if (format === "international") {
    return `+1-${areaCode}-${exchangeCode}-${subscriberNumber}`;
  }

  // national 格式: (XXX) XXX-XXXX
  return `(${areaCode}) ${exchangeCode}-${subscriberNumber}`;
}

// 读取目录并返回随机一张图片路径
export function getRandomImage(dir = "avatar"): string {
  const IMAGE_DIR = path.join(RESOURCE_DIR, dir); // 替换为你的图片目录
  const files = readdirSync(IMAGE_DIR);
  const imageFiles = files.filter((file) =>
    /\.(png|jpe?g|gif|webp)$/i.test(file),
  );

  if (imageFiles.length === 0) {
    throw new Error("No image files found in directory.");
  }

  const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
  return path.join(IMAGE_DIR, randomFile);
}

export function getRandomElements<T>(arr: T[], count: number = 1): T[] {
  if (count >= arr.length) return [...arr]; // 如果数量大于等于数组长度，就直接返回全部

  // 洗牌
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
