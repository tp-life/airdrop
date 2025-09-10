import { sql } from "drizzle-orm";
import { Register } from "../register/decorators";
import { Base } from "./app";
import { SuperBridge } from "../utils/onchain/super_bridge";
import { IncoAccount, IncoTable } from "../schema/inco";
import { ERC20_ABI, EvmWallet } from "../utils/onchain/evm";
import { BASE_TEST_RPC, SEPOLIA_RPC } from "../config/rpc";
import { MySqlTable, TableConfig } from "drizzle-orm/mysql-core";
import { ethers } from "ethers";
import { sleep } from "../utils/help";
import logger from "../infrastructure/logger";

@Register("inco")
export class Inco extends Base {
  public table: MySqlTable<TableConfig> = IncoTable;
  private bridgeContract = "0xfd0Bf71F60660E2f608ed56e1659C450eB113120";
  private usdcContract = "0xAF33ADd7918F685B2A82C1077bd8c07d220FFA04";
  private taskContract = "0xA449bc031fA0b815cA14fAFD0c5EdB75ccD9c80f";
  private distributorPK = "";

  async run() {
    if (this.param == "cross") {
      await this.crossSepolia();
      return;
    }

    if (this.param == "dis") {
      await this.DistributeSp();
      return;
    }

    if (this.param == "amt") {
      await this.queryAMT();
      return;
    }

    await this.work();
  }

  async work() {
    let q = sql`task_flag < 3 AND amount > 0 AND (next_time < NOW() OR next_time IS NULL)`;
    // q = sql`id = 1389`;
    const account = await this.getAccount<IncoAccount>({ where: q });
    await this.mintUSDC(account);
    await sleep(5_000);
    const amt = await this.shield(account);
    await sleep(5_000);
    await this.unShield(account, amt);
    await this.updateAccount(
      { next_time: sql`DATE_ADD(NOW(), INTERVAL 14 DAY)` },
      sql`id = ${account.id}`,
    );
  }

  async shield(account: IncoAccount) {
    await this.approveUSDC(account);
    await sleep(5_000);
    const wallet = new EvmWallet(BASE_TEST_RPC, { privateKey: this.pk });
    const rawIface = ["function wrap(uint256 tokenID_)"];
    const amt = "1000";
    const tx = await wallet.callWithAbi(this.taskContract, rawIface, "wrap", [
      ethers.parseEther(amt),
    ]);
    if (!tx.hash) {
      throw new Error("Failed to shield");
    }
    account.wrap = account.wrap + Number(amt);
    await this.updateAccount(
      { wrap: sql`wrap + ${amt}`, task_flag: 2 },
      sql`id = ${account.id}`,
    );
    return amt;
  }

  async unShield(account: IncoAccount, amt: string) {
    const wallet = new EvmWallet(BASE_TEST_RPC, { privateKey: this.pk });
    const rawIface = ["function unwrap(uint256 tokenID_)"];
    const _amt = Number(amt);
    const use_amt = _amt * 0.8;

    const tx = await wallet.callWithAbi(this.taskContract, rawIface, "unwrap", [
      ethers.parseEther(use_amt.toString()),
    ]);
    if (!tx.hash) {
      throw new Error("Failed to unShield");
    }
    account.un_wrap = account.un_wrap + use_amt;
    await this.updateAccount(
      { un_wrap: sql`un_wrap + ${use_amt}`, task_flag: 3 },
      sql`id = ${account.id}`,
    );
    return true;
  }

  async approveUSDC(account: IncoAccount) {
    const wallet = new EvmWallet(BASE_TEST_RPC, { privateKey: this.pk });
    const token = new ethers.Contract(
      this.usdcContract,
      ERC20_ABI,
      wallet.signer,
    );
    const allowance = await token.allowance(account.addr, this.taskContract);
    if (allowance < ethers.parseUnits("10", 6)) {
      await token.approve(this.taskContract, ethers.MaxUint256);
    }
  }

  async mintUSDC(account: IncoAccount) {
    if (account.task_flag > 0) return;
    const wallet = new EvmWallet(BASE_TEST_RPC, { privateKey: this.pk });
    const tx = await wallet.callWithAbi(this.usdcContract, ERC20_ABI, "mint", [
      account.addr,
      ethers.parseEther("3000"),
    ]);
    if (tx.hash)
      await this.updateAccount({ task_flag: 1 }, sql`id = ${account.id}`);
  }

  async crossSepolia() {
    let q = sql`amount = 0 AND cross_flag = 0`;
    // q = sql`id = 1919`;
    const account = await this.getAccount<IncoAccount>({ where: q });
    const eth = await this.updateAmt(account);
    if (!eth) {
      await this.updateAccount({ cross_flag: 1 }, sql`id = ${account.id}`);
      return;
    }

    const addr = account.addr;
    const pk = account.pk;
    const br = new SuperBridge(this.bridgeContract, addr, pk);
    const amt = Number(eth) / 2;
    const tx = await br.b2bs(amt.toString());
    if (tx) {
      await this.updateAccount(
        { cross_flag: 1, amount: amt },
        sql`id = ${account.id}`,
      );
    }
  }

  async updateAmt(account: IncoAccount) {
    const wallet = new EvmWallet(SEPOLIA_RPC, { privateKey: this.pk });
    const amt = await wallet.getBalance(account.addr);
    await this.updateAccount({ eth: amt }, sql`id = ${account.id}`);
    return amt;
  }

  async DistributeSp() {
    let q = sql`amount = 0 AND cross_flag = 0`;
    const account = await this.getAccount<IncoAccount>({ where: q });

    const addr = account.addr;
    const pk = this.distributorPK;
    const br = new SuperBridge(this.bridgeContract, addr, pk);
    const amt = 0.05;
    const tx = await br.b2bs(amt.toString());
    if (tx) {
      await this.updateAccount(
        { cross_flag: 1, amount: amt },
        sql`id = ${account.id}`,
      );
      return;
    }
    logger.error("DistributeSp failed: " + account.addr);
  }

  async queryAMT() {
    let q = sql`cross_flag = 1`;
    const account = await this.getAccount<IncoAccount>({ where: q });
    const wallet = new EvmWallet(BASE_TEST_RPC, { privateKey: this.pk });
    const amt = await wallet.getBalance(account.addr);
    await this.updateAccount(
      { amount: amt, cross_flag: 2 },
      sql`id = ${account.id}`,
    );

    if (amt >= (0.1).toString()) {
      q = sql`amount = 0 AND cross_flag = 0`;
      const _ac = await this.getAccount<IncoAccount>({
        where: q,
        hasIP: false,
      });

      const tx = await wallet.sendNative(_ac.addr, (0.05).toString());
      if (tx) {
        await this.updateAccount(
          { cross_flag: 1, amount: 0.05 },
          sql`id = ${_ac.id}`,
        );
        return;
      }
    }
    return amt;
  }
}
