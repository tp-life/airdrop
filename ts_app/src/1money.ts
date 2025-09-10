import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { Base } from "./app";
import { MoneyAccount, MoneyTable } from "../schema/money";
import { sql } from "drizzle-orm";
import { captchaSolver } from "../config/ext";
import { click, input, wait } from "../utils/browser/page";
import { waitForRecaptcha } from "../utils/browser/ext";
import { Register } from "../register/decorators";
import { sleep } from "../utils/help";

@Register("money")
export class oneMoney extends Base {
  public table: MySqlTable<TableConfig> = MoneyTable;

  async run() {
    let q = sql`register = 0`;
    const account = await this.getAccount<MoneyAccount>({ where: q });

    const page = await this.newBrowser(
      "https://www.1moneynetwork.com/",
      [captchaSolver],
      `money_${account.id}`,
    );

    await wait(page, `(//input[@placeholder="Enter your email address"])[2]`);

    await input(
      page,
      `(//input[@placeholder="Enter your email address"])[2]`,
      account.email,
    );

    await click(page, `(//button[text()="Join waitlist"])[2]`);
    const ok = await waitForRecaptcha(page);
    if (!ok) return;
    await sleep(2_000);
    await click(page, `(//button[text()="Join waitlist"])[2]`);

    const r = await wait(page, `//span[text()="Congrats, you’ve been added!"]`);
    if (r) {
      await this.updateAccount({ register: 1 }, sql`id = ${account.id}`);
    }
  }
}
