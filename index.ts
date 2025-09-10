import config from "./ts_app/config/index";
import { getScript } from "./ts_app/register";
import { APP } from "./ts_app/src/app";
import logger from "./ts_app/infrastructure/logger";
import PQueue from "p-queue";
import { NoTaskError, TimeoutError } from "./ts_app/types/error";
import "./ts_app/infrastructure/init";
import { sleep } from "./ts_app/utils/help";
import { Command } from "commander";

class ConcurrentRunner {
  private queue: PQueue;
  private isRunning = true;

  constructor(
    private concurrency: number,
    private taskFn: any,
    private args: any,
    private retryInterval: number = 10 * 60 * 1000,
    private taskTimeout: number = 15 * 60 * 1000,
  ) {
    this.queue = new PQueue({ concurrency: this.concurrency });
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown() {
    process.on("SIGINT", async () => {
      this.isRunning = false;
      logger.warn("收到 SIGINT，准备退出...");
      await this.queue.onIdle(); // 等待所有任务执行完毕
      process.exit(0);
    });
  }

  private async runWithTimeout(workerId: number) {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new TimeoutError()), this.taskTimeout),
    );

    const task = new this.taskFn({ arg: this.args }) as APP;
    try {
      const run = (async () => {
        await task.run();
      })();

      await Promise.race([run, timeout]);
    } catch (err) {
      if (err instanceof NoTaskError) {
        logger.info(
          `[worker ${workerId}] 无任务，等待 ${this.retryInterval / 1000}s`,
        );
        await sleep(this.retryInterval);
      } else if (err instanceof TimeoutError) {
        logger.warn(`[worker ${workerId}] 超时未完成`);
      } else {
        logger.error(`[worker ${workerId}] 任务异常: ${err}`);
        await task.stop();
      }
    } finally {
      await task.stop();
      logger.info(`[worker ${workerId}] 任务结束`);
    }
  }

  public async start() {
    for (let i = 0; i < this.concurrency; i++) {
      this.queue.add(async () => {
        while (this.isRunning) {
          await this.runWithTimeout(i);
          await sleep(1000); // 防止 CPU 打爆
        }
      });
      await sleep(1000);
    }
  }
}

// ✅ 加入兜底函数，统一入口异常处理
function withGlobalErrorHandler(fn: () => Promise<void>) {
  process.on("unhandledRejection", (reason) => {
    logger.error(`[unhandledRejection] 未处理的 Promise 异常:, ${reason}`);
  });

  process.on("uncaughtException", (err) => {
    logger.error(`[uncaughtException] 未捕获异常:, ${err}`);
  });

  // 顶层 try-catch 包裹 main()
  fn().catch((err) => {
    logger.error(`[main] 入口函数异常:', ${err}`);
    process.exit(1);
  });
}

const program = new Command();

program
  .name("airdrop")
  .description("a9 airdrop 工具")
  .requiredOption("-n, --name <string>", "脚本名称 (必填)")
  .option("-g, --limit <number>", "并发数量", parseInt)
  .option("-a, --arg <string>", "随意参数")
  .parse(process.argv);

const argv = program.opts();

async function main() {
  const ScriptClass = getScript(argv.name);
  if (!ScriptClass) {
    logger.error(`❌ 未找到对应的脚本: ${argv.name}`);
    process.exit(1);
  }

  let limit = config.app.thread_num;
  if (argv.limit) {
    limit = argv.limit;
  }

  const runner = new ConcurrentRunner(limit, ScriptClass, argv.arg);
  await runner.start();
}

// ✅ 启动主函数，附带全局兜底保护
withGlobalErrorHandler(main);
