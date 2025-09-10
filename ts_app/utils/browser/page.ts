import { Browser, ElementHandle, Page } from "rebrowser-puppeteer-core";
import logger from "../../infrastructure/logger";
import { FindPageOption } from "../../types/browser";
import { sleep } from "../help";
import { Result } from "../../types";

export function wrapSelector(selector: string): string {
  if (selector.startsWith("/") || selector.startsWith("(")) {
    return `::-p-xpath("${selector}")`;
  }

  if (selector.includes("->")) {
    const sp = selector.split("->");
    if (sp.length != 2) {
      return selector;
    }
    return `${sp[0].trim()} ::-p-text(${sp[1].trim()})`;
  }

  return selector;
}

export async function getElement(
  page: Page,
  selector: string,
): Promise<ElementHandle<Element> | null> {
  return await page.$(wrapSelector(selector));
}

export async function getElements(
  page: Page,
  selector: string,
): Promise<ElementHandle<Element>[] | null> {
  return await page.$$(wrapSelector(selector));
}

export async function wait(page: Page, selector: string, timeout = 30_000) {
  return await page
    .locator(wrapSelector(selector))
    .setTimeout(timeout)
    .waitHandle();
  // return await page.waitForSelector(wrapSelector(selector), {
  //   timeout: timeout,
  //   visible: true,
  // });
}

export async function waitAndClick(
  page: Page,
  selector: string,
  timeoutMS: number = 20_000,
  retries = 1,
  interval = 800,
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const c = await wait(page, selector, timeoutMS);
      if (!c) {
        await sleep(interval);
        continue;
      }
      await c.click();

      return;
    } catch {
      await sleep(interval);
    }
  }
  throw new Error(`点击失败: ${selector}`);
}

export async function click(page: Page, selector: string): Promise<void> {
  await page.locator(wrapSelector(selector)).click();
}

export async function hasClick(page: Page, selector: string): Promise<void> {
  if (await has(page, selector)) {
    await click(page, selector);
  }
}

export async function clickIfAvailable(
  page: Page,
  selector: string,
): Promise<boolean> {
  const buttons = await page.$$(selector);
  if (buttons.length === 0) return false;

  const isDisabled = await page.evaluate(
    (el) => el.hasAttribute("disabled"),
    buttons[0],
  );
  if (isDisabled) return false;

  await buttons[buttons.length - 1].click(); // 点击最后一个按钮（通常是“确认”）
  return true;
}

export async function clickWaitAvailable(
  page: Page,
  selector: string,
  timeoutMS: number = 20_000,
  interval = 800,
): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    try {
      const button = await page.waitForSelector(wrapSelector(selector), {
        timeout: timeoutMS,
        visible: true,
      });
      if (!button) {
        await sleep(interval);
        continue;
      }
      const isDisabled = await page.evaluate(
        (el) => el.hasAttribute("disabled"),
        button,
      );
      if (isDisabled) {
        continue;
      }
      await button.click();

      return;
    } catch {
      await sleep(interval);
    }
  }
  throw new Error(`点击失败: ${selector}`);
}

export async function getText(
  page: Page,
  selector: string,
): Promise<string | null> {
  const heading = await page.$eval(wrapSelector(selector), (element) => {
    return element.textContent;
  });
  return heading;
}

export async function getNumber(
  page: Page,
  selector: string,
  trim: string[],
): Promise<number | null> {
  const elm = await page.$(wrapSelector(selector));
  if (!elm) {
    return null;
  }
  trim.push(",", " ");
  let text = await elm?.evaluate((node) => node.textContent);
  trim.forEach((t) => {
    if (!text) {
      return null;
    }
    text = text.replace(t, "");
  });
  if (!text) {
    return null;
  }
  return parseInt(text);
}

export async function has(
  page: Page,
  selector: string,
  timeoutMS: number = 2000,
): Promise<boolean> {
  try {
    const e = await wait(page, selector, timeoutMS);
    return e != null;
  } catch {
    return false;
  }
}

// timeoutMS 是等待元素的超时时间, delay 是输入延迟(更像一个用户)
export async function input(
  page: Page,
  selector: string,
  val: string,
  timeoutMS: number = 2000,
): Promise<void> {
  await wait(page, selector, timeoutMS);
  await page.click(wrapSelector(selector), { count: 3 });
  await page.keyboard.press("Backspace");
  await page.locator(wrapSelector(selector)).fill(val);
}

export async function upload(
  page: Page,
  selector: string,
  val: string,
  timeoutMS: number = 2000,
) {
  const fileElement = (await wait(
    page,
    selector,
    timeoutMS,
  )) as ElementHandle<HTMLInputElement>;
  await fileElement.uploadFile(val);
}

export type SelectorTaskItem<T> = [
  selector: string,
  callback: (element: ElementHandle<Element>) => Promise<T>,
];

export async function race<T>(
  page: Page,
  tasks: Record<string, (element: ElementHandle<Element>) => Promise<T>>,
  timeout = 10000,
): Promise<T | null> {
  const racePromises = Object.entries(tasks).map(([selector, callback]) =>
    page
      .waitForSelector(selector, { timeout })
      .then(async (el) => (el ? callback(el) : undefined)),
  );

  const result = await Promise.race(racePromises);
  return result ?? null;
}

export async function closePage(
  browser: Browser,
  excludeOpt: FindPageOption,
  include: boolean = false,
) {
  const pages = await browser.pages();
  for (let i = 0; i < pages.length; i++) {
    const u = pages[i].url().includes(excludeOpt.urlContain);
    const t = pages[i].url().includes(excludeOpt.titleContain);
    if (excludeOpt.urlContain != null && (include ? u : !u)) {
      await pages[i].close();
      await sleep(200);
      continue;
    }
    if (
      excludeOpt.titleContain != null &&
      (await pages[i].title()).includes(excludeOpt.titleContain) &&
      (include ? t : !t)
    ) {
      await pages[i].close();
      await sleep(200);
      continue;
    }
  }
}

export async function findPage(
  browser: Browser,
  opt: FindPageOption,
): Promise<Result<Page>> {
  const pages = await browser.pages();
  for (let i = 0; i < pages.length; i++) {
    const _u = pages[i].url();
    if (opt.urlContain != null && _u.includes(opt.urlContain)) {
      return { ok: true, data: pages[i] };
    }
    if (
      opt.titleContain != null &&
      (await pages[i].title()).includes(opt.titleContain)
    ) {
      return { ok: true, data: pages[i] };
    }
  }
  return { ok: false, msg: `没找到指定页面` } as Result<Page>;
}

export async function newPage(browser: Browser, url?: string): Promise<Page> {
  const page = await browser.newPage();
  await page.bringToFront();
  try {
    // await page.setViewport({ width: 1920, height: 1080 });
    if (!url) return page;
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.bringToFront();
  } catch (err) {
    if (err.message.includes("net::ERR_ABORTED")) {
      console.log("忽略追踪跳转错误，继续执行...");
    } else {
      logger.error("打开页面失败", err);
      await page.close();
    }
  }

  return page;
}

export async function waitForPageWithMoreThanOne(
  browser: Browser,
  retries = 20,
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    const pages = await browser.pages();
    if (pages.length > 1) return;
    await sleep(500);
  }
  throw new Error("未检测到新页面");
}

export async function retryAction(
  action: () => Promise<void>,
  attempts = 5,
  interval = 1000,
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await action();
      return;
    } catch (e) {
      if (i === attempts - 1) throw e;
      await sleep(interval);
    }
  }
}

export async function getLocalStorageItem(
  page: Page,
  key: string,
  options: any = {},
) {
  const { parseJSON = true, defaultValue = null } = options;

  const item = await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, key);

  if (item === null || item === undefined) {
    return defaultValue;
  }

  if (!parseJSON) {
    return item;
  }

  try {
    const parsed = JSON.parse(item);
    // 检查解析后是否是对象或数组
    if (typeof parsed === "object" || Array.isArray(parsed)) {
      return parsed;
    }
    return item; // 返回原始字符串
  } catch (e) {
    logger.warn(`无法解析localStorage项"${key}":, ${e.message}`);
    return item;
  }
}

/**
 * 滚动指定 index 的 .overflow-y-auto 元素
 * @param page Puppeteer 页面对象
 * @param index 第几个匹配的元素（从 0 开始）
 * @param direction 滚动方向：'top' 或 'bottom'，默认 bottom
 * @param loop 是否循环滚动（用于懒加载），默认 false
 * @param selector CSS 选择器，默认 '.overflow-y-auto'
 * @returns 成功滚动返回 true，未找到元素返回 false
 */
export async function scrollOverflowElement(
  page: Page,
  index: number = 0,
  direction: "top" | "bottom" = "bottom",
  loop = false,
  selector = ".overflow-y-auto",
): Promise<boolean> {
  const elements = await page.$$(wrapSelector(selector));
  if (elements.length < index) {
    return false;
  }

  const el = elements[index];
  if (!el) {
    return false;
  }

  await page.evaluate(
    async (element, direction, loop) => {
      if (!loop) {
        element.scrollTop = direction === "bottom" ? element.scrollHeight : 0;
        return;
      }

      let prevHeight = -1;
      while (true) {
        element.scrollTop = direction === "bottom" ? element.scrollHeight : 0;
        await sleep(500);
        const current = element.scrollHeight;
        if (current === prevHeight) break;
        prevHeight = current;
      }
    },
    el,
    direction,
    loop,
  );

  return true;
}

type StepAction = "click" | "input" | "scroll" | "fn" | "wait" | "upload";

export type Step = {
  action: StepAction;
  selector: string;
  value?: string;
  delay?: number;
  fn?: () => Promise<void>;
  has?: boolean;
  stop?: () => Promise<boolean>;
};
export async function executeSteps(page: Page, steps: Step[]): Promise<void> {
  const MAX_RETRIES = 8;
  const RETRY_DELAY = 1_000;

  const actionHandlers: Record<string, (step: Step) => Promise<void>> = {
    click: async (step) => click(page, step.selector),
    input: async (step) => input(page, step.selector, step.value || ""),
    scroll: async (step) => {
      const dir = step.value?.includes("top") ? "top" : "bottom";
      await scrollOverflowElement(page, 0, dir, false, step.selector);
    },
    fn: async (step) => step.fn && step.fn(),
    wait: async () => Promise.resolve(),
    upload: async (step) => upload(page, step.selector, step.value),
  };

  for (const step of steps) {
    if (step.delay) await sleep(step.delay);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (step.has && !(await has(page, step.selector))) return;
        !!step.selector && (await wait(page, step.selector));

        const handler = actionHandlers[step.action];
        if (!handler) {
          throw new Error(`Unsupported action: ${step.action}`);
        }

        await handler(step);
        break;
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY);
        } else {
          throw new Error(
            `Failed to execute step [${step.action}] on selector [${step.selector}]: ${error}`,
          );
        }
      }
      if (step.stop && (await step.stop())) break;
    }
  }
}

export function hs(
  action: StepAction,
  selector: string,
  delay: number = 800,
  value: string = "",
  fn: () => Promise<void> = async () => {},
  has: boolean = false,
  stop?: () => Promise<boolean>,
): Step {
  return {
    action,
    selector,
    value,
    delay,
    fn,
    has,
    stop,
  };
}

export function by_click(
  selector: string,
  delay: number = 800,
  has: boolean = false,
  stop?: () => Promise<boolean>,
): Step {
  return {
    action: "click",
    selector,
    delay,
    has,
    stop,
  };
}

export function by_input(
  selector: string,
  value: string = "",
  delay: number = 800,
  has: boolean = false,
  stop?: () => Promise<boolean>,
): Step {
  return {
    action: "input",
    selector,
    delay,
    has,
    stop,
    value,
  };
}

export function by_wait(
  selector: string,
  delay: number = 800,
  has: boolean = false,
  stop?: () => Promise<boolean>,
): Step {
  return {
    action: "wait",
    selector,
    delay,
    has,
    stop,
  };
}

export function by_fn(
  fn: () => Promise<void>,
  delay: number = 800,
  has: boolean = false,
  stop?: () => Promise<boolean>,
): Step {
  return {
    action: "fn",
    selector: "",
    delay,
    has,
    stop,
    fn,
  };
}

export function by_upload(
  selector: string,
  delay: number = 800,
  has: boolean = false,
  stop?: () => Promise<boolean>,
): Step {
  return {
    action: "upload",
    selector,
    delay,
    has,
    stop,
  };
}

export function by_scroll(
  selector: string,
  value: string = "",
  delay: number = 800,
  has: boolean = false,
  stop?: () => Promise<boolean>,
): Step {
  return {
    action: "scroll",
    selector,
    delay,
    has,
    stop,
    value,
  };
}

export async function getCookies(
  browser: Browser,
  keys: string[] = [],
  domain: string = "",
): Promise<{ strCookie: string; kmap: Record<string, string> }> {
  const cookies = await browser.cookies();
  const data = cookies
    .filter((item) => (domain ? item.domain.includes(domain) : true))
    .filter((item) => (!!keys.length ? keys.includes(item.name) : true));
  const kmap: Record<string, string> = {};
  data.map((item) => {
    kmap[item.name] = item.value;
  });

  return {
    strCookie: data.map((item) => `${item.name}=${item.value}`).join("; "),
    kmap,
  };
}

type SelectorType = "text" | "css" | "xpath";

interface ClickElementOptions {
  selector: string;
  type: SelectorType;
  hover?: boolean;
  focus?: boolean;
  delayMs?: number;
  index?: number; // 多个匹配时选哪个，默认 0
}

/**
 * 通用点击函数：支持 text、css、xpath 查询方式
 */
export async function clickElement(
  page: Page,
  options: ClickElementOptions,
): Promise<boolean> {
  const {
    selector,
    type,
    hover = false,
    focus = false,
    delayMs = 0,
    index = 0,
  } = options;

  return await page.evaluate(
    async (selector, type, hover, focus, delayMs, index) => {
      let el: HTMLElement | null = null;

      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

      if (type === "css") {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        el = elements[index] ?? null;
      } else if (type === "xpath") {
        const result = document.evaluate(
          selector,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        );
        el = result.snapshotItem(index) as HTMLElement | null;
      } else if (type === "text") {
        const all = Array.from(
          document.querySelectorAll<HTMLElement>("body *"),
        );
        const matching = all.filter(
          (node) => node.innerText?.includes(selector), // 可改为精确匹配 node.innerText === selector
        );
        el = matching[index] ?? null;
      }

      if (!el) return false;

      if (focus) el.focus();
      if (hover)
        el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      if (delayMs) await delay(delayMs);

      el.click();
      return true;
    },
    selector,
    type,
    hover,
    focus,
    delayMs,
    index,
  );
}

export function disableNewPages(browser: Browser, page: Page): () => void {
  let targetListener: ((target: any) => Promise<void>) | null = null;

  // 1. 覆盖 window.open
  page.evaluateOnNewDocument(() => {
    window.open = () => null;
  });

  // 2. 监听 targetcreated，关闭新页面
  targetListener = async (target) => {
    const newPage = await target.page();
    if (newPage) {
      console.log("检测到新页面，已关闭:", newPage.url());
      await newPage.close();
    }
  };
  browser.on("targetcreated", targetListener);

  // 返回关闭函数（类似 Go defer）
  return () => {
    if (targetListener) {
      browser.off("targetcreated", targetListener);
      targetListener = null;
    }
    console.log("已移除禁用新页面功能");
  };
}
