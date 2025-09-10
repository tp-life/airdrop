import { Worker } from "worker_threads";
import path from "path";
import logger from "./ts_app/infrastructure/logger";
import { sleep } from "./ts_app/utils/help";

interface WorkerOptions {
  scriptPath: string;
  name: string;
  arg?: any;
  timeout?: number;
  concurrency?: number;
  retryInterval?: number;
}

export class WorkerManager {
  private readonly workers = new Set<Worker>();
  private readonly scriptPath: string;
  private readonly name: string;
  private readonly arg: any;
  private readonly timeout: number;
  private readonly retryInterval: number;
  private readonly concurrency: number;
  private isExiting = false;

  constructor(options: WorkerOptions) {
    this.scriptPath = path.resolve(__dirname, options.scriptPath);
    this.name = options.name;
    this.arg = options.arg || {};
    this.timeout = options.timeout || 15 * 60 * 1000;
    this.retryInterval = options.retryInterval || 10 * 60 * 1000;
    this.concurrency = options.concurrency || 1;

    process.on("SIGINT", this.handleExit.bind(this));
    process.on("SIGTERM", this.handleExit.bind(this));
  }

  private async runWorker(workerId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.scriptPath, {
        workerData: {
          name: this.name,
          arg: this.arg,
          timeout: this.timeout,
          workID: workerId,
        },
      });

      this.workers.add(worker);

      const cleanup = () => {
        this.workers.delete(worker);
      };

      worker.on("message", (msg) => {
        logger.info(`[worker ${workerId}] 成功: ${msg}`);
        cleanup();
        resolve();
      });

      worker.on("error", (err) => {
        logger.error(`[worker ${workerId}] 错误: ${err}`);
        cleanup();
        reject(err);
      });

      worker.on("exit", (code) => {
        cleanup();
        if (code !== 0) {
          logger.warn(`[worker ${workerId}] 异常退出: code=${code}`);
          reject(new Error(`Exit code ${code}`));
        } else {
          logger.info(`[worker ${workerId}] 正常退出`);
          resolve();
        }
      });
    });
  }

  private async runWorkerWithRestart(workerId: number): Promise<void> {
    while (!this.isExiting) {
      try {
        await this.runWorker(workerId);
        // 如果正常完成，退出循环（不重启）
        break;
      } catch (err) {
        logger.warn(
          `[worker ${workerId}] 退出异常，${this.retryInterval / 1000}s 后重试...`,
        );
        await sleep(this.retryInterval);
      }
    }
  }

  private async handleExit() {
    if (this.isExiting) return;
    this.isExiting = true;

    logger.warn("🚪 捕获退出信号，通知所有 worker 停止...");

    for (const worker of this.workers) {
      try {
        worker.postMessage("exit");
      } catch (_) {}
    }

    await sleep(3000);

    for (const worker of this.workers) {
      try {
        await worker.terminate();
      } catch (_) {}
    }

    logger.warn("🧹 所有 worker 已终止，安全退出");
    process.exit(0);
  }

  public async start() {
    logger.info(
      `🚀 启动任务: ${this.name} 并发=${this.concurrency} timeout=${this.timeout / 1000}s`,
    );

    const workerPromises: Promise<void>[] = [];

    for (let i = 0; i < this.concurrency; i++) {
      workerPromises.push(this.runWorkerWithRestart(i));
      await sleep(5_000); // 平滑启动
    }

    await Promise.all(workerPromises);
  }
}
