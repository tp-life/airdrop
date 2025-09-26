import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { Register } from "../register/decorators";
import { Account, tableFactor } from "../schema/base_models";
import { Base } from "./app";
import { sql } from "drizzle-orm";
import {
  by_click,
  by_fn,
  by_wait,
  click,
  executeSteps,
  getText,
  has,
  race,
  wait,
} from "../utils/browser/page";
import { Gmail } from "../utils/google/email";
import { Page } from "rebrowser-puppeteer-core";
import { sleep } from "../utils/help";

const Table = tableFactor("jigsaw", {});

type JigsawAccount = Account<typeof Table>;

@Register("jigsaw")
export class Jigsaw extends Base {
  public table: MySqlTable<TableConfig> = Table;
  private code = "wl4548kmnkur";

  async run() {
    const account = await this.getAccount<JigsawAccount>({
      where: sql`completed = 0`,
    });

    const page = await this.login(account);
    await this.getReferCode(page, account);
    await this.completeX(page, account);
  }

  async completeX(page: Page, account: JigsawAccount) {
    if (await has(page, `//button[text()="Connect your"]`, 5_000)) {
      await this.bind_x(page, account, `//button[text()="Connect your"]`);
    }

    await sleep(2_000);

    await click(page, `(//button[text()="Quests"])[2]`);
    if (await has(page, `//button[text()="Follow"]`, 3_000)) {
      await click(page, `//button[text()="Follow"]`);
      await page.bringToFront();
    }
    await this.updateAccountByID({ completed: 1 }, account.id);
  }

  async login(account: JigsawAccount) {
    const code = await this.getInvite(account, this.code);
    const page = await this.newBrowser(`https://jigsaw.build/?ref=${code}`);
    const gmail = new Gmail(account.email, account.email_pass);
    const ok = await gmail.login(this.browser.browser);
    if (!ok) throw new Error("谷歌邮箱登录失败");
    await page.bringToFront();
    await executeSteps(page, [
      by_wait(`//button[text()="Join the waitlist"]`),
      by_click(`//button[text()="Join the waitlist"]`),
      by_fn(async () => {
        await gmail.authByFront(page, `//button[text()="Connect with Google"]`);
      }),
    ]);

    for (let i = 0; i < 20; i++) {
      try {
        await page.reload({ waitUntil: "networkidle2" });
        await page.waitForNetworkIdle({ timeout: 15_000 });
      } catch {}

      if (await has(page, '//span[contains(text(),"jigsaw.build")]')) {
        break;
      }
    }

    if (
      await has(
        page,
        '//*[text()="canceling statement due to statement timeout"]',
      )
    ) {
      throw new Error("无法加载页面，授权登录失败");
    }

    return page;
  }

  async getReferCode(page: Page, account: JigsawAccount) {
    if (account.referral_code) {
      return;
    }
    await wait(page, `//span[contains(text(),"jigsaw.build")]`);
    const url = await getText(page, `//span[contains(text(),"jigsaw.build")]`);
    const parsedUrl = new URL(url);
    const ref = parsedUrl.searchParams.get("ref");
    if (!ref) return;
    await this.updateAccountByID({ referral_code: ref }, account.id);
  }
}
