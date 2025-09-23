import {
  int,
  mysqlTable,
  MySqlTable,
  TableConfig,
  varchar,
} from "drizzle-orm/mysql-core";
import { Base } from "./app";
import { Account, baseColumns } from "../schema/base_models";
import { sql } from "drizzle-orm";
import { metamask } from "../config/ext";
import {
  by_click,
  by_fn,
  by_wait,
  click,
  executeSteps,
  has,
  scrollOverflowElement,
  wait,
} from "../utils/browser/page";
import { Register } from "../register/decorators";
import { PageWithCursor } from "puppeteer-real-browser";
import { sleep } from "../utils/help";
import { TwitterAccount } from "../utils/twitter/x";
import X from "../utils/twitter/x_simple";
import { TwitterAuthenticator } from "../utils/twitter/x_front";
import { BlockedError } from "../types/error";
import { blockedResource } from "../db/help";
import { TwitterTable } from "../schema/twitter";

const nexusTable = mysqlTable("nexus", {
  ...baseColumns(),
  prover_id_3_3: varchar("prover_id_3_3", { length: 255 }),
  address: varchar("address", { length: 255 }),
  private_key: varchar("private_key", { length: 255 }),
  x_token: varchar("x_token", { length: 255 }),
  dc_token: varchar("dc_token", { length: 255 }),
  points: int("points"),
  completed: int("completed"),
});

type nexusAccount = Account<typeof nexusTable>;

@Register("nexus")
export class Nexus extends Base {
  public table: MySqlTable<TableConfig> = nexusTable;
  protected walletExt = metamask;

  get headers() {
    return {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.7",
      "content-type": "application/json",
      origin: "https://quest.nexus.xyz",
      priority: "u=1, i",
      referer: "https://quest.nexus.xyz/loyalty",
      "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
      "sec-ch-ua-arch": '"arm"',
      "sec-ch-ua-bitness": '"64"',
      "sec-ch-ua-full-version-list":
        '"Chromium";v="140.0.0.0", "Not=A?Brand";v="24.0.0.0", "Brave";v="140.0.0.0"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"macOS"',
      "sec-ch-ua-platform-version": '"15.6.1"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
    };
  }

  async run() {
    let q = sql`completed = 0 and prover_id_3_3 > ''`;
    // q = sql`id = 23108`;

    const account = await this.getAccount<nexusAccount>({ where: q });

    // const token = "0d8d4a05866384d7332de0de9af12ad07dc89911";

    // const xClient = new X(token, this.strIP);
    // await xClient.Login();
    // await xClient.SetRepost("1937202625352741214");

    // return;
    const page = await this.login(account);
    await this.complete(account, page);
    // await page.waitForNetworkIdle();
    if (!(await has(page, `//span[text()="Visit Blog"]`))) {
      await this.updateAccountByID({ completed: 1 }, account.id);
    }
  }

  async login(account: nexusAccount) {
    const page = await this.newBrowser("https://quest.nexus.xyz/loyalty", [
      this.walletExt,
    ]);

    const step = [
      by_wait(`//a[text()="Connect Wallet"]`),
      by_click(`//a[text()="Connect Wallet"]`),
      by_click(`:scope  >>> ::-p-text(Continue with a wallet)`),
      by_click(`:scope  >>> ::-p-text(MetaMask)`),
      by_fn(async () => {
        await this.walletManager.doSomethingFn(this.browser.browser, 3);
        await sleep(2_000);
      }),
      // by_wait(`//button[text()="Connect X"]`, 800, true),
      // by_fn(
      //   async () => {
      //     await this.bind_x(page, account, `//button[text()="Connect X"]`);
      //     await page.waitForNavigation();
      //   },
      //   800,
      //   true,
      //   `//button[text()="Connect X"]`,
      // ),
      by_wait(`//button[text()="Connect Discord"]`, 5000, true),
      by_fn(
        async () => {
          await this.bind_dc(
            page,
            account,
            `//button[text()="Connect Discord"]`,
            sql`created_at > '2025-08-31 00:00:00'`,
          );
        },
        800,
        true,
        `//button[text()="Connect Discord"]`,
      ),
      by_wait(`//*[text()="Camp Nexus"]`),
    ];

    await executeSteps(page, step);

    return page;
  }

  async complete(account: nexusAccount, page: PageWithCursor) {
    await page.mouse.wheel({ deltaY: 999999 });
    await sleep(2_000);
    await page.mouse.wheel({ deltaY: 999999 });
    // await page.evaluate(() => {
    //   window.scrollTo(0, document.body.scrollHeight);
    // });
    // await this.session(page);
    await this.completeBlog(page);
    await this.completeSpotify(page);

    if (!account.x_token) {
      return;
    }

    const xClient = new X(account.x_token, this.strIP);
    await xClient.Login();
    await this.followNexus(xClient, page);

    await this.shareBadge(xClient, page);

    await this.partnership(xClient, page);

    await this.announcement(xClient, page);
    await this.shineLN(xClient, page);
    await this.goodbyeCN(xClient, page);
    await this.commentX(xClient, page);
  }

  async followNexus(x: X, page: PageWithCursor) {
    await sleep(2_000);
    if (!(await has(page, `#loyalty-quest-root-drip_x_follow`))) {
      return;
    }

    await x.SetFollowers("NexusLabs");

    await click(
      page,
      `#loyalty-quest-root-drip_x_follow a[action="DripQuest"]`,
    );
    await page.bringToFront();
    await sleep(1_500);

    await executeSteps(page, [
      by_wait(`//span[text()="Claim"]`),
      by_click(`//span[text()="Claim"]`),
    ]);
  }

  async xReport(
    x: X,
    page: PageWithCursor,
    text: string,
    twid: string,
    comment = false,
  ) {
    await sleep(2_000);
    if (!(await has(page, `//*[text()="${text}"]`))) {
      return;
    }

    comment
      ? await x.CreateTweet("oh....... ", "1968447901593448616")
      : x.SetRepost(twid);

    await click(
      page,
      `//*[text()="${text}"]/ancestor::*[@id="loyalty-quest-root-drip_x_tweet"]//a[@action="DripQuest"]`,
    );

    const xFront = new TwitterAuthenticator(x.token);
    try {
      await xFront.checkSuspended(page);
    } catch (err) {
      if (err instanceof BlockedError) {
        await blockedResource(TwitterTable, sql`token = ${x.token}`, 1);
      }
      return;
    }

    await page.bringToFront();
    await sleep(1_500);

    await executeSteps(page, [
      by_wait(`//span[text()="Claim"]`),
      by_click(`//span[text()="Claim"]`),
    ]);
  }

  async partnership(x: X, page: PageWithCursor) {
    await this.xReport(
      x,
      page,
      "Celebrate our Snag Partnership",
      "1960464344032141330",
    );
  }

  async announcement(x: X, page: PageWithCursor) {
    await this.xReport(
      x,
      page,
      "Like & Share our Testnet III Announcement",
      "1937202625352741214",
    );
  }

  async shineLN(x: X, page: PageWithCursor) {
    await this.xReport(
      x,
      page,
      "Shine a Light on the Numbers",
      "1965855165568938149",
    );
  }

  async goodbyeCN(x: X, page: PageWithCursor) {
    await this.xReport(x, page, "Goodbye Camp Nexus", "1965211990844121185");
  }

  async shareBadge(x: X, page: PageWithCursor) {
    await this.xReport(
      x,
      page,
      "Share Spelunking Badge",
      "1963033876718359026",
    );
  }

  async commentX(x: X, page: PageWithCursor) {
    await this.xReport(
      x,
      page,
      "Support the Nexus Ecosystem",
      "1968447901593448616",
      true,
    );
  }

  async completeBlog(page: PageWithCursor) {
    await sleep(5_000);
    if (!(await has(page, `//span[text()="Visit Blog"]`, 5000))) {
      return;
    }

    await click(page, `//span[text()="Visit Blog"]`);
    await page.bringToFront();
    await sleep(1_500);
    await wait(page, `//span[text()="Claim"]`);
    await click(page, `//span[text()="Claim"]`);
  }

  async completeSpotify(page: PageWithCursor) {
    await sleep(2_000);
    if (!(await has(page, `a[label="Follow or Rate on Spotify"]`))) {
      return;
    }

    await click(page, `a[label="Follow or Rate on Spotify"]`);
    await page.bringToFront();
    await sleep(1_500);
    await wait(page, `//span[text()="Claim"]`);
    await click(page, `//span[text()="Claim"]`);
  }

  async session(page: PageWithCursor) {
    const url = "https://quest.nexus.xyz/api/auth/session";
    const res = await this.requestByFetch(page, "get", url);
    return res;
  }
}
