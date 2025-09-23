import { workerData, parentPort } from "worker_threads";
import { getScript } from "./ts_app/register";
import { APP } from "./ts_app/src/app";
import logger from "./ts_app/infrastructure/logger";
import "./ts_app/infrastructure/init";
import { sleep } from "./ts_app/utils/help";
import { NoTaskError } from "./ts_app/types/error";

const { name, arg, timeout, workID } = workerData;

const ScriptClass = getScript(name);
if (!ScriptClass) throw new Error(`worker: 未找到脚本 ${name}`);

// const task = new ScriptClass({ arg }, timeout) as APP;
let task: APP;

let isStopped = false;

async function safeStop() {
  if (isStopped || !task) return;
  isStopped = true;
  try {
    await task.stop();
  } catch (e) {
    logger.error(`[worker:${workID}] stop() 异常: ${e}`);
  }
}

// 接收主线程退出指令
parentPort?.on("message", async (msg) => {
  if (msg === "exit") {
    logger.info(`[worker:${workID}] 收到退出指令，正在清理...`);
    await safeStop();
    process.exit(0);
  }
});

// 额外：进程信号 & 未捕获异常防护
process.on("SIGINT", async () => {
  logger.info(`[worker:${workID}] 收到 SIGINT，退出`);
  await safeStop();
  process.exit(0);
});

process.on("uncaughtException", async (err) => {
  logger.error(`[worker:${workID}] 未捕获异常: ${err}`);
  await safeStop();
  process.exit(1);
});

(async () => {
  while (!isStopped) {
    task = new ScriptClass({ arg }, timeout) as APP;
    try {
      await Promise.race([task.run(), sleep(20_000 * 60)]);
    } catch (err) {
      await task.stop();
      if (err instanceof NoTaskError) {
        logger.info("暂时没有获取到新的任务，暂停10分钟后继续执行");
        await sleep(timeout ?? 60_000 * 10);
      } else {
        logger.error(`错误信息：, ${err.message}`); // 包含具体的文件位置
        logger.error(`错误堆栈：, ${err.stack}`); // 包含具体的文件位置
      }
    } finally {
      await task.stop();
      if (global.gc) global.gc(); // 主动 GC
    }
    await sleep(6_000);
  }

  try {
    parentPort?.postMessage("ok");
    await safeStop();
    process.exit(0); // 显式退出
  } catch (err) {
    logger.error(`[worker:${workID}] 执行失败: ${err}`);
    await safeStop();
    process.exit(1);
  }
})();
