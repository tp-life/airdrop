import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { Account, tableFactor } from "../schema/base_models";
import { Base } from "./app";
import { sql } from "drizzle-orm";
import { Register } from "../register/decorators";
import { metamask } from "../config/ext";
import {
  by_click,
  by_wait,
  executeSteps,
  has,
  hs,
  newPage,
} from "../utils/browser/page";
import { getRandomElements, quickReceiveCode, sleep } from "../utils/help";
import logger from "../infrastructure/logger";

const BloomTable = tableFactor("bloom", {});

type BloomAccount = Account<typeof BloomTable>;

@Register("bloom")
export class Bloom extends Base {
  public table: MySqlTable<TableConfig> = BloomTable;

  protected walletExt: string = metamask;

  async run() {
    await this.register();
  }

  async register() {
    let q = sql`completed = 0`;
    const account = await this.getAccount<BloomAccount>({ where: q });
    await this.setAccountEmail(account, false);
    const page = await this.newBrowser("https://www.bloom.social/", [
      this.walletExt,
    ]);

    let step = [
      hs("wait", `//span[text()="Get Early Access"]`),
      hs("click", `//span[text()="Get Early Access"]`),
      hs(
        "input",
        `input[placeholder="Enter your email"]`,
        1_500,
        account.email,
      ),
      hs("click", `button[type="Submit"]`, 1_000),
      hs("wait", `//h4[text()="Next Step"]`, 2_000),
    ];

    await executeSteps(page, step);
    await sleep(8_000);
    const url = await quickReceiveCode(
      account.email,
      account.email_pass,
      "signup@bloom.social",
      /\[?(https:\/\/bsqhjlc0\.r\.eu-north-1\.awstrack\.me[^\]\s]*)\]?/i,
    );
    if (!url) {
      logger.error("Failed to receive code");
      return;
    }
    const p = await newPage(this.browser.browser, url);
    step = [
      by_wait(`//span[text()="Continue"]`, 800, false, async () => {
        const ok = await has(p, `//h4[text()="Something went wrong."]`, 2_000);
        if (ok) {
          throw new Error("Something went wrong");
        }
        return ok;
      }),
      hs("click", `//span[text()="Continue"]`),
      hs("wait", `input[data-testid="shortText-question-0"]`, 2_000),
    ];
    await executeSteps(p, step);

    const ok = await this.bind_x(
      p,
      account,
      `//div[text()=" Connect X"]`,
      sql`created_at > '2025-07-31 00:00:00'`,
    );
    if (!ok) {
      logger.error("Failed to bind X");
      return;
    }

    const chains = [
      `div[data-testid="[Base]-checkbox"]`,
      `div[data-testid="[Ethereum]-checkbox"]`,
      `div[data-testid="[BNBChain]-checkbox"]`,
      `div[data-testid="[Arbitrum]-checkbox"]`,
      `div[data-testid="[Monad]-checkbox"]`,
      `div[data-testid="[Polygon]-checkbox"]`,
      `div[data-testid="[Solana]-checkbox"]`,
      `div[data-testid="[Bitcoin]-checkbox"]`,
      `div[data-testid="[MegaETH]-checkbox"]`,
    ];

    const speeds = [
      `div[data-testid="[Airdrop hunting]-checkbox"]`,
      `div[data-testid="[Altcoin trading]-checkbox"]`,
      `div[data-testid="[Memecoin trading]-checkbox"]`,
      `div[data-testid="[DeFi yield]-checkbox"]`,
      `div[data-testid="[NFTs]-checkbox"]`,
    ];

    step = [
      hs("wait", `input[data-testid="shortText-question-0"]`, 5_000),
      hs(
        "input",
        `input[data-testid="shortText-question-0"]`,
        1_000,
        account.email,
      ),
      hs("click", `//div[text()="Connect Wallet"]`),
      hs("click", `//div[text()="MetaMask"]`, 1_000),
      hs("fn", "", 1_500, "", async () => {
        this.walletManager.doSomethingFn(this.browser.browser, 2);
      }),
      hs("wait", `//div[text()="Sign to verify"]`),
      hs("click", `//div[text()="Sign to verify"]`),
      hs("fn", "", 1_500, "", async () => {
        this.walletManager.doSomethingFn(this.browser.browser, 2);
      }),
      hs("wait", `//p[text()="Your wallet is verified."]`),
      ...getRandomElements(chains, 3).map((item) => hs("click", item)),
      ...getRandomElements(speeds, 3).map((item) => hs("click", item)),
      hs("click", `button[data-testid="submit-form-button"]`, 1_000),
      by_click(`//div[text()="Submit"]`, 3_000, true),
      hs("wait", `//*[text()="You're on the Waitlist!"]`, 2_000),
    ];

    await executeSteps(p, step);
    await this.updateAccountByID({ completed: 1 }, account.id);
  }
}

// https://twitter.com/i/oauth2/authorize?response_type=code&client_id=cmlDZkdkVFRLOElHSVk5dnBOSXI6MTpjaQ&redirect_uri=https://app.deform.cc/oauth2/twitter_callback&scope=tweet.read%20users.read%20follows.read%20offline.access&code_challenge=iYxbgWI0RfOzGPWdIWgjKMr6C_wUsv-a2orQYAv9ja4&code_challenge_method=S256&state=YTE2ZmRhODktYTEzYS00ZTI2LWI0NTYtNWRkYzVmYzRjNjJkOjpodHRwczovL3NpZ251cC5ibG9vbS5zb2NpYWwvOjp0d2l0dGVyOjp7Im9BdXRoVmVyc2lvbiI6MiwiZm9ybUlkIjoiYzBjMDNkYjItODQ1My00ZDU4LWI1NzMtNjAzMjFmNzY4YzVjIiwicGFnZU51bWJlciI6MH0=
