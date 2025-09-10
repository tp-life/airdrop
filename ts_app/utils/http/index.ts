import axios, {
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  RawAxiosRequestHeaders,
} from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  proxy?: string; // 例如 "http://127.0.0.1:6152" 或 "http://user:pass@127.0.0.1:6152"
  retry?: {
    retries: number;
    retryDelay: number;
  };
  headers?: RawAxiosRequestHeaders | AxiosHeaders;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: Required<HttpClientOptions["retry"]>;

  constructor(options: HttpClientOptions = {}) {
    const { baseURL, timeout = 5000, proxy, retry } = options;
    const h = options.headers ?? {};
    const ops = {
      baseURL,
      timeout,

      headers: h,
    } as CreateAxiosDefaults;
    if (proxy) {
      ops.httpsAgent = new HttpsProxyAgent(proxy);
    }

    this.axiosInstance = axios.create(ops);

    this.retryConfig = {
      retries: retry?.retries ?? 3,
      retryDelay: retry?.retryDelay ?? 1000,
    };
  }

  private async requestWithRetry<T = any>(
    config: AxiosRequestConfig,
    retriesLeft: number,
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.axiosInstance.request<T>(config);
    } catch (error) {
      if (retriesLeft <= 0) throw error;
      await new Promise((res) => setTimeout(res, this.retryConfig.retryDelay));
      return this.requestWithRetry<T>(config, retriesLeft - 1);
    }
  }

  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    stopFn?: (data: AxiosResponse) => boolean,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      { ...config, method: "GET", url },
      this.retryConfig.retries,
      stopFn,
    );
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    stopFn?: (data: AxiosResponse) => boolean,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      { ...config, method: "POST", url, data },
      this.retryConfig.retries,
      stopFn,
    );
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    stopFn?: (data: AxiosResponse) => boolean,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      { ...config, method: "PUT", url, data },
      this.retryConfig.retries,
      stopFn,
    );
  }

  public async request<T = any>(
    config: AxiosRequestConfig,
    retriesLeft: number = this.retryConfig.retries,
    stopFn: (data: AxiosResponse) => boolean,
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.axiosInstance.request<T>(config);
    } catch (error) {
      if (stopFn && stopFn(error.response)) {
        return error.response;
      }
      if (retriesLeft <= 0) throw error;
      await new Promise((res) => setTimeout(res, this.retryConfig.retryDelay));
      return this.request<T>(config, retriesLeft - 1, stopFn);
    }
  }
}
