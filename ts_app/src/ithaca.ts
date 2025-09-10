import { ITHACA_RPC } from "../config/rpc";
import { Register } from "../register/decorators";
import { EvmWallet } from "../utils/onchain/evm";
import { SuperBridge } from "../utils/onchain/super_bridge";
import { Base } from "./app";

@Register("ithaca")
export class Ithaca extends Base {
  private l2Contract = "0x4200000000000000000000000000000000000010";

  async run() {
    await this.l2eth(
      "0xAb80046E011c5A4103831226B8e17a2B92203238",
      "0x019d76811905fe496cdf813a3754d889ae9d890df5bc4aa2a7a65704da4cb4b8",
    );
  }

  async l2eth(addr: string, pk: string) {
    const br = new SuperBridge(this.l2Contract, addr, pk);
    const s = await br.b2bs("0.09", ITHACA_RPC);
    console.log(s);
  }

  async distributed() {
    await this.getAccount();
  }
}
