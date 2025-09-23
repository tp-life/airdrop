import axios, {
  AxiosHeaderValue,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

import qs from "qs";
import { sleep, tokenHex } from "../help";
import { randomUUID } from "crypto";
import {
  IncorrectData,
  RateLimitError,
  TwitterAccountSuspended,
  TwitterError,
} from "../../types/error";
import {
  dm_params,
  follow_settings,
  follower_notification_settings,
  live_notification_params,
  Operation,
  OperationDef,
  recommendations_params,
} from "./constants";
import { HttpsProxyAgent } from "https-proxy-agent";

interface BindAccountV1Result {
  url: string;
  oauth_token: string;
  oauth_verifier: string;
}

interface BindParamsV2 {
  code_challenge: string;
  client_id: string;
  redirect_uri: string;
  state: string;
  code_challenge_method?: string;
  response_type?: string;
  scope?: string;
}

// 定义类型
interface MediaEntity {
  media_id: number | string;
  tagged_users?: string[];
}

interface ReplyParams {
  conversation_control?: any;
  reply?: any;
}

interface QuoteParams {
  attachment_url?: string;
}

interface PollParams {
  poll?: any;
}

interface TweetOptions {
  reply_params?: ReplyParams;
  quote_params?: QuoteParams;
  poll_params?: PollParams;
  draft?: boolean;
  schedule?: Date | string | number;
}

// 定义用户数据类型
interface UserData {
  id: string;
  name: string;
  screen_name: string;
  profile_image_url: string;
  favourites_count: number;
  followers_count: number;
  friends_count: number;
  location: string;
  description: string;
  created_at: string;
}

interface UsersResponse {
  users: UserData[];
}

// 定义回复数据类型
interface ReplyData {
  reply_text: string;
  user_data: UserData;
}

interface RepliesResponse {
  replies: ReplyData[];
}

function raiseForStatus(response: AxiosResponse) {
  if (response.status < 200 || response.status >= 300) {
    throw new TwitterError({ error_message: `HTTP ${response.status}` });
  }
}

function getHeaders(
  cookies: Record<string, string> = {},
): Record<string, AxiosHeaderValue> {
  return {
    authorization:
      "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
    referer: "https://twitter.com/",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
    "x-csrf-token": cookies["ct0"] ?? "",
    "x-guest-token": cookies["guest_token"] ?? "",
    "x-twitter-auth-type": cookies["auth_token"] ? "OAuth2Session" : "",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
    cookie: Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
  };
}

export class TwitterAccount {
  private session: AxiosInstance;
  private cookies: Record<string, string> = {};
  private gqlApi = "https://twitter.com/i/api/graphql";
  private v1Api = "https://api.twitter.com/1.1";
  private v2Api = "https://twitter.com/i/api/2";

  private constructor(
    auth_token?: string,
    proxy?: string,
    cookies?: Record<string, string>,
  ) {
    const axiosConfig: AxiosRequestConfig = {
      timeout: 30000,
      headers: getHeaders(cookies),
    };
    if (proxy) {
      axiosConfig.proxy = false;
      axiosConfig.baseURL = "";
      axiosConfig.headers = getHeaders(cookies);
      axiosConfig["httpsAgent"] = new HttpsProxyAgent(proxy);
    }
    this.session = axios.create(axiosConfig);
    this.cookies = cookies || {};
    if (!auth_token && !cookies) {
      if (cookies && !cookies["auth_token"]) {
        throw new TwitterError({
          error_message:
            "Missing required parameters. You must provide auth_token in cookies.",
        });
      }

      throw new TwitterError({
        error_message:
          "Missing required parameters. You must provide either auth_token or cookies.",
      });
    }
  }

  static async run(
    auth_token?: string,
    cookies?: Record<string, string>,
    proxy?: string,
  ) {
    if (!cookies) {
      cookies = {};
    }
    if (auth_token) {
      cookies["auth_token"] = auth_token;
    }
    const account = new TwitterAccount(auth_token, proxy, cookies);
    const c = cookies as Object;
    if (c.hasOwnProperty("ct0") && c.hasOwnProperty("auth_token")) {
      return account;
    }

    await account.__setup_session();
    return account;
  }

  public get authToken(): string {
    return this.cookies["auth_token"] || "";
  }

  public get ct0(): string {
    return this.cookies["ct0"] || "";
  }

  public updateCookies(cookies: Record<string, string>) {
    this.cookies = { ...this.cookies, ...cookies };
    this.session.defaults.headers.common = {
      ...getHeaders(this.cookies),
    };
  }

  /**
   * 请求访客令牌
   */
  async requestGuestToken(csrfToken?: string): Promise<string> {
    const ct0Cookie = this.ct0;
    const effectiveCsrfToken = csrfToken || ct0Cookie;

    if (!effectiveCsrfToken) {
      throw new TwitterError({
        error_message:
          "Failed to get guest token. Make sure you are using correct cookies.",
      });
    }

    const headers = {
      ...getHeaders(this.cookies),
      "content-type": "application/x-www-form-urlencoded",
      authorization:
        "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
      "x-csrf-token": effectiveCsrfToken,
    };

    try {
      const response = await this.session.post(
        `${this.v1Api}/guest/activate.json`,
        null, // 没有请求体
        {
          headers,
          maxRedirects: 5, // 相当于 allow_redirects: true
          validateStatus: (status) => status < 500, // 允许 2xx 和 3xx 状态码
        },
      );

      const data = this.verifyResponse(response);

      if (!data.guest_token) {
        throw new TwitterError({
          error_message: "Guest token not found in response",
        });
      }

      return data.guest_token;
    } catch (error) {
      if (error instanceof TwitterError) {
        throw error;
      }

      throw new TwitterError({
        error_message: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 验证凭据
   */
  async verifyCredentials(): Promise<Record<string, any>> {
    try {
      const response = await this.session.get(
        `${this.v1Api}/account/verify_credentials.json`,
        {
          maxRedirects: 5, // 相当于 allow_redirects: true
          validateStatus: (status) => status < 500, // 允许 2xx 和 3xx 状态码
        },
      );

      return this.verifyResponse(response);
    } catch (error) {
      if (error instanceof TwitterError) {
        throw error;
      }

      throw new TwitterError({
        error_message: `Verify credentials failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  public async bindAccountV1(url: string): Promise<BindAccountV1Result> {
    const getOauthToken = async (): Promise<string> => {
      const response = await this.session.get(url, { maxRedirects: 5 });
      raiseForStatus(response);

      const match = response.data.match(
        /<input id="oauth_token" name="oauth_token" type="hidden" value="([^"]+)"/,
      );
      if (match) return match[1];

      const tokenSplit = response.data.split("oauth_token=");
      if (tokenSplit.length > 1) return tokenSplit[1];

      throw new TwitterError({
        error_message:
          "Failed to get oauth token. Make sure you are using correct URL.",
      });
    };

    const getAuthenticityToken = async (
      oauthToken: string,
    ): Promise<string | BindAccountV1Result> => {
      const params = { oauth_token: oauthToken };
      const response = await this.session.get(
        "https://api.twitter.com/oauth/authenticate",
        { params },
      );
      raiseForStatus(response);

      let match = response.data.match(
        /<input name="authenticity_token" type="hidden" value="([^"]+)"/,
      );
      if (match) return match[1];

      match = response.data.match(/<a class="maintain-context" href="([^"]+)/);
      if (match) {
        const bondUrl = match[1].replace(/&amp;/g, "&");
        const [token, verifier] = bondUrl
          .split("oauth_token=")[1]
          .split("&oauth_verifier=");
        return {
          url: bondUrl,
          oauth_token: token,
          oauth_verifier: verifier,
        };
      }

      throw new TwitterError({
        error_message:
          "Failed to get authenticity token. Make sure you are using correct cookies or url.",
      });
    };

    const getConfirmUrl = async (
      oauthToken: string,
      authenticityToken: string,
    ): Promise<string> => {
      const data = {
        authenticity_token: authenticityToken,
        redirect_after_login: `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`,
        oauth_token: oauthToken,
      };

      const response = await this.session.post(
        "https://api.twitter.com/oauth/authorize",
        qs.stringify(data),
      );
      raiseForStatus(response);

      const match = response.data.match(
        /<a class="maintain-context" href="([^"]+)/,
      );
      if (match) return match[1].replace(/&amp;/g, "&");

      throw new TwitterError({
        error_message:
          "Failed to get confirm url. Make sure you are using correct cookies or url.",
      });
    };

    const processConfirmUrl = async (
      url: string,
    ): Promise<BindAccountV1Result> => {
      const response = await this.session.get(url, { maxRedirects: 5 });
      raiseForStatus(response);

      if (response.request.res.responseUrl.includes("status=error")) {
        throw new TwitterError({
          error_message:
            "Failed to bind account. Make sure you are using correct cookies or url.",
        });
      }

      const [oauthToken, oauthVerifier] = response.request.res.responseUrl
        .split("oauth_token=")[1]
        .split("&oauth_verifier=");

      return {
        url: response.request.res.responseUrl,
        oauth_token: oauthToken,
        oauth_verifier: oauthVerifier,
      };
    };

    const oauthToken = await getOauthToken();
    const authenticityToken = await getAuthenticityToken(oauthToken);

    if (typeof authenticityToken !== "string") {
      return authenticityToken;
    }

    const confirmUrl = await getConfirmUrl(oauthToken, authenticityToken);
    return processConfirmUrl(confirmUrl);
  }

  // bind_params = {
  //   code_challenge: "test_project",
  //   code_challenge_method: "plain",
  //   client_id: "infoUjhndkd45fgld29aTW96eGM6MTpjaQ",
  //   redirect_uri: "https://www.test.com/test_project",
  //   response_type: "code",
  //   scope: "tweet.read users.read follows.read offline.access",
  //   state: "test_project",
  // };
  public async bindAccountV2(bindParams: BindParamsV2): Promise<string> {
    const REQUIRED_PARAMS = [
      "code_challenge",
      "client_id",
      "redirect_uri",
      "state",
    ];
    for (const p of REQUIRED_PARAMS) {
      if (!(p in bindParams)) {
        throw new IncorrectData({
          error_message:
            "Missing required parameters. Make sure you are using correct parameters.",
        });
      }
    }

    bindParams.code_challenge_method ||= "plain";
    bindParams.response_type ||= "code";
    bindParams.scope ||= "tweet.read users.read follows.read offline.access";

    const getAuthCode = async (): Promise<string> => {
      const response = await this.session.get(
        `${this.v2Api}/oauth2/authorize`,
        { params: bindParams },
      );
      raiseForStatus(response);

      this.session.defaults.headers["x-csrf-token"] = this.cookies["ct0"] || "";
      return response.data.auth_code;
    };

    const approveAuthCode = async (_authCode: string): Promise<string> => {
      const params = { approval: "true", code: _authCode };
      const response = await this.session.post(
        `${this.v2Api}/oauth2/authorize`,
        null,
        { params },
      );
      raiseForStatus(response);

      return response.data.redirect_uri.split("code=")[1];
    };

    const authCode = await getAuthCode();
    return approveAuthCode(authCode);
  }

  verifyResponse(r: AxiosResponse): Record<string, any> {
    try {
      const rateLimitRemaining = r.headers["x-rate-limit-remaining"];
      if (rateLimitRemaining && [0, 1].includes(parseInt(rateLimitRemaining))) {
        const resetTs = parseInt(r.headers["x-rate-limit-reset"]);
        const currentTs = Math.floor(Date.now() / 1000);
        throw new RateLimitError(
          `Rate limit reached. Reset in ${resetTs - currentTs} seconds.`,
        );
      }

      const data = r.data;

      if ("errors" in data) {
        const errors = data.errors;
        const errorMessage =
          errors && errors.length > 0 ? errors[0].message : errors;
        const errorCode =
          errors && errors.length > 0 ? errors[0].code : undefined;

        if (
          typeof errorMessage === "string" &&
          errorMessage
            .toLowerCase()
            .startsWith("to protect our users from spam and other")
        ) {
          throw new TwitterAccountSuspended(errorMessage);
        }

        throw new TwitterError({
          error_code: errorCode,
          error_message: errorMessage,
        });
      }

      return data;
    } catch (err: any) {
      // axios 在状态码错误时会抛出异常
      if (err.isAxiosError || err.response) {
        throw new TwitterError({
          error_message: String(err.message || err),
        });
      }

      throw new TwitterError({
        error_message: `Failed to parse response: ${r.data}. If you are using proxy, make sure it is not blocked by Twitter.`,
      });
    }
  }

  private async requestCt0(): Promise<string> {
    const url = "https://twitter.com/i/api/2/oauth2/authorize";

    try {
      const response = await this.session.get(url, {
        maxRedirects: 5, // 相当于 allow_redirects: true
        validateStatus: (status) => status < 500,
      });

      // 检查响应中的 cookies
      const cookiesHeader = response.headers["set-cookie"];
      if (cookiesHeader) {
        const cookies = Array.isArray(cookiesHeader)
          ? cookiesHeader
          : [cookiesHeader];
        const ct0Cookie = cookies.find((cookie) => cookie.includes("ct0="));

        if (ct0Cookie) {
          // 从 cookie 字符串中提取 ct0 值
          const ct0Match = ct0Cookie.match(/ct0=([^;]+)/);
          if (ct0Match && ct0Match[1]) {
            return ct0Match[1];
          }
        }
      }

      // 如果头部没有找到，检查响应配置中的 cookies（如果使用了 withCredentials）
      if (response.config.withCredentials) {
        // 在浏览器环境中，cookies 会自动处理，需要从 document.cookie 读取
        if (typeof document !== "undefined") {
          const ct0Match = document.cookie.match(/ct0=([^;]+)/);
          if (ct0Match && ct0Match[1]) {
            return ct0Match[1];
          }
        }
      }

      throw new TwitterError({
        error_message:
          "Failed to get ct0 token. Make sure you are using correct cookies.",
      });
    } catch (error) {
      if (error instanceof TwitterError) {
        throw error;
      }

      throw new TwitterError({
        error_message: `Failed to request ct0 token: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 设置会话
   */
  async __setup_session(): Promise<void> {
    // 生成 CSRF token 和获取 guest token
    const generated_csrf_token = tokenHex();
    const guest_token = await this.requestGuestToken(generated_csrf_token);

    // 设置 cookies 和 headers
    const cookies = { ct0: generated_csrf_token, gt: guest_token };
    const headers = {
      "x-guest-token": guest_token,
      "x-csrf-token": generated_csrf_token,
    };

    // 更新内部会话的 headers 和 cookies
    this.session.defaults.headers.common = {
      ...this.session.defaults.headers.common,
      ...headers,
    };

    // 设置 cookies (需要根据实际的 cookie 处理方式实现)
    // 在浏览器环境中可以使用 document.cookie
    // 在 Node.js 环境中可以使用 cookie jar
    Object.entries(cookies).forEach(([key, value]) => {
      document.cookie = `${key}=${value}; path=/; domain=.twitter.com`;
    });

    // 请求 ct0 token 并更新
    const csrf_token = await this.requestCt0();

    this.session.defaults.headers.common["x-csrf-token"] = csrf_token;

    // 删除旧的 ct0 cookie 并设置新的
    document.cookie =
      "ct0=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.twitter.com";
    document.cookie = `ct0=${csrf_token}; path=/; domain=.twitter.com`;
    this.cookies = {
      ...this.cookies,
      ct0: csrf_token,
      guest_token,
    };
    // 更新 headers
    this.session.defaults.headers.common = {
      ...this.session.defaults.headers.common,
      ...getHeaders(this.cookies),
    };

    // 验证凭据
    await this.verifyCredentials();
  }

  /**
   * 获取邮箱和手机信息
   */
  async emailPhoneInfo(): Promise<Record<string, any>> {
    try {
      const response = await this.session.get(
        `${this.v1Api}/users/email_phone_info.json`,
        {
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        },
      );
      return this.verifyResponse(response);
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get email/phone info: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取账户设置信息
   */
  async settingsInfo(): Promise<Record<string, any>> {
    try {
      const response = await this.session.get(
        `${this.v1Api}/account/settings.json`,
        {
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        },
      );
      return this.verifyResponse(response);
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get settings info: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取用户屏幕名称
   */
  async screenName(): Promise<string> {
    try {
      const data = await this.verifyCredentials();
      return data.screen_name;
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get screen name: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取用户ID
   */
  async userId(): Promise<number> {
    try {
      const data = await this.verifyCredentials();
      return data.id;
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get user ID: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取用户名称
   */
  async name(): Promise<string> {
    try {
      const data = await this.verifyCredentials();
      return data.name;
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get name: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取用户位置
   */
  async location(): Promise<string> {
    try {
      const data = await this.verifyCredentials();
      return data.location || "";
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get location: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取用户描述
   */
  async description(): Promise<string> {
    try {
      const data = await this.verifyCredentials();
      return data.description || "";
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get description: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取粉丝数量
   */
  async followersCount(): Promise<number> {
    try {
      const data = await this.verifyCredentials();
      return data.followers_count;
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get followers count: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取关注数量
   */
  async friendsCount(): Promise<number> {
    try {
      const data = await this.verifyCredentials();
      return data.friends_count;
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get friends count: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取注册日期
   */
  async registrationDate(): Promise<string> {
    try {
      const data = await this.verifyCredentials();
      return data.created_at;
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get registration date: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 检查账户是否被暂停
   */
  async suspended(): Promise<boolean> {
    try {
      const data = await this.verifyCredentials();
      return data.suspended || false;
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to check suspension status: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * GraphQL API 请求
   */
  async gql(
    method: "GET" | "POST",
    ops: OperationDef,
    variables: Record<string, any>,
    features: any = Operation.default_features,
  ): Promise<Record<string, any>> {
    const { hash: qid, operation: op } = ops;

    const _params: Record<string, any> = {
      queryId: qid,
      features: features,
      variables: { ...Operation.default_variables, ...variables },
    };

    let requestConfig: any = {
      method: method,
      url: `${this.gqlApi}/${qid}/${op}`,
      headers: getHeaders(this.cookies),
      maxRedirects: 5,
      validateStatus: (status: number) => status < 500,
    };

    if (method === "POST") {
      requestConfig.data = _params;
      requestConfig.headers["content-type"] = "application/json";
    } else {
      // 对于 GET 请求，将参数序列化为 JSON 字符串
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(_params)) {
        params[key] = JSON.stringify(value);
      }
      requestConfig.params = params;
    }

    try {
      const response = await this.session.request(requestConfig);
      return this.verifyResponse(response);
    } catch (error) {
      throw new TwitterError({
        error_message: `GQL request failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * v1 API 请求
   */
  async v1(
    path: string,
    params: Record<string, any>,
  ): Promise<Record<string, any>> {
    const headers = getHeaders(this.cookies);
    headers["content-type"] = "application/x-www-form-urlencoded";

    // 将参数转换为 URL encoded form data
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      formData.append(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    }

    try {
      const response = await this.session.post(
        `${this.v1Api}/${path}`,
        formData.toString(),
        {
          headers,
          maxRedirects: 5,
          validateStatus: (status: number) => status < 500,
        },
      );
      return this.verifyResponse(response);
    } catch (error) {
      throw new TwitterError({
        error_message: `v1 API request failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 发送直接消息（DM）
   */
  async dm(
    sessionInstance: AxiosInstance,
    text: string,
    receivers: number[],
    // media: string = "",
  ): Promise<Record<string, any>> {
    const requestId = randomUUID();

    const variables: Record<string, any> = {
      message: {},
      requestId: requestId,
      target: { participant_ids: receivers },
    };

    variables.message.text = { text: text };

    try {
      const res = await this.gql(
        "POST",
        Operation.useSendMessageMutation,
        variables,
      );

      // 检查发送失败的情况
      if (this.findKey(res, "dm_validation_failure_type")) {
        throw new TwitterError({
          error_message:
            "Failed to send message. Sender does not have privilege to dm receiver(s)",
          error_code: 349,
        });
      }

      return res;
    } catch (error) {
      if (error instanceof TwitterError) {
        throw error;
      }
      throw new TwitterError({
        error_message: `Failed to send DM: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 自定义发送直接消息（使用 v1 API）
   */
  async custom_dm(
    sessionInstance: AxiosInstance,
    text: string,
    receiver: number,
  ): Promise<Record<string, any>> {
    const json_data = {
      event: {
        type: "message_create",
        message_create: {
          target: { recipient_id: `${receiver}` },
          message_data: { text: `${text}` },
        },
      },
    };

    try {
      const response = await sessionInstance.post(
        `${this.v1Api}/direct_messages/events/new.json`,
        json_data,
        {
          headers: getHeaders(this.cookies),
          validateStatus: (status: number) => status < 500,
        },
      );

      return this.verifyResponse(response);
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to send custom DM: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 在对象中查找键（递归）
   */
  private findKey(obj: any, key: string): any {
    if (obj && typeof obj === "object") {
      if (key in obj) {
        return obj[key];
      }

      for (const k of Object.keys(obj)) {
        const result = this.findKey(obj[k], key);
        if (result !== undefined) {
          return result;
        }
      }
    }
    return undefined;
  }

  /**
   * 删除推文
   */
  async delete_tweet(tweet_id: number | string): Promise<Record<string, any>> {
    const variables = {
      tweet_id: tweet_id,
      dark_request: false,
    };

    return this.gql("POST", Operation.DeleteTweet, variables);
  }

  /**
   * 发送推文
   */
  async tweet(
    text: string,
    media: MediaEntity[] = [],
    options: TweetOptions = {},
  ): Promise<Record<string, any>> {
    let variables: Record<string, any>;

    const { reply_params, quote_params, poll_params, draft, schedule } =
      options;

    if (draft || schedule) {
      // 草稿或定时推文
      variables = {
        post_tweet_request: {
          auto_populate_reply_metadata: false,
          status: text,
          exclude_reply_user_ids: [],
          media_ids: [],
        },
      };

      if (media && media.length > 0) {
        for (const m of media) {
          variables["post_tweet_request"]["media_ids"].push(m.media_id);
        }
      }

      if (schedule) {
        let execute_at: number;

        if (typeof schedule === "string") {
          // 解析字符串日期
          execute_at = Math.floor(new Date(schedule).getTime() / 1000);
        } else if (schedule instanceof Date) {
          execute_at = Math.floor(schedule.getTime() / 1000);
        } else {
          execute_at = schedule;
        }

        variables["execute_at"] = execute_at;
        return this.gql("POST", Operation.CreateScheduledTweet, variables);
      }

      return this.gql("POST", Operation.CreateDraftTweet, variables);
    }

    // 常规推文
    variables = {
      tweet_text: text,
      dark_request: false,
      media: {
        media_entities: [],
        possibly_sensitive: false,
      },
      semantic_annotation_ids: [],
    };

    // 合并可选参数
    if (reply_params) {
      variables = { ...variables, ...reply_params };
    }
    if (quote_params) {
      variables = { ...variables, ...quote_params };
    }
    if (poll_params) {
      variables = { ...variables, ...poll_params };
    }

    // 处理媒体
    if (media && media.length > 0) {
      for (const m of media) {
        const tagged_users_id: number[] = [];

        if (m.tagged_users && m.tagged_users.length > 0) {
          for (const tagged_user of m.tagged_users) {
            try {
              const user_id = await this.get_user_id(tagged_user);
              tagged_users_id.push(user_id);
            } catch (error) {
              console.warn(
                `Failed to get user ID for ${tagged_user}:`,
                error.message,
              );
            }
          }
        }

        variables["media"]["media_entities"].push({
          media_id: m.media_id,
          tagged_users: tagged_users_id,
        });
      }
    }

    return this.gql("POST", Operation.CreateTweet, variables);
  }

  /**
   * 根据用户名获取用户ID
   */
  async get_user_id(username: string): Promise<number> {
    const headers = getHeaders(this.cookies);
    headers["content-type"] = "application/x-www-form-urlencoded";

    try {
      const response = await this.session.get(`${this.v1Api}/users/show.json`, {
        headers,
        params: { screen_name: username },
        validateStatus: (status: number) => status < 500,
      });

      const json_data = this.verifyResponse(response);

      if (!json_data.id) {
        throw new TwitterError({
          error_message: `User ID not found for username: ${username}`,
        });
      }

      return json_data.id;
    } catch (error) {
      if (error instanceof TwitterError) {
        throw error;
      }

      throw new TwitterError({
        error_message: `Failed to get user ID for ${username}: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 创建定时推文
   */
  async schedule_tweet(
    text: string,
    date: number | string,
    media: MediaEntity[] = [],
  ): Promise<Record<string, any>> {
    let execute_at: number;

    if (typeof date === "string") {
      // 解析字符串日期
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new TwitterError({
          error_message: `Invalid date format: ${date}. Use "YYYY-MM-DD HH:MM" format`,
        });
      }
      execute_at = Math.floor(dateObj.getTime() / 1000);
    } else {
      execute_at = date;
    }

    const variables: Record<string, any> = {
      post_tweet_request: {
        auto_populate_reply_metadata: false,
        status: text,
        exclude_reply_user_ids: [],
        media_ids: [],
      },
      execute_at: execute_at,
    };

    // 处理媒体
    if (media && media.length > 0) {
      for (const m of media) {
        const tagged_users_id: number[] = [];

        if (m.tagged_users && m.tagged_users.length > 0) {
          for (const tagged_user of m.tagged_users) {
            try {
              const user_id = await this.get_user_id(tagged_user);
              tagged_users_id.push(user_id);
            } catch (error) {
              console.warn(
                `Failed to get user ID for ${tagged_user}:`,
                error.message,
              );
            }
          }
        }

        variables["post_tweet_request"]["media_ids"].push(m.media_id);

        // 如果需要 tagged_users，可能需要添加到其他字段
        if (tagged_users_id.length > 0) {
          if (!variables["post_tweet_request"]["media_entities"]) {
            variables["post_tweet_request"]["media_entities"] = [];
          }
          variables["post_tweet_request"]["media_entities"].push({
            media_id: m.media_id,
            tagged_users: tagged_users_id,
          });
        }
      }
    }

    return this.gql("POST", Operation.CreateScheduledTweet, variables);
  }

  /**
   * 创建定时回复推文
   */
  async schedule_reply(
    text: string,
    date: number | string,
    tweet_id: number | string,
    media: MediaEntity[] = [],
  ): Promise<Record<string, any>> {
    let execute_at: number;

    if (typeof date === "string") {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new TwitterError({
          error_message: `Invalid date format: ${date}. Use "YYYY-MM-DD HH:MM" format`,
        });
      }
      execute_at = Math.floor(dateObj.getTime() / 1000);
    } else {
      execute_at = date;
    }

    const variables: Record<string, any> = {
      post_tweet_request: {
        auto_populate_reply_metadata: true,
        in_reply_to_status_id: tweet_id.toString(),
        status: text,
        exclude_reply_user_ids: [],
        media_ids: [],
      },
      execute_at: execute_at,
    };

    // 处理媒体
    if (media && media.length > 0) {
      for (const m of media) {
        variables["post_tweet_request"]["media_ids"].push(m.media_id);
      }
    }

    return this.gql("POST", Operation.CreateScheduledTweet, variables);
  }

  /**
   * 取消定时推文
   */
  async unschedule_tweet(
    tweet_id: number | string,
  ): Promise<Record<string, any>> {
    const variables = {
      scheduled_tweet_id: tweet_id.toString(),
    };

    return this.gql("POST", Operation.DeleteScheduledTweet, variables);
  }

  /**
   * 删除推文（untweet 别名）
   */
  async untweet(tweet_id: number | string): Promise<Record<string, any>> {
    return this.delete_tweet(tweet_id);
  }

  /**
   * 更新定时推文
   */
  async update_scheduled_tweet(
    scheduled_tweet_id: number | string,
    text: string,
    date: number | string,
    media: MediaEntity[] = [],
  ): Promise<Record<string, any>> {
    // 首先取消原有的定时推文
    await this.unschedule_tweet(scheduled_tweet_id);

    // 然后创建新的定时推文
    return this.schedule_tweet(text, date, media);
  }

  /**
   * 回复推文
   */
  async reply(
    text: string,
    tweet_id: number | string,
    media: MediaEntity[] = [],
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = {
      tweet_text: text,
      reply: {
        in_reply_to_tweet_id: tweet_id.toString(),
        exclude_reply_user_ids: [],
      },
      batch_compose: "BatchSubsequent",
      dark_request: false,
      media: {
        media_entities: [],
        possibly_sensitive: false,
      },
      semantic_annotation_ids: [],
    };

    // 处理媒体
    if (media && media.length > 0) {
      for (const m of media) {
        const tagged_users_id: number[] = [];

        if (m.tagged_users && m.tagged_users.length > 0) {
          for (const tagged_user of m.tagged_users) {
            try {
              const user_id = await this.get_user_id(tagged_user);
              tagged_users_id.push(user_id);
            } catch (error) {
              console.warn(
                `Failed to get user ID for ${tagged_user}:`,
                error.message,
              );
            }
          }
        }

        variables["media"]["media_entities"].push({
          media_id: m.media_id,
          tagged_users: tagged_users_id,
        });
      }
    }

    return this.gql("POST", Operation.CreateTweet, variables);
  }

  /**
   * 引用推文
   */
  async quote(
    text: string,
    tweet_id: number | string,
    media: MediaEntity[] = [],
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = {
      tweet_text: text,
      attachment_url: `https://twitter.com/i/status/${tweet_id}`,
      dark_request: false,
      media: {
        media_entities: [],
        possibly_sensitive: false,
      },
      semantic_annotation_ids: [],
    };

    // 处理媒体
    if (media && media.length > 0) {
      for (const m of media) {
        const tagged_users_id: number[] = [];

        if (m.tagged_users && m.tagged_users.length > 0) {
          for (const tagged_user of m.tagged_users) {
            try {
              const user_id = await this.get_user_id(tagged_user);
              tagged_users_id.push(user_id);
            } catch (error) {
              console.warn(
                `Failed to get user ID for ${tagged_user}:`,
                error.message,
              );
            }
          }
        }

        variables["media"]["media_entities"].push({
          media_id: m.media_id,
          tagged_users: tagged_users_id,
        });
      }
    }

    return this.gql("POST", Operation.CreateTweet, variables);
  }

  /**
   * 转推
   */
  async retweet(tweet_id: number | string): Promise<Record<string, any>> {
    const variables = {
      tweet_id: tweet_id.toString(),
      dark_request: false,
    };

    return this.gql("POST", Operation.CreateRetweet, variables);
  }

  /**
   * 取消转推
   */
  async unretweet(tweet_id: number | string): Promise<Record<string, any>> {
    const variables = {
      source_tweet_id: tweet_id.toString(),
      dark_request: false,
    };

    return this.gql("POST", Operation.DeleteRetweet, variables);
  }

  /**
   * 批量转推
   */
  async retweetMultiple(
    tweet_ids: (number | string)[],
  ): Promise<Array<Record<string, any>>> {
    const results: Array<Record<string, any>> = [];

    for (const tweet_id of tweet_ids) {
      try {
        const result = await this.retweet(tweet_id);
        results.push({ success: true, tweet_id, result });
      } catch (error) {
        results.push({
          success: false,
          tweet_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * 批量取消转推
   */
  async unretweetMultiple(
    tweet_ids: (number | string)[],
  ): Promise<Array<Record<string, any>>> {
    const results: Array<Record<string, any>> = [];

    for (const tweet_id of tweet_ids) {
      try {
        const result = await this.unretweet(tweet_id);
        results.push({ success: true, tweet_id, result });
      } catch (error) {
        results.push({
          success: false,
          tweet_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * 获取游标值
   */
  private __get_cursor_value(
    _data: Record<string, any>,
    target_cursor_type: string,
    target_entry_type: string,
  ): string | null {
    if (target_entry_type !== "threaded_conversation_with_injections_v2") {
      // 处理标准时间线类型
      const timeline = _data?.data?.[target_entry_type]?.timeline;
      if (!timeline) return null;

      const instructions = timeline.instructions || [];

      for (const instruction of instructions) {
        const entries = instruction.entries || [];

        for (const entry of entries) {
          const content = entry.content || {};

          if (
            content.entryType === "TimelineTimelineCursor" &&
            content.cursorType === target_cursor_type
          ) {
            return content.value || null;
          }
        }
      }
    } else {
      // 处理 threaded_conversation_with_injections_v2 类型
      const conversationData = _data?.data?.[target_entry_type];
      if (!conversationData) return null;

      const instructions = conversationData.instructions || [];

      for (const instruction of instructions) {
        const entries = instruction.entries || [];

        for (const entry of entries) {
          const content = entry.content || {};

          if (
            content.entryType === "TimelineTimelineCursor" &&
            content.cursorType === target_cursor_type
          ) {
            return content.value || null;
          }
        }
      }
    }

    return null;
  }

  /**
   * 从 user_results 中提取用户数据
   */
  private get_user_data_from_user_results(result: any): UserData {
    const legacy = result.legacy || {};
    return {
      id: result.rest_id || result.id || "",
      name: legacy.name || "",
      screen_name: legacy.screen_name || "",
      profile_image_url:
        legacy.profile_image_url_https || legacy.profile_image_url || "",
      favourites_count: legacy.favourites_count || 0,
      followers_count: legacy.followers_count || 0,
      friends_count: legacy.friends_count || 0,
      location: legacy.location || "",
      description: legacy.description || "",
      created_at: legacy.created_at || "",
    };
  }

  /**
   * 获取推文的点赞用户
   */
  async tweet_likes(
    sessionInstance: AxiosInstance,
    tweet_id: number | string,
    limit: number = 0,
  ): Promise<UsersResponse> {
    const variables: Record<string, any> = {
      tweetId: tweet_id.toString(),
      count: 100,
    };

    const users_data: UserData[] = [];
    const seen_screen_names = new Set<string>();

    while (true) {
      try {
        const _data = await this.gql("GET", Operation.Favoriters, variables);

        const instructions =
          _data?.data?.favoriters_timeline?.timeline?.instructions || [];

        let hasValidEntries = false;

        for (const instruction of instructions) {
          const entries = instruction.entries || [];

          for (const entry of entries) {
            try {
              const content = entry.content || {};
              const itemContent = content.itemContent || {};
              const userResults = itemContent.user_results || {};
              const result = userResults.result;

              if (result && result.legacy) {
                const screen_name = result.legacy.screen_name;

                if (!seen_screen_names.has(screen_name)) {
                  seen_screen_names.add(screen_name);
                  const userData = this.get_user_data_from_user_results(result);
                  users_data.push(userData);
                  hasValidEntries = true;
                }
              }
            } catch (error) {
              // 忽略单个条目的错误，继续处理其他条目
              continue;
            }
          }
        }

        // 如果没有有效条目或者达到限制，返回结果
        if (!hasValidEntries || (limit > 0 && users_data.length >= limit)) {
          return {
            users: limit > 0 ? users_data.slice(0, limit) : users_data,
          };
        }

        // 获取下一页游标
        const cursor_value = this.__get_cursor_value(
          _data,
          "Bottom",
          "favoriters_timeline",
        );
        if (!cursor_value) {
          return {
            users: limit > 0 ? users_data.slice(0, limit) : users_data,
          };
        }

        variables["cursor"] = cursor_value;

        // 添加延迟以避免速率限制
        await sleep(1000);
      } catch (error) {
        console.error(
          "Error fetching tweet likes:",
          error instanceof Error ? error.message : String(error),
        );
        return {
          users: limit > 0 ? users_data.slice(0, limit) : users_data,
        };
      }
    }
  }

  /**
   * 获取推文的转推用户
   */
  async tweet_retweeters(
    sessionInstance: AxiosInstance,
    tweet_id: number | string,
    limit: number = 0,
  ): Promise<UsersResponse> {
    const variables: Record<string, any> = {
      tweetId: tweet_id.toString(),
      count: 100,
    };

    const users_data: UserData[] = [];
    const seen_screen_names = new Set<string>();

    while (true) {
      try {
        const _data = await this.gql("GET", Operation.Retweeters, variables);

        const instructions =
          _data?.data?.retweeters_timeline?.timeline?.instructions || [];

        let hasValidEntries = false;

        for (const instruction of instructions) {
          const entries = instruction.entries || [];

          for (const entry of entries) {
            try {
              const content = entry.content || {};
              const itemContent = content.itemContent || {};
              const userResults = itemContent.user_results || {};
              const result = userResults.result;

              if (result && result.legacy) {
                const screen_name = result.legacy.screen_name;

                if (!seen_screen_names.has(screen_name)) {
                  seen_screen_names.add(screen_name);
                  const userData = this.get_user_data_from_user_results(result);
                  users_data.push(userData);
                  hasValidEntries = true;
                }
              }
            } catch (error) {
              // 忽略单个条目的错误，继续处理其他条目
              continue;
            }
          }
        }

        // 如果没有有效条目或者达到限制，返回结果
        if (!hasValidEntries || (limit > 0 && users_data.length >= limit)) {
          return {
            users: limit > 0 ? users_data.slice(0, limit) : users_data,
          };
        }

        // 获取下一页游标
        const cursor_value = this.__get_cursor_value(
          _data,
          "Bottom",
          "retweeters_timeline",
        );
        if (!cursor_value) {
          return {
            users: limit > 0 ? users_data.slice(0, limit) : users_data,
          };
        }

        variables["cursor"] = cursor_value;

        // 添加延迟以避免速率限制
        await sleep(1000);
      } catch (error) {
        console.error(
          "Error fetching tweet retweeters:",
          error instanceof Error ? error.message : String(error),
        );
        return {
          users: limit > 0 ? users_data.slice(0, limit) : users_data,
        };
      }
    }
  }

  /**
   * 批量获取多个推文的点赞用户
   */
  async multiple_tweet_likes(
    sessionInstance: AxiosInstance,
    tweet_ids: (number | string)[],
    limit_per_tweet: number = 0,
  ): Promise<Record<string, UsersResponse>> {
    const results: Record<string, UsersResponse> = {};

    for (const tweet_id of tweet_ids) {
      try {
        const likes = await this.tweet_likes(
          sessionInstance,
          tweet_id,
          limit_per_tweet,
        );
        results[tweet_id.toString()] = likes;

        // 在推文之间添加延迟
        await sleep(2000);
      } catch (error) {
        console.error(
          `Failed to get likes for tweet ${tweet_id}:`,
          error instanceof Error ? error.message : String(error),
        );
        results[tweet_id.toString()] = { users: [] };
      }
    }

    return results;
  }

  /**
   * 批量获取多个推文的转推用户
   */
  async multiple_tweet_retweeters(
    sessionInstance: AxiosInstance,
    tweet_ids: (number | string)[],
    limit_per_tweet: number = 0,
  ): Promise<Record<string, UsersResponse>> {
    const results: Record<string, UsersResponse> = {};

    for (const tweet_id of tweet_ids) {
      try {
        const retweeters = await this.tweet_retweeters(
          sessionInstance,
          tweet_id,
          limit_per_tweet,
        );
        results[tweet_id.toString()] = retweeters;

        // 在推文之间添加延迟
        await sleep(2000);
      } catch (error) {
        console.error(
          `Failed to get retweeters for tweet ${tweet_id}:`,
          error instanceof Error ? error.message : String(error),
        );
        results[tweet_id.toString()] = { users: [] };
      }
    }

    return results;
  }

  /**
   * 获取推文的互动统计（点赞和转推）
   */
  async tweet_engagement_stats(
    sessionInstance: AxiosInstance,
    tweet_id: number | string,
    likes_limit: number = 50,
    retweeters_limit: number = 50,
  ): Promise<{
    likes: UsersResponse;
    retweeters: UsersResponse;
    total_likes: number;
    total_retweeters: number;
  }> {
    try {
      const [likes, retweeters] = await Promise.all([
        this.tweet_likes(sessionInstance, tweet_id, likes_limit),
        this.tweet_retweeters(sessionInstance, tweet_id, retweeters_limit),
      ]);

      return {
        likes,
        retweeters,
        total_likes: likes.users.length,
        total_retweeters: retweeters.users.length,
      };
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get engagement stats: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * 获取推文的回复
   */
  async tweet_replies(
    tweet_id: number | string,
    limit: number = 0,
  ): Promise<RepliesResponse> {
    const variables: Record<string, any> = {
      focalTweetId: tweet_id.toString(),
      with_rux_injections: false,
      includePromotedContent: false,
      withCommunity: false,
      withQuickPromoteEligibilityTweetFields: false,
      withVoice: false,
      withV2Timeline: true,
    };

    const replies_data: ReplyData[] = [];
    const seen_reply_texts = new Set<string>();

    while (true) {
      try {
        const _data = await this.gql("GET", Operation.TweetDetail, variables);

        const instructions =
          _data?.data?.threaded_conversation_with_injections_v2?.instructions ||
          [];

        let hasValidEntries = false;

        for (const instruction of instructions) {
          if (instruction.type === "TimelineAddEntries") {
            const entries = instruction.entries || [];

            for (const entry of entries) {
              try {
                // 检查是否是推文条目
                if (entry.entryId && !entry.entryId.startsWith("cursor-")) {
                  const items = entry?.content?.items || [];

                  for (const item of items) {
                    try {
                      const result =
                        item?.item?.itemContent?.tweet_results?.result;
                      if (result && result.legacy && result.core) {
                        const reply_text = result.legacy.full_text;
                        const user_results = result.core.user_results?.result;

                        if (
                          reply_text &&
                          user_results &&
                          !seen_reply_texts.has(reply_text)
                        ) {
                          seen_reply_texts.add(reply_text);
                          replies_data.push({
                            reply_text: reply_text,
                            user_data:
                              this.get_user_data_from_user_results(
                                user_results,
                              ),
                          });
                          hasValidEntries = true;
                        }
                      }
                    } catch (error) {
                      continue;
                    }
                  }
                }
              } catch (error) {
                continue;
              }
            }
          }
        }

        // 检查是否达到限制
        if (limit > 0 && replies_data.length >= limit) {
          return { replies: replies_data.slice(0, limit) };
        }

        // 获取下一页游标
        let cursor_value: string | null = null;
        const entries =
          _data?.data?.threaded_conversation_with_injections_v2
            ?.instructions?.[0]?.entries || [];

        for (const entry of entries) {
          if (entry.entryId && entry.entryId.startsWith("cursor-bottom")) {
            cursor_value = entry.content?.itemContent?.value || null;
            break;
          }
        }

        // 如果没有游标或者没有有效条目，返回结果
        if (!cursor_value || !hasValidEntries) {
          return { replies: replies_data };
        }

        variables["cursor"] = cursor_value;

        // 添加延迟以避免速率限制
        await sleep(1000);
      } catch (error) {
        console.error(
          "Error fetching tweet replies:",
          error instanceof Error ? error.message : String(error),
        );
        return { replies: replies_data };
      }
    }
  }

  /**
   * 获取用户粉丝列表
   */
  async user_followers(
    sessionInstance: AxiosInstance,
    username: string,
    limit: number = 200,
  ): Promise<string[]> {
    const variables: Record<string, any> = {
      screen_name: username,
      count: 200,
      skip_status: true,
      include_user_entities: false,
    };

    const _users: string[] = [];
    let next_cursor = "-1";

    while (true) {
      try {
        const response = await sessionInstance.get(
          `${this.v1Api}/followers/list.json`,
          {
            params: variables,
            validateStatus: (status: number) => status < 500,
          },
        );

        // 处理503错误
        if (response.status === 503) {
          console.log("Rate limited, waiting 3 seconds...");
          await sleep(3000);
          continue;
        }

        const _data = this.verifyResponse(response);
        const new_users = _data.users.map((user: any) => user.screen_name);
        _users.push(...new_users);

        next_cursor = _data.next_cursor_str || "0";
        const next_cursor_num = parseInt(next_cursor);

        // 检查是否达到限制或没有更多数据
        if (next_cursor_num === 0 || (limit > 0 && _users.length >= limit)) {
          return limit > 0 ? _users.slice(0, limit) : _users;
        }

        variables["cursor"] = next_cursor;

        // 添加延迟以避免速率限制
        await sleep(2000);
      } catch (error) {
        if (error instanceof TwitterError) {
          console.error("Error fetching user followers:", error.message);
        } else {
          console.error(
            "Unexpected error:",
            error instanceof Error ? error.message : String(error),
          );
        }
        return _users;
      }
    }
  }

  /**
   * 获取用户关注列表
   */
  async user_followings(
    sessionInstance: AxiosInstance,
    username: string,
    limit: number = 200,
  ): Promise<string[]> {
    const variables: Record<string, any> = {
      screen_name: username,
      count: 200,
      skip_status: true,
      include_user_entities: false,
    };

    const _users: string[] = [];
    let next_cursor = "-1";

    while (true) {
      try {
        const response = await sessionInstance.get(
          `${this.v1Api}/friends/list.json`,
          {
            params: variables,
            validateStatus: (status: number) => status < 500,
          },
        );

        // 处理503错误
        if (response.status === 503) {
          console.log("Rate limited, waiting 5 seconds...");
          await sleep(5000);
          continue;
        }

        const _data = this.verifyResponse(response);
        const new_users = _data.users.map((user: any) => user.screen_name);
        _users.push(...new_users);

        next_cursor = _data.next_cursor_str || "0";
        const next_cursor_num = parseInt(next_cursor);

        // 检查是否达到限制或没有更多数据
        if (next_cursor_num === 0 || (limit > 0 && _users.length >= limit)) {
          return limit > 0 ? _users.slice(0, limit) : _users;
        }

        variables["cursor"] = next_cursor;

        // 添加延迟以避免速率限制
        await sleep(2000);
      } catch (error) {
        if (error instanceof TwitterError) {
          console.error("Error fetching user followings:", error.message);
        } else {
          console.error(
            "Unexpected error:",
            error instanceof Error ? error.message : String(error),
          );
        }
        return _users;
      }
    }
  }

  async user_last_tweets(username: string): Promise<
    Array<{
      tweet_link: string;
      full_text: string;
      created_at: string;
      is_quote_status: boolean;
      lang: string;
    }>
  > {
    const user_id = await this.get_user_id(username);
    const json_data = await this.gql("GET", Operation.UserTweets, {
      userId: user_id,
    });

    try {
      const tweets_data: Array<{
        tweet_link: string;
        full_text: string;
        created_at: string;
        is_quote_status: boolean;
        lang: string;
      }> = [];
      const timeline =
        json_data["data"]["user"]["result"]["timeline_v2"]["timeline"];

      for (const tweet of timeline["instructions"]) {
        const entries = tweet.entries || [];
        for (const entry of entries) {
          let tweet_link = "";
          if (entry["entryId"].startsWith("tweet")) {
            tweet_link = `https://twitter.com/${username}/status/${entry["entryId"].split("-")[-1]}`;
          } else {
            continue;
          }

          const tweet_results =
            entry?.content?.itemContent?.tweet_results?.result?.legacy;
          if (tweet_results && tweet_results.full_text) {
            const full_text = tweet_results.full_text;
            const created_at = tweet_results.created_at || "";
            const is_quote_status = tweet_results.is_quote_status || false;
            const lang = tweet_results.lang || "";

            tweets_data.push({
              tweet_link,
              full_text,
              created_at,
              is_quote_status,
              lang,
            });
          }
        }
      }

      return tweets_data;
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to get user tweets: ${error}`,
      });
    }
  }

  async like(tweet_id: number | string): Promise<Record<string, any>> {
    const variables = { tweet_id: tweet_id.toString() };
    return this.gql("POST", Operation.FavoriteTweet, variables);
  }

  async unlike(tweet_id: number | string): Promise<Record<string, any>> {
    const variables = { tweet_id: tweet_id.toString() };
    return this.gql("POST", Operation.UnfavoriteTweet, variables);
  }

  async bookmark(tweet_id: number | string): Promise<Record<string, any>> {
    const variables = { tweet_id: tweet_id.toString() };
    return this.gql("POST", Operation.CreateBookmark, variables);
  }

  async unbookmark(tweet_id: number | string): Promise<Record<string, any>> {
    const variables = { tweet_id: tweet_id.toString() };
    return this.gql("POST", Operation.DeleteBookmark, variables);
  }

  async create_list(
    name: string,
    description: string,
    isPrivate: boolean,
  ): Promise<Record<string, any>> {
    const variables = {
      isPrivate: isPrivate,
      name: name,
      description: description,
    };
    return this.gql("POST", Operation.CreateList, variables);
  }

  async update_list(
    list_id: number | string,
    name: string,
    description: string,
    isPrivate: boolean,
  ): Promise<Record<string, any>> {
    const variables = {
      listId: list_id.toString(),
      isPrivate: isPrivate,
      name: name,
      description: description,
    };
    return this.gql("POST", Operation.UpdateList, variables);
  }

  async delete_list_banner(
    list_id: number | string,
  ): Promise<Record<string, any>> {
    return this.gql("POST", Operation.DeleteListBanner, {
      listId: list_id.toString(),
    });
  }

  async follow_topic(topic_id: number | string): Promise<Record<string, any>> {
    return this.gql("POST", Operation.TopicFollow, {
      topicId: topic_id.toString(),
    });
  }

  async unfollow_topic(
    topic_id: number | string,
  ): Promise<Record<string, any>> {
    return this.gql("POST", Operation.TopicUnfollow, {
      topicId: topic_id.toString(),
    });
  }

  async pin(tweet_id: number | string): Promise<Record<string, any>> {
    return this.v1("account/pin_tweet.json", {
      tweet_mode: "extended",
      id: tweet_id.toString(),
    });
  }

  async unpin(tweet_id: number | string): Promise<Record<string, any>> {
    return this.v1("account/unpin_tweet.json", {
      tweet_mode: "extended",
      id: tweet_id.toString(),
    });
  }

  async get_user_info(
    sessionInstance: AxiosInstance,
    username: string,
  ): Promise<Record<string, any>> {
    const headers = getHeaders(this.cookies);
    headers["content-type"] = "application/x-www-form-urlencoded";

    const response = await sessionInstance.get(
      `${this.v1Api}/users/show.json`,
      {
        headers,
        params: { screen_name: username },
        validateStatus: (status: number) => status < 500,
      },
    );

    return this.verifyResponse(response);
  }

  async follow(user_id: number | string): Promise<Record<string, any>> {
    const settings = { ...follow_settings, user_id: user_id.toString() };
    return this.v1("friendships/create.json", settings);
  }

  async unfollow(user_id: number | string): Promise<Record<string, any>> {
    const settings = { ...follow_settings, user_id: user_id.toString() };
    return this.v1("friendships/destroy.json", settings);
  }

  async mute(user_id: number | string): Promise<Record<string, any>> {
    return this.v1("mutes/users/create.json", { user_id: user_id.toString() });
  }

  async unmute(user_id: number | string): Promise<Record<string, any>> {
    return this.v1("mutes/users/destroy.json", { user_id: user_id.toString() });
  }

  async enable_follower_notifications(
    user_id: number | string,
  ): Promise<Record<string, any>> {
    const settings = {
      ...follower_notification_settings,
      id: user_id.toString(),
      device: "true",
    };
    return this.v1("friendships/update.json", settings);
  }

  async disable_follower_notifications(
    user_id: number | string,
  ): Promise<Record<string, any>> {
    const settings = {
      ...follower_notification_settings,
      id: user_id.toString(),
      device: "false",
    };
    return this.v1("friendships/update.json", settings);
  }

  async block(user_id: number | string): Promise<Record<string, any>> {
    return this.v1("blocks/create.json", { user_id: user_id.toString() });
  }

  async unblock(user_id: number | string): Promise<Record<string, any>> {
    return this.v1("blocks/destroy.json", { user_id: user_id.toString() });
  }

  async update_profile_info(
    _params: Record<string, any>,
  ): Promise<Record<string, any>> {
    const response = await this.session.post(
      `${this.v1Api}/account/update_profile.json`,
      _params,
      {
        validateStatus: (status: number) => status < 500,
      },
    );

    return this.verifyResponse(response);
  }

  async update_search_settings(
    settings: Record<string, any>,
  ): Promise<Record<string, any>> {
    try {
      const twidCookie = this.cookies["twid"];
      if (!twidCookie) {
        throw new TwitterError({ error_message: "twid cookie not found" });
      }

      const twid = parseInt(twidCookie.split("=")[-1].replace(/"/g, ""));

      const response = await this.session.post(
        `${this.v1Api}/strato/column/User/${twid}/search/searchSafety`,
        settings,
        {
          validateStatus: (status: number) => status < 500,
        },
      );
      return this.verifyResponse(response);
    } catch (error) {
      throw new TwitterError({
        error_message: `Failed to update search settings: ${error}`,
      });
    }
  }

  async update_settings(
    settings: Record<string, any>,
  ): Promise<Record<string, any>> {
    return this.v1("account/settings.json", settings);
  }

  async update_username(username: string): Promise<Record<string, any>> {
    return this.update_settings({ screen_name: username });
  }

  async change_password(
    old: string,
    news: string,
  ): Promise<Record<string, any>> {
    const _params = {
      current_password: old,
      password: news,
      password_confirmation: news,
    };
    const headers = getHeaders(this.cookies);
    headers["content-type"] = "application/x-www-form-urlencoded";

    const response = await this.session.post(
      `${this.v1Api}/account/change_password.json`,
      _params,
      {
        headers,
        maxRedirects: 5,
        validateStatus: (status: number) => status < 500,
      },
    );
    return this.verifyResponse(response);
  }

  async dm_inbox(): Promise<Record<string, any>> {
    const response = await this.session.get(
      `${this.v1Api}/dm/inbox_initial_state.json`,
      {
        params: dm_params,
        validateStatus: (status: number) => status < 500,
      },
    );
    return this.verifyResponse(response);
  }

  async dm_delete(
    conversation_id?: string,
    message_id?: string,
  ): Promise<Record<string, any>> {
    if (!conversation_id && !message_id) {
      throw new TwitterError({
        error_message: "Provide either conversation_id or message_id",
      });
    }

    const results: Record<string, any> = { conversation: null, message: null };

    if (conversation_id) {
      const response = await this.session.post(
        `${this.v1Api}/dm/conversation/${conversation_id}/delete.json`,
        null,
        {
          validateStatus: (status: number) => status < 500,
        },
      );
      results["conversation"] = response;
    }

    if (message_id) {
      const [_id, op] = ["-1naj3-w8Ml72aD2R9QaYQ", "DMMessageDeleteMutation"];
      const response = await this.session.post(
        `${this.gqlApi}/${_id}/${op}`,
        {
          queryId: _id,
          variables: { messageId: message_id },
        },
        {
          validateStatus: (status: number) => status < 500,
        },
      );
      results["message"] = response;
    }

    return results;
  }

  async scheduled_tweets(
    ascending: boolean = true,
  ): Promise<Record<string, any>> {
    const variables = { ascending: ascending };
    return this.gql("GET", Operation.FetchScheduledTweets, variables);
  }

  async delete_scheduled_tweet(
    tweet_id: number | string,
  ): Promise<Record<string, any>> {
    const variables = { scheduled_tweet_id: tweet_id.toString() };
    return this.gql("POST", Operation.DeleteScheduledTweet, variables);
  }

  async clear_scheduled_tweets(): Promise<void> {
    const twid = this.cookies["twid"];
    if (!twid) return;

    const match = twid.match(/"u=(\d+)"/);
    if (!match) return;

    const user_id = parseInt(match[1]);
    const drafts = await this.gql("GET", Operation.FetchScheduledTweets, {
      ascending: true,
    });
    const ids = new Set(this.findKey(drafts, "rest_id"));

    for (const _id of ids) {
      if (_id !== user_id.toString()) {
        await this.gql("POST", Operation.DeleteScheduledTweet, {
          scheduled_tweet_id: _id,
        });
      }
    }
  }

  async draft_tweets(ascending: boolean = true): Promise<Record<string, any>> {
    const variables = { ascending: ascending };
    return this.gql("GET", Operation.FetchDraftTweets, variables);
  }

  async delete_draft_tweet(
    tweet_id: number | string,
  ): Promise<Record<string, any>> {
    const variables = { draft_tweet_id: tweet_id.toString() };
    return this.gql("POST", Operation.DeleteDraftTweet, variables);
  }

  async clear_draft_tweets(): Promise<void> {
    const twid = this.cookies["twid"];
    if (!twid) return;

    const match = twid.match(/"u=(\d+)"/);
    if (!match) return;

    const user_id = parseInt(match[1]);
    const drafts = await this.gql("GET", Operation.FetchDraftTweets, {
      ascending: true,
    });
    const ids = new Set(this.findKey(drafts, "rest_id"));

    for (const _id of ids) {
      if (_id !== user_id.toString()) {
        await this.gql("POST", Operation.DeleteDraftTweet, {
          draft_tweet_id: _id,
        });
      }
    }
  }

  async notifications(
    _params?: Record<string, any>,
  ): Promise<Record<string, any>> {
    const response = await this.session.get(
      `${this.v2Api}/notifications/all.json`,
      {
        params: _params || live_notification_params,
        validateStatus: (status: number) => status < 500,
      },
    );
    return this.verifyResponse(response);
  }

  async recommendations(
    _params?: Record<string, any>,
  ): Promise<Record<string, any>> {
    const response = await this.session.get(
      `${this.v1Api}/users/recommendations.json`,
      {
        params: _params || recommendations_params,
        validateStatus: (status: number) => status < 500,
      },
    );
    return this.verifyResponse(response);
  }

  async fleetline(_params?: Record<string, any>): Promise<Record<string, any>> {
    const response = await this.session.get(
      "https://twitter.com/i/api/fleets/v1/fleetline",
      {
        params: _params || {},
        validateStatus: (status: number) => status < 500,
      },
    );
    return this.verifyResponse(response);
  }
}
