import { WorkerManager } from "./worker_manager";
import { Command } from "commander";
import config from "./ts_app/config";

const program = new Command();
program
  .requiredOption("-n, --name <string>", "脚本名称")
  .option("-g, --limit <number>", "并发数量", parseInt)
  .option("-a, --arg <string>", "传入的参数")
  .option("-t, --timeout <number>", "单任务超时（ms）", parseInt)
  .parse();

const { name, limit, arg, timeout } = program.opts();

const manager = new WorkerManager({
  scriptPath: "worker.js", // 👈 相对于当前文件目录
  name,
  arg: arg,
  timeout,
  concurrency: limit || config.app.thread_num,
  retryInterval: 3 * 60 * 1000,
});

manager.start().catch((err) => {
  console.error("主线程崩溃:", err);
  process.exit(1);
});
