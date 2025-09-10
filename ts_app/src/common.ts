import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { tableFactor, Account } from "../schema/base_models";
import { Base } from "./app";
import { sql } from "drizzle-orm";
import { okx } from "../config/ext";
import { Wallet } from "../utils/wallet/wallet";
import { getTypeByExt } from "../utils/wallet/config";
import { executeSteps, hs } from "../utils/browser/page";
import logger from "../infrastructure/logger";
import { Register } from "../register/decorators";
import { PageWithCursor } from "puppeteer-real-browser";
import { sleep } from "../utils/help";

const CommonTable = tableFactor("common_task", {});

type CommonAccount = Account<typeof CommonTable>;

@Register("common")
export class Common extends Base {
  public table: MySqlTable<TableConfig> = CommonTable;
  private walletID = okx;
  private wallet = new Wallet(getTypeByExt(this.walletID));
  private token = "";
  private community_id = [
    "airdropanalyst",
    "common",
    "wen-base-mainnet",
    "cvalpha",
  ];

  async run() {
    await this.register();
  }

  async getRefCode(id: number) {
    const account = await this.getAccount<CommonAccount>({
      where: sql`completed = 1 AND referral_total < 20`,
      lockKey: "referral_locked",
      lockTime: 5,
      raise: false,
      hasIP: false,
    });
    if (!account) return "0xA6ef0D999A75312F29C3b86dc03DF9a31716fFA8";

    const code = account.addr;
    await this.updateAccount({ from_referral_code: code }, sql` id = ${id}`);
    await this.updateAccount(
      { referral_total: sql`referral_total + 1` },
      sql` id = ${account.id}`,
    );
    return code;
  }

  async register() {
    let q = sql`completed = 0`;
    const account = await this.getAccount<CommonAccount>({ where: q });

    const code = account.from_referral_code
      ? account.from_referral_code
      : await this.getRefCode(account.id);

    const page = await this.newBrowser(
      `https://common.xyz/dashboard?refcode=${code}`,
      [this.walletID],
      `common_${account.id}`,
    );

    const browser = this.browser;

    const step = [
      hs("wait", "button -> Sign in"),
      hs("click", "button -> Sign in", 1_200),
      hs("click", `(//div[text()="OKX Wallet"])[1]`, 2_000),
      hs("fn", "", 1_200, "", async () => {
        await this.wallet.doSomethingFn(browser.browser, 3);
      }),
    ];

    executeSteps(page, step);

    const res = await page.waitForResponse(
      async (res) => {
        const isTargetAPI =
          res.url() === "https://common.xyz/api/internal/trpc/user.getStatus";
        if (!isTargetAPI) return false;

        // 获取响应状态码
        const status = res.status();

        return status === 200;
      },
      { timeout: 90_000 },
    );

    const statusInfo = (await res.json()) as {
      result: {
        data: {
          jwt: string;
          email: string;
          communities: { id: string }[];
        };
      };
    };
    // logger.info(statusInfo);
    this.token = statusInfo.result.data.jwt;

    if (!statusInfo.result.data.email) {
      await this.updateEmail(page, account);
    }

    const community_id = this.community_id.filter(
      (item) =>
        !statusInfo.result.data.communities.map((it) => it.id).includes(item),
    );

    if (community_id.length > 0) {
      await this.joinCommunity(page, community_id, account.addr);
    }

    await sleep(2_000);
    const status = await this.getStatus(page);
    if (!!status?.result?.data?.email) {
      await this.updateAccount({ completed: 1 }, sql`id =${account.id}`);
    }
  }

  async updateEmail(page: PageWithCursor, account: CommonAccount) {
    if (!account.email) {
      const { email, password } = await this.getEmail("common", true);
      account.email = email;
      account.email_pass = password;
      await this.updateAccount(
        { email, email_pass: password },
        sql`id = ${account.id}`,
      );
    }

    const step = [
      hs("click", '//div[text()="Next"]', 1_000),
      hs("input", 'input[name="email"]', 1_000, account.email),
      hs("click", `//div[text()="Send me product updates and news"]`, 1_000),
      hs("click", '//div[text()="Next"]', 2_000),
      hs("wait", '//div[text()="Later"]', 2_000),
      hs("click", '//div[text()="Next"]', 1_000),
      hs("click", `//div[text()="Let's go!"]`, 1_500),
      hs("click", '//div[text()="Next"]'),
    ];
    await executeSteps(page, step);
  }

  async joinCommunity(
    page: PageWithCursor,
    community_id: string[],
    address: string,
  ) {
    community_id.map(async (item: string) => {
      const data = JSON.stringify({
        community_id: item,
      });

      const headers = {
        accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        address: address,
        authorization: this.token,
        "content-type": "application/json",
        ispwa: "false",
        origin: "https://common.xyz",
        priority: "u=1, i",
        referer: "https://common.xyz/dashboard/global",
        "sec-ch-ua":
          '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      };

      const r = await this.requestByFetch<{
        result: { data: { address_id: number } };
      }>(
        page,
        "post",
        "https://common.xyz/api/internal/trpc/community.joinCommunity",
        data,
        { headers: headers },
      );
      if (!r.result?.data?.address_id) {
        logger.error(`Failed to complete task ${item}`);
      }
    });
  }

  async getStatus(page: PageWithCursor) {
    const headers = {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      authorization: this.token,
      "content-type": "application/json",
      ispwa: "false",
      origin: "https://common.xyz",
      priority: "u=1, i",
      referer: "https://common.xyz/dashboard/global",
      "sec-ch-ua":
        '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    };
    const r = await this.requestByFetch<{
      result: {
        data: {
          jwt: string;
          email: string;
          communities: { id: string }[];
        };
      };
    }>(
      page,
      "get",
      "https://common.xyz/api/internal/trpc/user.getStatus",
      null,
      { headers: headers },
    );
    return r;
  }
}
