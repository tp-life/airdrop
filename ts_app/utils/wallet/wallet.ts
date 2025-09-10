import { importWallet, walletDoSomething } from "./metamask";
import {
  importWallet as importKeplrWallet,
  doSomething as doSomethingByKeplr,
} from "./keplr";
import { walletDoSomethingFn, walletImportFn, walletType } from "./config";
import { doSomethingByPhantom, importPhantomByInit } from "./phantom";
import { importOKXByPrivateKey, doSomething } from "./okx";

export class Wallet {
  importFn: walletImportFn;
  doSomethingFn: walletDoSomethingFn;

  constructor(kind: walletType) {
    this.hanldeFn(kind);
  }

  hanldeFn(kind: walletType) {
    switch (kind) {
      case walletType.Metamask:
        this.importFn = importWallet;
        this.doSomethingFn = walletDoSomething;
        break;
      case walletType.Phontom:
        this.doSomethingFn = doSomethingByPhantom;
        this.importFn = importPhantomByInit;
        break;
      case walletType.Keplr:
        this.doSomethingFn = doSomethingByKeplr;
        this.importFn = importKeplrWallet;
        break;
      case walletType.Okx:
        this.doSomethingFn = doSomething;
        this.importFn = importOKXByPrivateKey;
        break;
      default:
        this.importFn = importWallet;
        this.doSomethingFn = walletDoSomething;
    }
  }
}
