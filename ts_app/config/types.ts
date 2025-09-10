// types/config.ts

export interface SQLConfig {
  host: string;
  port: number;
  db: string;
  user: string;
  password: string;
  charset: string;
  max_idle_conns?: number;
  max_open_conns?: number;
  conn_max_lifetime?: number;
  is_plaintext?: boolean;
}

export interface AppConfig {
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
}

export interface WebConfig {
  port: number;
}

export interface OkxConfig {
  apikey: string;
  secretkey: string;
  passphrase: string;
  proxy: string;
}

export interface EmailConfig {
  host: string;
  user: string;
  password: string;
  domains: string[];
}

export interface FullConfig {
  mysql: SQLConfig;
  app?: AppConfig;
  web?: WebConfig;
  email?: EmailConfig;
}
