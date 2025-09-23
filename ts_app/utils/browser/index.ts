import { ProxyIP } from "../../types/proxy";
import { Options, PageWithCursor, connect } from "puppeteer-real-browser";
import type { Browser, Page } from "rebrowser-puppeteer-core";
import config from "../../config";
import logger from "../../infrastructure/logger";
import { rimraf } from "rimraf";
import { sleep } from "../help";
import { captchaSolver, walletExtList, yesCaptcha } from "../../config/ext";
import { settingYesCaptcha } from "./ext";
import { getTypeByExt } from "../wallet/config";
import { Wallet } from "../wallet/wallet";
import { checkTurnstile } from "./turnstile";
import { setCaptchaSolver } from "./captcha-solver";

type BrowserOpts = {
  url?: string;
  pk?: string;
  autoClick?: boolean;
};

export class BrowserManage {
  public browser: Browser = null;
  constructor(
    private userDir: string,
    private exts: string[] = [],
    private proxy?: ProxyIP,
  ) {}

  async open(opts: BrowserOpts = {}): Promise<PageWithCursor> {
    const extStr = this.exts.join(",");
    let customConfig: any = {
      userDataDir: this.userDir,
    };

    if (!!config.app.exe) {
      customConfig["chromePath"] = config.app.exe;
      logger.info(`chromePath: ${config.app.exe}`);
    }

    const connOpts: Options = {
      proxy: this.proxy ?? ({} as ProxyIP),
      turnstile: !!opts?.autoClick,
      customConfig: customConfig,
      connectOption: {
        defaultViewport: null,
      },
      args: [
        `--disable-extensions`,
        `--disable-extensions-except=${extStr}`,
        `--load-extension=${extStr}`,
        "--proxy-bypass-list=passwd.946a.cn,update.googleapis.com,*.update.googleapis.com,safebrowsing.googleapis.com,*.gvt1.com,*.gvt1-cn.com",
        `--hide-crash-restore-bubble`,
        "--disable-features=ExtensionsToolbarMenu,SidePanel",
        "--disable-component-extensions-with-background-pages",
        "--disable-popup-blocking",
        "--no-default-browser-check",
        "--start-maximized",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    };
    const { page, browser } = await connect(connOpts);

    page.setDefaultTimeout(90000); // 90秒 = 90,000毫秒
    this.browser = browser;
    // await page.setViewport({ width: 1920, height: 1080 } as Viewport);
    if (!!opts.url) {
      await page.goto(opts.url, { waitUntil: "networkidle2", timeout: 90_000 });
    }

    if (this.exts.filter((item) => walletExtList.includes(item)).length > 0) {
      await sleep(10_000);
    } else {
      await sleep(3_000);
    }

    let pages = await browser.pages();
    if (pages.length > 1) {
      // 关闭默认自动打开拓展的页面
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close();
      }
    }
    await this.doExt(browser, opts);
    await page.bringToFront();
    await page.reload({ waitUntil: "networkidle2" });

    return page;
  }

  async doExt(browser: Browser, opts: BrowserOpts) {
    if (this.exts.includes(yesCaptcha)) {
      if (!(await settingYesCaptcha(browser, config.app.yesCaptcha_keys))) {
        throw new Error("YesCaptcha 加載失败");
      }
    }

    if (this.exts.includes(captchaSolver)) {
      if (!(await setCaptchaSolver(browser))) {
        throw new Error("captchaSolver 加載失败");
      }
    }

    // 自动导入钱包
    const walletExts = this.exts.filter((item) => walletExtList.includes(item));

    if (!!opts.pk && walletExts.length > 0) {
      for (let i = 0; i < walletExts.length; i++) {
        const kind = getTypeByExt(walletExts[i]);
        if (!kind) continue;

        const w = new Wallet(kind);
        if (!(await w.importFn(browser, opts.pk)))
          throw new Error("导入钱包失败");
      }
    }
  }

  async close() {
    logger.loading("开始准备关闭浏览器中...");
    try {
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (err) {
          logger.error(`browser.close 失败，尝试断开连接：${err}`);
          await this.browser.disconnect();
        }
      }
    } finally {
      logger.info("准备清理缓存目录...");
      // 最多等 5 秒，分批尝试删除
      for (let i = 0; i < 5; i++) {
        try {
          await rimraf(this.userDir, { preserveRoot: true });
          logger.info("缓存目录清理完成");
          return;
        } catch (err) {
          logger.warn(`目录删除失败，第 ${i + 1} 次重试: ${err}`);
          await sleep(1000);
        }
      }
      logger.error("缓存目录删除最终失败！");
    }
  }

  async startTurnstile(page: Page) {
    this.browser.on("targetcreated", async (target) => {
      if (target.type() === "page") {
        let newPage = await target.page();
        await this.tunrnsitle(newPage);
      }
    });
    await this.tunrnsitle(page);
  }

  async tunrnsitle(page: Page) {
    let solveStatus = true;
    page.on("close", () => {
      solveStatus = false;
    });

    async function turnstileSolver() {
      while (solveStatus) {
        await checkTurnstile({ page }).catch(() => {});
        await new Promise((r) => setTimeout(r, 1000));
      }
      return;
    }

    turnstileSolver();
  }
}
