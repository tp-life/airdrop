// config/EmailConfig.ts
import { EmailConfig as IEmailConfig } from './types';

export class EmailConfig implements IEmailConfig {
  host: string;
  user: string;
  password: string;
  domains: string[];

  constructor(config: Partial<IEmailConfig> = {}) {
    this.host = config.host || '';
    this.user = config.user || '';
    this.password = config.password || '';
    this.domains = config.domains || [];
  }

  validate(): void {
    if (!this.host) throw new Error('Email host is required');
    if (!this.user) throw new Error('Email user is required');
    if (!this.password) throw new Error('Email password is required');
  }
}