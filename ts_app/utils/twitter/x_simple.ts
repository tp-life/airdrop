import { HttpClient } from "../http";
import { URLSearchParams } from "url";
import qs from "qs";
export interface ErrorObject {
  message: string;
  path?: string[];
  code?: number;
  kind?: string;
  name?: string;
  source?: string;
}

export interface ReportResp {
  data?: {
    create_retweet?: {
      retweet_results?: {
        result?: {
          rest_id?: string;
          legacy?: {
            full_text?: string;
          };
        };
      };
    };
  };
  errors?: ErrorObject[];
}

export interface LikeResp {
  data?: {
    favorite_tweet?: string;
  };
  errors?: ErrorObject[];
}

export interface CreateTweetResp {
  data?: {
    create_tweet?: {
      tweet_results?: {
        result?: {
          rest_id?: string;
          core?: {
            user_results?: {
              result?: {
                legacy?: {
                  screen_name?: string;
                };
              };
            };
          };
        };
      };
    };
  };
  errors?: ErrorObject[];
}

export interface UserInfoResp {
  data?: {
    user_result_by_screen_name?: {
      result?: {
        rest_id?: string;
        // keep extra fields as optional — we only need rest_id in current code
      };
    };
  };
}

// Note: avoid name collision with exported ErrAccountBLocked below
export const ErrAccountBLocked = new Error(
  "登录失败, 判定为账户已失效: 401 Unauthorized",
);

export default class X {
  token: string;
  proxy?: string;
  ct0 = "";
  authToken =
    "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
  client: HttpClient;
  cookie: string[] = [];

  constructor(token: string, proxy?: string) {
    this.token = token;
    this.proxy = proxy;
    this.client = new HttpClient({ proxy });
  }

  Header(): Record<string, string> {
    let cookie = `auth_token=${this.token}`;
    if (this.cookie.length > 0) {
      cookie += "; " + this.cookie.join("; ");
    }

    const h: Record<string, string> = {
      cookie,
      "upgrade-insecure-requests": "1",
      authority: "x.com",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
    };

    return this._header(h);
  }

  private _header(hm: Record<string, string>): Record<string, string> {
    return { ...hm };
  }

  // Login 获取 ct0
  async Login(): Promise<string> {
    if (this.ct0) return this.ct0;

    try {
      const resp = await this.client.get("https://x.com/home", {
        headers: this.Header(),
        validateStatus: () => true,
      });
      // axios lowercases header names; set-cookie is usually present as array
      const setCookie = (resp.headers as any)["set-cookie"] as
        | string[]
        | undefined;

      if (!setCookie || !Array.isArray(setCookie)) {
        console.info("登录失败， 可能已经被封了", this.token);
        throw ErrAccountBLocked;
      }

      let ct0 = "";
      for (const cookie of setCookie) {
        if (typeof cookie === "string" && cookie.includes("ct0")) {
          if (cookie.startsWith("ct0=") && cookie.length > 115) {
            ct0 = cookie;
            break;
          }
        }
      }

      if (!ct0) {
        console.info("登录失败， 可能已经被封了", this.token);
        throw ErrAccountBLocked;
      }

      const cookies: string[] = [];
      for (const v of setCookie) {
        if (typeof v === "string") {
          const cp = v.split(";");
          if (cp.length > 0) cookies.push(cp[0]);
        }
      }

      this.cookie = cookies;
      this.ct0 = ct0;
      return ct0;
    } catch (err) {
      console.error("登录twitter失败", err);
      throw ErrAccountBLocked;
    }
  }

  getHeaderMap(): Record<string, string> {
    let cookie = `auth_token=${this.token}`;
    if (this.cookie.length > 0) {
      for (const v of this.cookie) {
        const cke = v.split(";");
        if (cke.length > 0) cookie += "; " + cke[0];
      }
    }

    return {
      authorization: this.authToken,
      "x-csrf-token": this.GetToken(),
      "x-twitter-active-user": "yes",
      "x-twitter-auth-type": "OAuth2Session",
      "Content-Type": "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Chromium";v="125", "Not(A:Brand";v="24", "Google Chrome";v="125"',
      "sec-ch-ua-platform": '"Windows"',
      "x-twitter-client-language": "en",
      cookie,
    };
  }

  authHeader(): Record<string, string> {
    let cookie = `auth_token=${this.token}`;
    if (this.cookie.length > 0) {
      for (const v of this.cookie) {
        const cp = v.split(";");
        if (cp.length > 0) cookie += "; " + cp[0];
      }
    }
    console.log("cookie: ", cookie);
    return {
      "accept-language": "zh-CN,zh;q=0.9",
      "content-type": "application/x-www-form-urlencoded",
      cookie,
      origin: "https://api.x.com",
      priority: "u=0, i",
      referer: "https://api.x.com/",
      "sec-ch-ua":
        '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-site",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    } as Record<string, string>;
  }

  async SetRepost(tweetID: string): Promise<void> {
    const url =
      "https://x.com/i/api/graphql/ojPdsZsimiJrUGLR1sjUtA/CreateRetweet";
    const data = {
      variables: { tweet_id: tweetID, dark_request: false },
      queryId: "ojPdsZsimiJrUGLR1sjUtA",
    };

    try {
      const resp = await this.client.post(url, data, {
        headers: this.getHeaderMap(),
        validateStatus: () => true,
      });
      const body = resp.data as ReportResp;

      if (!body || (Array.isArray(body.errors) && body.errors.length > 0)) {
        let msg = "";
        for (const v of body.errors || []) {
          if (
            (v?.message || "").includes("You have already retweeted this Tweet")
          ) {
            console.info("你已转发过");
            return;
          }
          msg += (v?.message || "") + ";";
        }
        throw new Error(msg || "unknown error");
      }
      console.info("转发成功");
    } catch (err) {
      console.error("转发推特失败:", this.token, err);
      throw err;
    }
  }

  async GetUser(user: string): Promise<UserInfoResp> {
    const url = `https://x.com/i/api/graphql/KlYumqcG7TtN3A78RX37dQ/ProfileSpotlightsQuery?variables=%7B%22screen_name%22%3A%22${encodeURIComponent(
      user,
    )}%22%7D`;

    try {
      const resp = await this.client.get(url, {
        headers: this.getHeaderMap(),
        validateStatus: () => true,
      });
      return resp.data as UserInfoResp;
    } catch (err) {
      console.error("获取用户信息失败:", err);
      throw err;
    }
  }

  async SetFollowers(user: string): Promise<void> {
    const userInfo = await this.GetUser(user);
    const userId = userInfo?.data?.user_result_by_screen_name?.result?.rest_id;
    if (!userId) return;

    const uri = "https://x.com/i/api/1.1/friendships/create.json";
    const params = qs.stringify({
      include_profile_interstitial_type: 1,
      include_blocking: 1,
      include_blocked_by: 1,
      include_followed_by: 1,
      include_want_retweets: 1,
      include_mute_edge: 1,
      include_can_dm: 1,
      include_can_media_tag: 1,
      include_ext_is_blue_verified: 1,
      include_ext_verified_type: 1,
      include_ext_profile_image_shape: 1,
      skip_status: 1,
      user_id: userId,
    });

    const headers = {
      ...this.getHeaderMap(),
      "Content-Type": "application/x-www-form-urlencoded",
    };

    try {
      const resp = await this.client.post<{ id: number }>(
        uri,
        params.toString(),
        {
          headers,
          validateStatus: () => true,
        },
      );
      const responseBody = String(resp.data || "");
      if (!responseBody.includes("id_str")) {
        console.info(`关注${user}失败`);
        throw new Error(`关注${user}失败`);
      }
    } catch (err) {
      console.error("关注用户调用失败: ", err);
      throw err;
    }
  }

  async SetLike(tweetID: string): Promise<void> {
    const url =
      "https://x.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet";
    const data = {
      variables: { tweet_id: tweetID },
      queryId: "ojPdsZsimiJrUGLR1sjUtA",
    };
    try {
      const resp = await this.client.post(url, data, {
        headers: this.getHeaderMap(),
        validateStatus: () => true,
      });
      const body = resp.data as LikeResp;
      if (!body || (Array.isArray(body.errors) && body.errors.length > 0)) {
        let msg = "";
        for (const v of body.errors || []) {
          if ((v?.message || "").includes("already favorited tweet")) {
            console.info("你已Like过");
            return;
          }
          msg += (v?.message || "") + ";";
        }
        throw new Error(msg || "unknown error");
      }
      console.info("LIKE成功");
    } catch (err) {
      console.error("LIKE 推特失败:", this.token, err);
      throw err;
    }
  }

  async SetQuote(urlText: string): Promise<string> {
    const apiURL =
      "https://x.com/i/api/graphql/v0en1yVV-Ybeek8ClmXwYw/CreateTweet";
    const jsonStr = JSON.stringify({
      variables: {
        tweet_text: `${urlText} `,
        dark_request: false,
        media: { media_entities: [], possibly_sensitive: false },
        semantic_annotation_ids: [],
      },
      features: {
        communities_web_enable_tweet_community_results_fetch: true,
        c9s_tweet_anatomy_moderator_badge_enabled: true,
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: true,
        tweet_awards_web_tipping_enabled: false,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        rweb_video_timestamps_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_enhance_cards_enabled: false,
      },
      queryId: "v0en1yVV-Ybeek8ClmXwYw",
    });

    const headers = {
      ...this.getHeaderMap(),
      "Content-Type": "application/json",
    };

    try {
      const resp = await this.client.post(apiURL, jsonStr, {
        headers,
        validateStatus: () => true,
      });
      const data = resp.data as ReportResp;
      const rsetID =
        data?.data?.create_retweet?.retweet_results?.result?.rest_id || "";
      if (!data || (Array.isArray(data?.errors) && data.errors.length > 0)) {
        let msg = "";
        for (const v of data.errors || []) {
          const m = v?.message || "";
          if (m.includes("You have already retweeted this Tweet")) {
            console.info("你已转发过");
            return rsetID;
          } else if (m.includes("(187)")) {
            console.info("无法重复引用");
            return rsetID;
          }
          msg += m + ";";
        }
        throw new Error(msg || "unknown error");
      }
      console.info("转发成功");
      return rsetID;
    } catch (err) {
      console.error("引用推文调用失败: ", err);
      throw err;
    }
  }

  GetToken(): string {
    const re = /ct0=([^;]+)/;
    const match = this.ct0.match(re);
    if (match && match[1]) return match[1];
    return "";
  }

  async CreateTweet(content: string, replyID: string = ""): Promise<string> {
    const apiURL =
      "https://twitter.com/i/api/graphql/SoVnbfCycZ7fERGCwpZkYA/CreateTweet";

    let variables: any = {
      tweet_text: content,
      dark_request: false,
      media: { media_entities: [] as any[], possibly_sensitive: false },
      semantic_annotation_ids: [] as any[],
    };

    if (replyID) {
      variables = {
        ...variables,
        reply: { exclude_reply_user_ids: [] as any[] },
      };
    }

    const jsonData = {
      variables: variables,
      features: {
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: false,
        tweet_awards_web_tipping_enabled: false,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        responsive_web_media_download_video_enabled: false,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_enhance_cards_enabled: false,
      },
      queryId: "SoVnbfCycZ7fERGCwpZkYA",
    };

    const headers = {
      ...this.getHeaderMap(),
      "Content-Type": "application/json",
    };

    try {
      const resp = await this.client.post(apiURL, JSON.stringify(jsonData), {
        headers,
        validateStatus: () => true,
      });
      const response = resp.data as CreateTweetResp;

      if (Array.isArray(response?.errors) && response.errors.length > 0) {
        const errMsg = response.errors[0].message || "unknown";
        console.error(
          `[*******] 发推失败: content: ${content}, error: ${errMsg}`,
        );
        throw new Error(errMsg);
      }

      const restID =
        response?.data?.create_tweet?.tweet_results?.result?.rest_id || "";
      const screenName =
        response?.data?.create_tweet?.tweet_results?.result?.core?.user_results
          ?.result?.legacy?.screen_name || "";
      const twitterURL = `https://twitter.com/${screenName}/status/${restID}`;
      console.info(`[${content}*******] 发推成功`);
      return twitterURL;
    } catch (err) {
      throw err;
    }
  }

  async UserSettingInfo(): Promise<any | null> {
    const uri = "https://api.x.com/1.1/account/settings.json";
    const headers = this.getHeaderMap();
    try {
      const resp = await this.client.get(uri, {
        headers,
        validateStatus: () => true,
      });
      return resp.data;
    } catch (err) {
      console.error("获取用户信息失败: ", err);
      throw err;
    }
  }
}
