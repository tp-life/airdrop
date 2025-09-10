export class NoTaskError extends Error {
  constructor(message = "No task available") {
    super(message);
    this.name = "NoTaskError";
  }
}

export class TimeoutError extends Error {
  constructor(message = "任务超时，自动关闭") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class BlockedError extends Error {
  constructor(messsage = "当前账号已被禁用") {
    super(messsage);
    this.name = "BlockedError";
  }
}

export class RetryError extends Error {
  constructor(messsage = "当前账号已被禁用") {
    super(messsage);
    this.name = "RetryError";
  }
}

export class DiscordError extends Error {
  constructor(messsage = "Discord 未知错误") {
    super(messsage);
    this.name = "DiscordError";
  }
}
export class DiscordAuthError extends DiscordError {
  constructor(messsage = "Discord 授权错误") {
    super(messsage);
    this.name = "DiscordAuthError";
  }
}

export class InsufficientBalance extends Error {
  constructor(messsage = "账户余额不足") {
    super(messsage);
    this.name = "InsufficientBalance";
  }
}
