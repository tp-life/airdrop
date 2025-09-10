import { sql } from "drizzle-orm";
import { D3Account, D3Table } from "../schema/d3";
import { Base } from "./app";
import {
  executeSteps,
  getCookies,
  getLocalStorageItem,
  hs,
  wait,
} from "../utils/browser/page";
import {
  generateProfile,
  getRandomElement,
  parseEmailInfo,
  receiveCode,
  sleep,
} from "../utils/help";
import logger from "../infrastructure/logger";
import { Register } from "../register/decorators";
import { AxiosHeaders, RawAxiosRequestHeaders } from "axios";
import { signMessageWithPrivateKey } from "../utils/onchain/help";
import { EvmWallet } from "../utils/onchain/evm";
import { BASE_TEST_RPC } from "../config/rpc";
import { ABI_DIR } from "../config";
import path from "path";
import fs from "fs";
import { ethers } from "ethers";

const abiPath = path.join(ABI_DIR, "sepolia.json");

interface D3Resp<T> {
  data: T;
  errors?: {
    message: string;
    path: string[];
  }[];
}

@Register("d3")
export class D3 extends Base {
  public table = D3Table;
  private cookies = "";
  private url = "https://dashboard-testnet.doma.xyz/login";
  private reqHeaders: RawAxiosRequestHeaders | AxiosHeaders = {};
  private d3Header = {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "content-type": "application/json",
    origin: "https://testnet.d3.app",
    priority: "u=1, i",
    referer: "https://testnet.d3.app/",
    "sec-ch-ua":
      '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  };
  private d3API = "https://api-pre.d3.app/graphql";
  private user: { id: string; wallets: [{ id: string; address: string }] };
  // private contract = "0xb27ffc90C955A372307F99438a4F2d703b7c48b9";
  // private network = "11155111";
  // private rpc = SEPOLIA_RPC;
  private contract = "0x8760e527442464075506527eA81B52d825556A32";
  private network = "84532";
  private rpc = BASE_TEST_RPC;

  get headers() {
    if (this.param == "domain") return this.d3Header;
    return this.reqHeaders;
  }

  async run() {
    if (this.param == "domain") {
      await this.buyDomain();
      return;
    }

    if (this.param == "amt") {
      await this.updateAmt();
      return;
    }

    await this.doRerrferTask();
    await sleep(3_000);
  }

  async getRerrferCode(account: D3Account) {
    if (account.fromReferralCode) {
      return account.fromReferralCode;
    }

    const q = sql`referral_code is not null AND referral_total < 3 AND (referral_locked  < DATE_SUB(NOW(), INTERVAL 5 MINUTE) OR referral_locked IS NULL) AND amt > 0`;
    const rerrferAccount = await this.getAccount<D3Account>({
      where: q,
      raise: false,
      hasIP: false,
      lockKey: "referral_locked",
      // orderBy: sql`referral_total DESC`,
    });

    let code = "94hekizunxy5l";
    if (rerrferAccount) {
      code = rerrferAccount.referralCode;
    }

    account.fromReferralCode = code;
    await this.updateAccount(
      { fromReferralCode: code },
      sql`id = ${account.id}`,
    );

    return code;
  }

  async checkEmail(account: D3Account) {
    if (account.email) {
      return;
    }

    const { email, password } = await this.getEmail("d3", true);
    account.email = email;
    account.emailPass = password;
    await this.updateAccount(
      { email: email, emailPass: password },
      sql`id = ${account.id}`,
    );
  }

  async doRerrferTask() {
    let q = sql`is_registered = 0 AND (locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE))`;
    // q = sql`id=2391`
    const account = await this.getAccount<D3Account>({ where: q });
    const page = await this.newBrowser(this.url, [], `d3_${account.id}`);

    const inviteCode = await this.getRerrferCode(account);
    await this.checkEmail(account);

    const steps = [
      hs(
        "input",
        `input[placeholder="I have a referral code (Optional)"]`,
        800,
        inviteCode,
      ),
      hs("click", `//button[text()="Sign Up / Log In"]`),
      hs("input", `#email-input`, 1_000, account.email),
      hs("click", `//span[text()="Submit"]`, 1_000),
    ];

    await executeSteps(page, steps);
    await wait(page, `input[name="code-0"]`, 90_000);

    const emailConnctInfo = parseEmailInfo(account.email, account.emailPass);
    const emialOpts = {
      host: emailConnctInfo.host,
      user: emailConnctInfo.user,
      password: emailConnctInfo.pwd,
      // from: "no-reply@mail.privy.io",
      to: account.email,
      maxEmails: 1,
    };
    const code = await receiveCode(emialOpts, /\b(\d{6})\b/);
    if (!code) {
      throw new Error("Failed to receive code");
    }

    for (let i = 0; i < code.length; i++) {
      await page.locator(`input[name="code-${i}"]`).fill(code[i]);
      await sleep(100);
    }

    // 等待特定API响应
    const response = await page.waitForResponse(
      async (res) => {
        const isTargetAPI =
          res.url() ===
          "https://privy.doma.xyz/api/v1/passwordless/authenticate";
        if (!isTargetAPI) return false;

        // 获取响应状态码
        const status = res.status();

        return status === 200;
      },
      { timeout: 90_000 },
    );

    const loginData = await response.json();

    this.jwt = loginData["token"];

    const caid = await getLocalStorageItem(page, "privy:caid");
    const cookies = await getCookies(page.browser());
    this.cookies = cookies.strCookie;
    this.reqHeaders = {
      accept: "application/json",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
      authorization: `Bearer ${this.jwt}`,
      "content-type": "application/json",
      origin: "https://dashboard-testnet.doma.xyz",
      priority: "u=1, i",
      "privy-app-id": "cm9jd3vun03ptju0knmkls1zp",
      "privy-ca-id": caid.replaceAll('"', ""),
      "privy-client": "react-auth:2.16.0",
      referer: "https://dashboard-testnet.doma.xyz/",
      "sec-ch-ua":
        '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
      cookie: this.cookies,
    } as RawAxiosRequestHeaders;

    await sleep(3_000);
    const rs = await this.getProfile();
    if (rs && !rs.profileCompleted) {
      await this.updateProfile();
    }

    if (rs && rs.referralLink && !account.referralCode) {
      const urlObj = new URL(rs.referralLink);
      const params = new URLSearchParams(urlObj.search);
      const referralCode = params.get("referralCode");
      if (referralCode) {
        await this.updateAccount({ referralCode }, sql`id = ${account.id}`);
        await this.updateAccount(
          { referralTotal: sql`referral_total + 1` },
          sql`referral_code = ${account.fromReferralCode}`,
        );
      }
    }

    // 绑定钱包
    if (!(await this.linkWallet(account))) {
      return false;
    }

    await this.updateAccount({ isRegistered: 1 }, sql`id=${account.id}`);
    return !!this.jwt;
  }

  async updateProfile() {
    const url = "https://dashboard-testnet.doma.xyz/api/user/me";
    const domains = ["0-10", "11-100", "101-1000", "1001-500000"];
    const noeDomains = [
      "GoDaddy",
      "Namecheap",
      "Dynadot",
      "Porkbun",
      "Spaceship",
      "Encirca",
      "NameSilo",
      "Google Domains",
      "Cloudflare",
      "Network Solutions",
      "Other",
    ];
    const payload = {
      premiumDomainsCount: getRandomElement(domains),
      nonPremiumDomainsCount: getRandomElement(domains),
      registrars: [getRandomElement(noeDomains), getRandomElement(noeDomains)],
    };

    const res = await this.request<{ success: boolean }>("put", url, payload);
    if (!res || !res.success) {
      logger.error(`Failed to update profile: ${res}`);
      return false;
    }
    logger.info(`Profile updated successfully`);
    return true;
  }

  async getProfile() {
    const url = "https://dashboard-testnet.doma.xyz/api/user/me";
    const res = await this.request<{
      profileCompleted: boolean;
      referralLink: string;
    }>("get", url);
    return res;
  }

  async getNoce(account: D3Account): Promise<string> {
    const url = `https://privy.doma.xyz/api/v1/siwe/init`;
    const payload = { address: account.addr };
    const res = await this.request<{ error?: string; nonce?: string }>(
      "post",
      url,
      payload,
    );
    if (!res || res?.error) {
      logger.error(`Failed to get noce: ${res}`);
      return "";
    }
    logger.info(`Noce received successfully`);
    return res.nonce || "";
  }

  async linkWallet(account: D3Account) {
    const noce = await this.getNoce(account);
    if (!noce) return false;
    const url = `https://privy.doma.xyz/api/v1/siwe/link`;
    const date = new Date().toISOString();
    const msg = `dashboard-testnet.doma.xyz wants you to sign in with your Ethereum account:\n${account.addr}\n\nBy signing, you are proving you own this wallet and logging in. This does not initiate a transaction or cost any fees.\n\nURI: https://dashboard-testnet.doma.xyz\nVersion: 1\nChain ID: 1\nNonce: ${noce}\nIssued At: ${date}\nResources:\n- https://privy.io`;
    const sign = await signMessageWithPrivateKey(this.pk, msg);
    const payload = {
      message: msg,
      signature: sign,
      chainId: "eip155:1",
      walletClientType: "metamask",
      connectorType: "injected",
    };
    const res = await this.request<{
      linked_accounts: { type: string; address: string }[];
    }>("post", url, payload);
    if (!res) {
      logger.error(`Failed to link wallet: ${res}`);
      return false;
    }

    if (res?.linked_accounts?.length > 3) {
      return true;
    }

    console.log("当前链接账号有：", res);
    return false;
  }

  async buyDomain() {
    let q = sql`domain is null AND amt > 0 AND (locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE))`;
    // q = sql`id=15`;
    const account = await this.getAccount<D3Account>({ where: q });
    for (let c = 0; c < 5; c++) {
      const loginSuccess = await this.loginByWallet(account);

      if (!loginSuccess) {
        logger.error(`Failed to login with wallet`);
        return false;
      }

      let contact = await this.userContact(account);
      if (!contact.city) {
        logger.error(`用户联系信息不完整`);
        return;
      }

      const domainInfo = await this.searchDomain(account, c);

      let cartID = "";
      let orderItemID = "";

      for (let i = 0; i < 5; i++) {
        let cartInfo = await this.getCart();
        if (!cartInfo || !cartInfo.id || !cartInfo.items.length) {
          await this.addCart(domainInfo.sld);
          await sleep(2_000);
          continue;
        }
        cartID = cartInfo.id;
        orderItemID = cartInfo.items[0].id;
        break;
      }

      if (!cartID) {
        logger.error(`域名添加到购物车失败`);
        return false;
      }

      try {
        const buyInfo = await this.checkoutCart(account);

        const web3Data = JSON.parse(buyInfo.frontendToken);
        const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

        const voucher = {
          buyer: web3Data.voucher.buyer,
          token: web3Data.voucher.token,
          amount: ethers.toBigInt(web3Data.voucher.amount),
          voucherExpiration: web3Data.voucher.voucherExpiration,
          paymentId: web3Data.voucher.paymentId,
          orderId: web3Data.voucher.orderId,
        };

        const wallet = new EvmWallet(this.rpc, { privateKey: this.pk });
        const tx = await wallet.callWithAbi(
          this.contract,
          abi,
          "pay",
          [voucher, web3Data.signature],
          voucher.amount,
        );

        if (!tx) {
          logger.error(`支付失败`);
          return;
        }
        logger.info(
          `${account.id}-- ${account.addr}:支付成功,tx hash: ${tx.hash}`,
        );

        await this.updatePaymentStatus(Number(buyInfo.order.id));
        await this.emptyCart(Number(cartID));

        await this.updateAccount(
          { domain: `${domainInfo.sld}.${domainInfo.tld}` },
          sql`id = ${account.id}`,
        );
        return true;
      } catch (error) {
        if ((error.message as string).includes("checkoutCart")) {
          await sleep(5_000);
          await this.removeCart(Number(orderItemID), Number(cartID));
          continue;
        }
        logger.error(`支付失败:${error.message}`);
        break;
      }
    }
  }

  async removeCart(orderItemID: number, cartID: number) {
    let data = JSON.stringify({
      query: `mutation removeNameFromCart($orderItemId: Int!, $couponCode: String) {
      removeNameFromCart(orderItemId: $orderItemId, couponCode: $couponCode) {
        id
        brandingInfo {
          tld
          name
          styling {
            logo {
              url
            }
            primaryColor
            secondaryColor
            fontColor
            squareLogo {
              url
            }
          }
        }
        items {
          id
          amount
          sld
          status
          tld
          domainLength
          available
          unavailableReason
          createdAt
          walletId
          updatedAt
          registryPrice
          autoRenew
          pricing {
            primaryPricingInfo {
              adjustBy
              remainingYearsPrice
              description
              firstYearPrice
              couponId
              tier
              restorationFee
            }
            secondaryPricingInfo {
              price
            }
          }
          registry {
            renewGracePeriodDuration
            whoisProtection
            icannTld
            minRegistrationTermYears
            eoiPrimaryContract {
              address
              chain {
                id
                name
                networkId
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
          domain {
            tokenized
            tokenizationStatus
            expirationDate
            domainInternalStatus
            contract {
              address
              chain {
                id
                name
                networkId
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
          wallet {
            id
            address
            addressType
            type
            verificationStatus
          }
          product {
            type
            name
          }
        }
      }
    }`,
      variables: { orderItemId: orderItemID, cartId: cartID },
    });

    await this.baseRequest(data);
  }

  async updateAmt() {
    let q = sql` amt = 0 AND (locked_at is null OR locked_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE))`;
    const account = await this.getAccount<D3Account>({ where: q });

    const wallet = new EvmWallet(this.rpc, { privateKey: this.pk });
    const amt = await wallet.getBalance(account.addr);
    await this.updateAccount({ amt }, sql`id = ${account.id}`);
  }

  async paymentToken() {
    let data = JSON.stringify({
      query: `query PaymentTokenExchangeRate($networkId: String!, $address: String) {
      paymentTokenExchangeRate(networkId: $networkId, address: $address) {
        address
        price
        exchangeRate
        currency {
          decimals
          symbol
          name
        }
      }
    }`,
      variables: { networkId: this.network },
    });

    const res = await this.baseRequest<{
      paymentTokenExchangeRate: { exchangeRate: number; price: number };
    }>(data);
    return res.data.paymentTokenExchangeRate;
  }

  async loginByWallet(account: D3Account) {
    const signInfo = await this.getWalletSign(account);
    let data = JSON.stringify({
      query: `mutation loginWithWallet($walletAddress: String!, $type: String!, $addressType: AddressType!, $signature: String, $utmParams: UTMParamsInput, $eaSlug: String, $referrer: String) {
      loginWithWallet(
        signature: $signature
        walletAddress: $walletAddress
        type: $type
        addressType: $addressType
        utmParams: $utmParams
        eaSlug: $eaSlug
        referrer: $referrer
      ) {
        __typename
        ... on AuthCredentials {
          accessToken
          user {
            email
            displayName
            id
            createdAt
            twitterId
            discordId
            registerMethod
            roles {
              id
              name
            }
            registrant {
              name
              profileUrl
              verificationStatus
            }
            wallets {
              id
              address
              addressType
              type
              verificationStatus
            }
          }
          isRegister
          cartItemsReplaced
        }
        ... on MFAAuthChallenge {
          twoFactorAuth
          twoFactorAuthType
          token
        }
        ... on EmailRequiredAuthChallenge {
          emailRequired
          token
        }
        ... on WalletSignatureChallenge {
          isWalletSignatureRequired
        }
      }
    }`,
      variables: {
        signature: signInfo.sign,
        walletAddress: account.addr,
        type: "com.okex.wallet",
        addressType: "EVM",
        utmParams: {
          content: null,
          locale: "zh-CN",
          medium: null,
          campaign: null,
          source: null,
          term: null,
        },
      },
    });

    const res = await this.baseRequest<{
      loginWithWallet: {
        emailRequired?: boolean;
        token?: string;
        accessToken?: string;
        isRegister?: boolean;
        user?: { id: string; wallets: [{ id: string; address: string }] };
      };
    }>(data);

    if (!res?.data?.loginWithWallet) {
      throw new Error("钱包登录失败");
    }

    if (res.data.loginWithWallet.emailRequired) {
      const isSend = await this.sendAddUserEmailCode(
        account,
        res.data.loginWithWallet.token,
      );
      if (isSend) {
        return await this.verifyEmailAndLogin(
          account,
          res.data.loginWithWallet.token,
        );
      }
      return isSend;
    }

    this.jwt = res.data.loginWithWallet.accessToken;
    this.user = res.data.loginWithWallet.user;
    return true;
  }

  async getCfToken() {
    return await super.getCfToken(
      "https://testnet.d3.app",
      "0x4AAAAAAAKWTAXhyt1BdnM-",
    );
  }

  async verifyEmailAndLogin(account: D3Account, token: string) {
    const emailConnctInfo = parseEmailInfo(account.email, account.emailPass);
    const emialOpts = {
      host: emailConnctInfo.host,
      user: emailConnctInfo.user,
      password: emailConnctInfo.pwd,
      from: "support@d3.com",
      to: account.email,
      maxEmails: 1,
    };
    const code = await receiveCode(emialOpts, /\b(\d{6})\b/);
    if (!code) {
      throw new Error("Failed to receive code");
    }

    const turnstileToken = await this.getCfToken();
    if (!turnstileToken) {
      throw new Error("Failed to get turnstile token");
    }

    let data = JSON.stringify({
      query: `mutation verifyEmailAndLogin($code: String!, $email: String!, $turnstileToken: String, $loginToken: String, $eaSlug: String, $utmTags: UTMParamsInput) {
      verifyEmailAndLogin(
        code: $code
        email: $email
        turnstileToken: $turnstileToken
        loginToken: $loginToken
        eaSlug: $eaSlug
        utmTags: $utmTags
      ) {
        ... on AuthCredentials {
          isRegister
          cartItemsReplaced
          accessToken
          user {
            id
            createdAt
            displayName
            email
            twoFactorAuth
            twitterId
            discordId
            twoFactorAuthType
            registerMethod
            roles {
              id
              name
            }
            registrant {
              name
              profileUrl
              verificationStatus
            }
            wallets {
              id
              address
              addressType
              type
              verificationStatus
            }
          }
        }
        ... on MFAAuthChallenge {
          twoFactorAuth
          twoFactorAuthType
          token
        }
        ... on EmailVerificationTurnstileChallenge {
          turnstileVerificationRequired
        }
      }
    }`,
      variables: {
        code: code,
        email: account.email,
        turnstileToken: turnstileToken,
        loginToken: token,
        utmTags: {
          content: null,
          locale: "zh-CN",
          medium: null,
          campaign: null,
          source: null,
          term: null,
          timestamp: null,
        },
      },
    });

    const res = await this.baseRequest<{
      verifyEmailAndLogin: {
        accessToken: string;
        user?: { id: string; wallets: [{ id: string; address: string }] };
      };
    }>(data);
    if (!res?.data || !res?.data?.verifyEmailAndLogin?.accessToken) {
      throw new Error("邮箱验证失败");
    }
    this.jwt = res?.data?.verifyEmailAndLogin?.accessToken;
    this.user = res.data.verifyEmailAndLogin.user;
    return true;
  }

  async sendAddUserEmailCode(account: D3Account, token: string) {
    let data = JSON.stringify({
      query: `mutation addUserEmailAndSendVerificationCode($args: AddUserEmailAndSendVerificationCodeArgs!) {
      addUserEmailAndSendVerificationCode(addUserEmailAndSendVerificationCode: $args)
    }`,
      variables: {
        args: {
          loginToken: token,
          email: account.email,
        },
      },
    });

    const res = await this.baseRequest<{
      addUserEmailAndSendVerificationCode: boolean;
    }>(data);
    if (!res || !res?.data?.addUserEmailAndSendVerificationCode) {
      throw new Error("发送邮件验证码失败");
    }

    return res?.data?.addUserEmailAndSendVerificationCode;
  }

  async getWalletSign(account: D3Account) {
    let data = JSON.stringify({
      query: `mutation signatureChallenge($walletAddress: String!, $addressType: AddressType!, $isBrowserWallet: Boolean!, $isSIWE: Boolean!) {
      signatureChallenge(
        walletAddress: $walletAddress
        addressType: $addressType
        isBrowserWallet: $isBrowserWallet
        isSIWE: $isSIWE
      ) {
        message
        nonce
        receiverId
        callbackURL
      }
    }`,
      variables: {
        walletAddress: account.addr,
        addressType: "EVM",
        isBrowserWallet: false,
        isSIWE: false,
      },
    });

    const res = await this.baseRequest<{
      signatureChallenge: { message: string; nonce: string };
    }>(data);
    if (!res?.data?.signatureChallenge?.message) {
      throw new Error("获取签名信息失败");
    }

    const sign = await signMessageWithPrivateKey(
      this.pk,
      res.data.signatureChallenge.message,
    );
    return {
      sign,
      message: res.data.signatureChallenge.message,
      nonce: res.data.signatureChallenge.nonce,
    };
  }

  async sendLoginEmailCode(account: D3Account) {
    let data = JSON.stringify({
      query: `mutation loginWithEmailCode($email: String!, $utmParams: UTMParamsInput, $referrer: String) {
      loginWithEmailCode(email: $email, utmParams: $utmParams, referrer: $referrer) {
        emailVerification
        email
        userId
      }
    }`,
      variables: {
        email: account.addr,
        utmParams: {
          content: null,
          locale: "zh-CN",
          medium: null,
          campaign: null,
          source: null,
          term: null,
        },
      },
    });
    const resp = await this.baseRequest<{
      loginWithEmailCode: { emailVerification: boolean; userId: number };
    }>(data);
    if (!resp?.data?.loginWithEmailCode?.emailVerification) {
      throw new Error("发送登录验证码失败");
    }
    return resp.data.loginWithEmailCode?.userId;
  }

  async searchDomain(account: D3Account, index: number = 0) {
    const domain = account.addr.substring(0, 20 + index);
    let data = JSON.stringify({
      query: `query searchDomains($names: [NameDescriptorInput!]!, $page: Int, $size: Int, $sortByPrice: SortOrder, $sortByDate: SortOrder, $availableForOffer: Boolean, $listedForSale: Boolean, $new: Boolean, $maxChars: Int, $minChars: Int, $maxPrice: Float, $minPrice: Float, $premiumNames: Boolean, $type: MarketplaceFiltersTypeArg) {
      searchDomains(
        names: $names
        page: $page
        size: $size
        sortByPrice: $sortByPrice
        sortByDate: $sortByDate
        availableForOffer: $availableForOffer
        listedForSale: $listedForSale
        new: $new
        maxChars: $maxChars
        minChars: $minChars
        maxPrice: $maxPrice
        minPrice: $minPrice
        premiumNames: $premiumNames
        type: $type
      ) {
        currentPage
        hasNextPage
        hasPreviousPage
        pageSize
        totalCount
        totalPages
        brandingInfo {
          tld
          styling {
            fontColor
            primaryColor
            secondaryColor
            logo {
              url
            }
          }
        }
        items {
          available
          premium
          listing {
            fixedPrice
            minimumOfferPrice
            status
          }
          pricing {
            primaryPricingInfo {
              remainingYearsPrice
              firstYearPrice
              description
              adjustBy
              nativeCurrencyFinalPrice
            }
            secondaryPricingInfo {
              price
              usdPrice
              minOfferPrice
              usdMinOfferPrice
              currency {
                decimals
                symbol
                icon
                evmCompatible
                id
                name
              }
            }
          }
          chain {
            id
            addressType
            blockExplorerUrl
            name
            networkId
            currency {
              decimals
              symbol
              icon
              evmCompatible
              id
              name
            }
          }
          sld
          tld
          eoi
          tokenized
          saleType
          ownerName
          registrant {
            id
          }
          favoriteCount
          unavailableReason
          secondarySaleAvailable
          secondarySaleUnavailableReason
          tokenizationStatus
          nearAccountEscrowed
          nearAccountAvailable
          reservationExpiresAt
        }
      }
    }`,
      variables: {
        names: [
          { sld: domain, tld: "ai" },
          { sld: domain, tld: "ape" },
          {
            sld: domain,
            tld: "football",
          },
          { sld: domain, tld: "io" },
          { sld: domain, tld: "shib" },
        ],
        size: 48,
        partner: "general",
        new: true,
        listedForSale: true,
        availableForOffer: true,
        premiumNames: true,
        aiRecommendations: true,
        sortBy: "recentlyListed",
        sortByDate: "DESC",
      },
    });

    const res = await this.baseRequest<{
      searchDomains: {
        totalCount: number;
        items: [
          {
            available: boolean;
            sld: string;
            tld: string;
            pricing: {
              primaryPricingInfo: {
                firstYearPrice: number;
                remainingYearsPrice: number;
              };
            };
          },
        ];
      };
    }>(data);

    if (!res?.data || !res?.data?.searchDomains?.items.length) {
      throw new Error("搜索域名失败");
    }

    const selectDomain = res.data.searchDomains.items.sort(
      (a, b) =>
        a.pricing.primaryPricingInfo.firstYearPrice -
        b.pricing.primaryPricingInfo.firstYearPrice,
    )[0];

    return {
      sld: selectDomain.sld,
      tld: selectDomain.tld,
      price: selectDomain.pricing.primaryPricingInfo.firstYearPrice,
    };
  }

  async addCart(domain: string) {
    if (!this.user?.wallets?.length) {
      throw new Error("用户没有钱包");
    }
    const wallet = this.user.wallets[0];

    let data = JSON.stringify({
      query: `mutation addNameToCart($tld: Label!, $sld: Label!, $productType: ProductType, $domainLength: DomainTermLength, $transferAuthCode: String, $walletId: Int) {
      addNameToCart(
        tld: $tld
        sld: $sld
        productType: $productType
        domainLength: $domainLength
        transferAuthCode: $transferAuthCode
        walletId: $walletId
      ) {
        id
        items {
          id
          amount
          sld
          status
          tld
          domainLength
          available
          unavailableReason
          createdAt
          walletId
          updatedAt
          registryPrice
          autoRenew
          pricing {
            primaryPricingInfo {
              adjustBy
              remainingYearsPrice
              description
              firstYearPrice
              couponId
              tier
              restorationFee
            }
            secondaryPricingInfo {
              price
              currency {
                symbol
                decimals
              }
            }
          }
          registry {
            renewGracePeriodDuration
            whoisProtection
            icannTld
            minRegistrationTermYears
            eoiPrimaryContract {
              address
              chain {
                id
                name
                networkId
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
          domain {
            tokenized
            tokenizationStatus
            expirationDate
            domainInternalStatus
            contract {
              address
              chain {
                id
                name
                networkId
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
          wallet {
            id
            address
            addressType
            type
            verificationStatus
          }
          product {
            type
            name
          }
        }
      }
    }`,
      variables: {
        tld: "ai",
        sld: domain,
        walletId: Number(wallet.id),
        productType: "DOMAIN_PRIMARY_SALE",
      },
    });
    const res = await this.baseRequest<{
      addNameToCart: {
        id: string;
        items: { id: string; sld: string; tld: string; amount: number }[];
      };
    }>(data);
    if (!res || !res.data?.addNameToCart?.id) {
      throw new Error("Failed to add domain to cart");
    }
    return res.data.addNameToCart;
  }

  async userContact(account: D3Account) {
    let data = JSON.stringify({
      query: `query UserRegistrantDefaultContact {
      userRegistrantDefaultContact {
        id
        firstName
        lastName
        organization
        email
        phone
        phoneCountryCode
        fax
        faxCountryCode
        street
        city
        state
        postalCode
        countryCode
      }
    }`,
      variables: {},
    });

    let res = await this.baseRequest<{
      userRegistrantDefaultContact: {
        id: string;
        firstName: string;
        lastName: string;
        organization: string;
        email: string;
        phone: string;
        phoneCountryCode: string;
        fax: string;
        faxCountryCode: string;
        street: string;
        city: string;
        state: string;
        postalCode: string;
        countryCode: string;
      };
    }>(data);

    if (!res || !res.data?.userRegistrantDefaultContact) {
      throw new Error("Failed to fetch user contact");
    }

    if (!res.data.userRegistrantDefaultContact.city) {
      return await this.registerUserContact(account);
    }

    return res.data.userRegistrantDefaultContact;
  }

  async registerUserContact(account: D3Account) {
    const {
      firstName,
      lastName,
      phoneNumber,
      countryCode,
      state,
      zipCode,
      city,
      streetAddress,
    } = generateProfile();

    // const f = parsePhoneNumber(phoneNumber);
    const info = {
      firstName: firstName,
      lastName: lastName,
      email: account.email,
      street: streetAddress,
      city: city,
      state: state,
      postalCode: zipCode,
      countryCode: getRandomElement(["US", "CN", "JP", "DE", "FR"]),
      organization: "",
      phoneCountryCode: "+1",
      phone: phoneNumber.replace(/[\(\)-\s.]/g, ""),
    };
    let data = JSON.stringify({
      query: `mutation UpdateRegistrantContacts($adminContact: RegistrantContactInput, $technicalContact: RegistrantContactInput, $billingContact: RegistrantContactInput, $registrantContact: RegistrantContactInput) {
      updateRegistrantContacts(
        adminContact: $adminContact
        technicalContact: $technicalContact
        billingContact: $billingContact
        registrantContact: $registrantContact
      ) {
        id
      }
    }`,
      variables: {
        registrantContact: info,
      },
    });
    const res = await this.baseRequest<{
      updateRegistrantContacts: { id: string };
    }>(data);

    return info;
  }

  async checkoutCart(account: D3Account) {
    let data = JSON.stringify({
      query: `mutation checkoutCart($productTypes: [ProductType!], $couponCode: String, $expectedPrice: BigInt!, $options: PaymentOptionsInput, $utmTags: UTMParamsInput) {
      checkoutCart(
        productTypes: $productTypes
        couponCode: $couponCode
        expectedPrice: $expectedPrice
        options: $options
        utmTags: $utmTags
      ) {
        frontendToken
        zeroPayment
        order {
          id
          status
          total
          billingContact {
            email
          }
        }
      }
    }`,
      variables: {
        couponCode: "",
        expectedPrice: "520",
        productTypes: [
          "EOI_RENEWAL",
          "EOI_PRIMARY_SALE_TOKENIZED",
          "EOI_PRIMARY_SALE_ESCROW",
          "DOMAIN_PRIMARY_SALE",
          "DOMAIN_RENEWAL",
          "DOMAIN_TRANSFER",
        ],
        options: {
          providerType: "CRYPTO",
          contractId: this.network == "84532" ? 19 : 9,
          buyerAddress: account.addr,
          tokenAddress: null,
        },
        utmTags: {
          content: null,
          locale: "zh-CN",
          medium: null,
          campaign: null,
          source: null,
          term: null,
          timestamp: null,
        },
      },
    });

    const res = await this.baseRequest<{
      checkoutCart: { frontendToken: string; order: { id: string } };
    }>(data);
    if (
      !res ||
      !res?.data?.checkoutCart?.frontendToken ||
      !res?.data?.checkoutCart?.order?.id
    ) {
      throw new Error("Failed to create checkout cart");
    }
    return res.data.checkoutCart;
  }

  async updatePaymentStatus(orderID: number) {
    let data = JSON.stringify({
      query: `mutation updatePaymentStatus($orderId: Int!) {
      updatePaymentStatus(orderId: $orderId)
    }`,
      variables: { orderId: orderID },
    });

    const res = await this.baseRequest<{ updatePaymentStatus: boolean }>(data);
    if (!res || !res.data) {
      throw new Error("Failed to update payment status");
    }
    return res.data.updatePaymentStatus;
  }

  async getCart() {
    let data = JSON.stringify({
      query: `query getCart($couponCode: String) {
      getCart(couponCode: $couponCode) {
        id
        items {
          id
          amount
          sld
          status
          tld
          domainLength
          available
          unavailableReason
          createdAt
          autoRenew
          walletId
          updatedAt
          pricing {
            primaryPricingInfo {
              adjustBy
              remainingYearsPrice
              description
              firstYearPrice
              couponId
              tier
              restorationFee
            }
            secondaryPricingInfo {
              price
              currency {
                symbol
                decimals
              }
            }
          }
          registry {
            renewGracePeriodDuration
            whoisProtection
            icannTld
            minRegistrationTermYears
            eoiPrimaryContract {
              address
              chain {
                id
                name
                networkId
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
          domain {
            tokenized
            expirationDate
            tokenizationStatus
            domainInternalStatus
            contract {
              address
              chain {
                id
                name
                networkId
                currency {
                  symbol
                  decimals
                }
              }
            }
            registrant {
              name
            }
            registry {
              renewGracePeriodDuration
            }
          }
          registryPrice
          wallet {
            id
            address
            addressType
            type
            verificationStatus
          }
          product {
            type
            name
          }
        }
        brandingInfo {
          tld
          name
          styling {
            logo {
              url
            }
            primaryColor
            secondaryColor
            fontColor
            squareLogo {
              url
            }
          }
        }
      }
    }`,
      variables: {},
    });
    const res = await this.baseRequest<{
      getCart: {
        id: string;
        items: { id: string; sld: string; tld: string; amount: number }[];
      };
    }>(data);
    if (!res || !res.data) {
      throw new Error(JSON.stringify(res?.errors));
    }
    return res.data.getCart;
  }

  async emptyCart(cartID: number) {
    let data = JSON.stringify({
      query: `mutation emptyCart($removeUnavailable: Boolean!, $couponCode: String) {
      emptyCart(removeUnavailable: $removeUnavailable, couponCode: $couponCode) {
        id
        brandingInfo {
          tld
          name
          styling {
            logo {
              url
            }
            primaryColor
            secondaryColor
            fontColor
            squareLogo {
              url
            }
          }
        }
        items {
          id
          amount
          sld
          status
          tld
          domainLength
          available
          unavailableReason
          createdAt
          walletId
          updatedAt
          registryPrice
          autoRenew
          pricing {
            primaryPricingInfo {
              adjustBy
              remainingYearsPrice
              description
              firstYearPrice
              couponId
              tier
            }
            secondaryPricingInfo {
              price
              currency {
                symbol
                decimals
              }
            }
          }
          registry {
            eoiPrimaryContract {
              address
              chain {
                id
                name
                networkId
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
          domain {
            expirationDate
            tokenized
            tokenizationStatus
            domainInternalStatus
          }
          wallet {
            id
            address
            addressType
            type
            verificationStatus
          }
          product {
            type
            name
          }
        }
      }
    }`,
      variables: { cartId: cartID, removeUnavailable: true },
    });

    const res = await this.baseRequest<{
      emptyCart: {
        id: string;
        items: { id: string; sld: string; tld: string; amount: number }[];
      };
    }>(data, false);
    if (!res) {
      return false;
    }
    return true;
  }

  async getRegistrant() {
    let data = JSON.stringify({
      query: `query getRegistrant {
      getRegistrant {
        favorites {
          sld
          tld
        }
      }
    }`,
      variables: {},
    });

    const res = await this.baseRequest<{
      getRegistrant: {
        favorites: { sld: string; tld: string }[];
      };
    }>(data, false);

    if (!res || !res?.data?.getRegistrant?.favorites?.length) {
      return false;
    }
    return !!res?.data?.getRegistrant?.favorites?.length;
  }

  async baseRequest<T>(data: any, raise = true) {
    const res = await this.request<D3Resp<T>>("post", this.d3API, data);
    if (raise && (!res || !res.data)) {
      throw new Error(JSON.stringify(res?.errors));
    }
    return res;
  }
}
