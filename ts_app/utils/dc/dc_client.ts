import axios, { AxiosInstance } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import {
  BlockedError,
  DiscordAuthError,
  DiscordError,
} from "../../types/error";

export class DiscordConfig {
  API_VERSION = "v9";
  CLIENT_ID = "";
  GUILD_ID = "1284288403638325318";
  REDIRECT_URI = "";
  BASE_URL = "https://discord.com";
  API_URL = `${this.BASE_URL}/api/${this.API_VERSION}`;
  OAUTH_URL = `${this.BASE_URL}/oauth2/authorize`;
  STATE = "eyJ0eXBlIjoiQ09OTkVDVF9ESVNDT1JEIn0=";
  SUPER_PROPERTIES =
    "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6InJ1IiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyOS4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTI5LjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2FwcC9pbnZpdGUtd2l0aC1ndWlsZC1vbmJvYXJkaW5nL2lua29uY2hhaW4iLCJyZWZlcnJpbmdfZG9tYWluIjoiZGlzY29yZC5jb20iLCJyZWZlcnJlcl9jdXJyZW50IjoiaHR0cHM6Ly9xdWVzdC5zb21uaWEubmV0d29yay8iLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiJxdWVzdC5zb21uaWEubmV0d29yayIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjM3MDUzMywiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbCwiaGFzX2NsaWVudF9tb2RzIjpmYWxzZX0=";
}

export class DiscordClient {
  private token: string;
  private proxy?: string;
  private config: DiscordConfig;
  private session: AxiosInstance;
  private _authHeadersCache?: Record<string, string>;

  constructor(token: string, proxy?: string, config = new DiscordConfig()) {
    if (!token) throw new DiscordError("Discord token not provided");
    this.token = token;
    this.proxy = proxy;
    this.config = config;

    this.session = axios.create({
      timeout: 30000,
      httpsAgent: proxy ? new HttpsProxyAgent(proxy) : undefined,
      validateStatus: () => true, // We'll manually check status
    });
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (this._authHeadersCache) return this._authHeadersCache;

    const headers = {
      authority: "discord.com",
      accept: "application/json",
      authorization: this.token,
      "content-type": "application/json",
      dnt: "1",
      origin: this.config.BASE_URL,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-super-properties": this.config.SUPER_PROPERTIES,
      "x-requested-with": "XMLHttpRequest",
    };
    this._authHeadersCache = headers;
    return headers;
  }

  private getOAuthParams(): Record<string, string> {
    return {
      client_id: this.config.CLIENT_ID,
      response_type: "code",
      redirect_uri: this.config.REDIRECT_URI,
      scope: "identify",
      state: this.config.STATE,
    };
  }

  private getOAuthReferer(params: Record<string, string>): string {
    const qs = new URLSearchParams(params).toString();
    return `https://discord.com/oauth2/authorize?${qs}`;
  }

  private extractAuthCode(location: string): string | null {
    const parsed = new URL(location);
    const code = parsed.searchParams.get("code");
    return code || null;
  }

  async requestAuthorization(
    locationContext: Record<string, any> = {},
  ): Promise<string> {
    try {
      const oauthParams = this.getOAuthParams();
      const oauthReferer = this.getOAuthReferer(oauthParams);
      const headers = await this.getAuthHeaders();
      headers["referer"] = oauthReferer;

      const response = await this.session.post(
        `${this.config.API_URL}/oauth2/authorize`,
        {
          permissions: "0",
          authorize: true,
          integration_type: 0,
          location_context: locationContext,
        },
        {
          headers,
          params: oauthParams,
          maxRedirects: 0,
          validateStatus: () => true,
        },
      );

      const status = response.status;
      const data = response.data;

      if (status === 401 || status === 403) {
        throw new BlockedError(
          `Invalid Discord token: ${JSON.stringify(data)}`,
        );
      } else if (status !== 200) {
        throw new DiscordAuthError(
          `Authorization request failed: ${JSON.stringify(data)}`,
        );
      }

      const location = response.headers["location"];
      const code = location ? this.extractAuthCode(location) : null;
      if (!code) {
        throw new DiscordAuthError(
          `Failed to extract authorization code. Response: ${JSON.stringify(data)}`,
        );
      }

      return code;
    } catch (err: any) {
      throw new DiscordAuthError(
        `Authorization process failed: ${err.message}`,
      );
    }
  }
}
