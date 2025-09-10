import path from "path";
import { ConfigLoader } from "./config";

export const CFG_FILE = path.join(process.cwd(), "config.toml");

export const USER_DIR = path.join(process.cwd(), "_browser_user_data");

export const EXTENDS = path.join(process.cwd(), "common", "_extensions");

export const ABI_DIR = path.join(process.cwd(), "common", "abi");

export const RESOURCE_DIR = path.join(process.cwd(), "common", "resource");

export const ENV_RELEASE = "release";
export const ENV_TEST = "test";
export const ENV_DEV = "dev";

// 从文件加载
const config = ConfigLoader.fromFile(CFG_FILE).loadEnv();

export default config;
