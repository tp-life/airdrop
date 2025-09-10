import callsites from "callsites";

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
};

const timezoned = () => {
  return new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Chongqing",
  });
};

function getCallerLocation(): string {
  const sites = callsites();
  const caller = sites[2]; // index 2 代表调用 log 的代码位置
  if (!caller) return "unknown";

  const file = caller.getFileName();
  const line = caller.getLineNumber();
  const column = caller.getColumnNumber();
  const shortPath = file?.split("/").slice(-2).join("/") || "unknown";

  return `${shortPath}:${line}:${column}`;
}

const logger = {
  info: (...msg: any[]) =>
    console.log(
      `${timezoned()} ${colors.green}[✓] `,
      ...msg,
      `${colors.cyan}(${getCallerLocation()})${colors.reset}`,
    ),
  warn: (...msg: any[]) =>
    console.log(
      `${timezoned()} ${colors.yellow}[⚠]  `,
      ...msg,
      `${colors.cyan}(${getCallerLocation()})${colors.reset} `,
    ),
  error: (...msg: any[]) =>
    console.log(
      `${timezoned()} ${colors.red}[✗] `,
      ...msg,
      ` ${colors.cyan}(${getCallerLocation()})${colors.reset}`,
    ),
  success: (...msg: any[]) =>
    console.log(
      `${timezoned()} ${colors.green}[✅] `,
      ...msg,
      ` ${colors.cyan}(${getCallerLocation()})${colors.reset}`,
    ),
  loading: (...msg: any[]) =>
    console.log(
      `${timezoned()} ${colors.cyan}[⟳]  `,
      ...msg,
      ` ${colors.cyan}(${getCallerLocation()})${colors.reset}`,
    ),
  step: (...msg: any[]) =>
    console.log(
      `${timezoned()} ${colors.white}[➤]  `,
      ...msg,
      ` ${colors.cyan}(${getCallerLocation()})${colors.reset}`,
    ),
};

export default logger;
