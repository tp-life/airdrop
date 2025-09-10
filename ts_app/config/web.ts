// config/WebConfig.ts
import { WebConfig as IWebConfig } from './types';

export class WebConfig implements IWebConfig {
  port: number;

  constructor(config: Partial<IWebConfig> = {}) {
    this.port = config.port || 3000;
  }

  validate(): void {
    if (this.port <= 0 || this.port > 65535) {
      throw new Error('Invalid web port number');
    }
  }
}