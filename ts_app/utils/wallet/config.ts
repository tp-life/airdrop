import { keplr, metamask, okx, phantom } from "../../config/ext";
import { Browser, Page } from "rebrowser-puppeteer-core";

export enum walletType {
  Metamask = 1,
  Phontom,
  Okx,
  Keplr,
}

export const extToType: Record<string, walletType> = {
  [metamask]: walletType.Metamask,
  [okx]: walletType.Okx,
  [phantom]: walletType.Phontom,
  [keplr]: walletType.Keplr,
};

export const getTypeByExt = (ext: string): walletType | null => {
  const k = extToType[ext];
  if (!k) return null;
  return k;
};

export type walletDoSomethingFn = (
  browser: Browser,
  idleTimes?: number,
  must?: boolean,
) => Promise<boolean>;

export type walletImportFn = (
  browser: Browser,
  privateKey: string,
) => Promise<boolean>;
