// config/AppConfig.ts
import { AppConfig as IAppConfig } from "./types";

export class AppConfig implements IAppConfig {
  geet_api: string;
  ext_path: string;
  ip_url: string;
  thread_num: number;
  exe: string;
  debug: boolean;
  debug_proxy?: string;
  nope_keys: string[];
  yesCaptcha_keys: string[];
  twoCaptcha_keys: string[];
  cf_self: boolean;
  captcha_solver: string[];

  constructor(config: Partial<IAppConfig> = {}) {
    this.geet_api = config.geet_api || "";
    this.ext_path = config.ext_path || "_extensions";
    this.ip_url = config.ip_url || "";
    this.thread_num = config.thread_num || 1;
    this.exe = config.exe || "";
    this.debug = config.debug || false;
    this.debug_proxy = config.debug_proxy;
    this.nope_keys = config.nope_keys || [];
    this.yesCaptcha_keys = config.yesCaptcha_keys || [];
    this.twoCaptcha_keys = config.twoCaptcha_keys || [];
    this.captcha_solver = config.captcha_solver || [];
    this.cf_self = config.cf_self || false;
  }

  validate(): void {
    if (this.thread_num <= 0) {
      throw new Error("Thread number must be positive");
    }
  }
}
