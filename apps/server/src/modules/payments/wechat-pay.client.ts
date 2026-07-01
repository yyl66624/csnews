import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';

export interface JsapiOrderResult {
  prepayId: string;
  paymentParams: {
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: 'RSA';
    paySign: string;
  };
}

export interface NotifyResource {
  algorithm: string;
  ciphertext: string;
  associated_data: string;
  nonce: string;
  original_type?: string;
}

@Injectable()
export class WechatPayClient {
  private readonly logger = new Logger(WechatPayClient.name);
  private readonly apiBase = 'https://api.mch.weixin.qq.com';

  constructor(private config: ConfigService) {}

  isConfigured(): boolean {
    return this.getConfigStatus().ready;
  }

  /** P0#1 支付配置检查（不含密钥明文） */
  getConfigStatus() {
    const missing: string[] = [];
    if (!this.config.get('WX_APPID') || this.config.get('WX_APPID') === 'your_wx_appid') {
      missing.push('WX_APPID');
    }
    if (!this.getMchId() || this.getMchId() === 'your_mch_id') missing.push('WX_MCH_ID');
    if (!this.getSerialNo()) missing.push('WX_MCH_SERIAL_NO');
    if (!this.getApiV3Key()) missing.push('WX_API_V3_KEY');
    if (!this.getPrivateKey()) missing.push('WX_MCH_PRIVATE_KEY 或 WX_MCH_PRIVATE_KEY_PATH');
    if (!this.config.get('WX_NOTIFY_URL')) missing.push('WX_NOTIFY_URL');

    return {
      ready: missing.length === 0,
      mode: missing.length === 0 ? 'wechat_v3' : 'mock',
      missing,
      notifyUrl: this.config.get('WX_NOTIFY_URL') || null,
      mchId: this.getMchId() ? `${String(this.getMchId()).slice(0, 4)}****` : null,
    };
  }

  /** JSAPI 统一下单 */
  async createJsapiOrder(params: {
    description: string;
    outTradeNo: string;
    totalAmountYuan: number;
    openid: string;
  }): Promise<JsapiOrderResult> {
    const appId = this.config.get<string>('WX_APPID')!;
    const mchId = this.getMchId()!;
    const notifyUrl = this.config.get<string>('WX_NOTIFY_URL')!;

    const body = JSON.stringify({
      appid: appId,
      mchid: mchId,
      description: params.description,
      out_trade_no: params.outTradeNo,
      notify_url: notifyUrl,
      amount: {
        total: Math.round(params.totalAmountYuan * 100),
        currency: 'CNY',
      },
      payer: { openid: params.openid },
    });

    const path = '/v3/pay/transactions/jsapi';
    const res = await this.request('POST', path, body);
    const prepayId = res.prepay_id as string;

    return {
      prepayId,
      paymentParams: this.buildMiniProgramPayParams(prepayId),
    };
  }

  /** 查询订单支付状态 */
  async queryByOutTradeNo(outTradeNo: string): Promise<{ tradeState: string; transactionId?: string }> {
    const mchId = this.getMchId()!;
    const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${mchId}`;
    const res = await this.request('GET', path, '');
    return {
      tradeState: res.trade_state as string,
      transactionId: res.transaction_id as string | undefined,
    };
  }

  /** 申请退款 */
  async createRefund(params: {
    outTradeNo: string;
    outRefundNo: string;
    totalYuan: number;
    refundYuan: number;
    reason?: string;
  }) {
    const body = JSON.stringify({
      out_trade_no: params.outTradeNo,
      out_refund_no: params.outRefundNo,
      reason: params.reason || '用户申请退款',
      amount: {
        refund: Math.round(params.refundYuan * 100),
        total: Math.round(params.totalYuan * 100),
        currency: 'CNY',
      },
    });
    return this.request('POST', '/v3/refund/domestic/refunds', body);
  }

  /** 请求分账 */
  async createProfitSharing(params: {
    transactionId: string;
    outOrderNo: string;
    receivers: Array<{ type: string; account: string; amount: number; description: string }>;
  }) {
    const body = JSON.stringify({
      appid: this.config.get<string>('WX_APPID'),
      transaction_id: params.transactionId,
      out_order_no: params.outOrderNo,
      unfreeze_unsplit: true,
      receivers: params.receivers,
    });
    return this.request('POST', '/v3/profitsharing/orders', body);
  }

  /** 解密回调 resource */
  decryptNotifyResource(resource: NotifyResource): Record<string, unknown> {
    const apiV3Key = this.getApiV3Key()!;
    const key = Buffer.from(apiV3Key, 'utf8');
    const buf = Buffer.from(resource.ciphertext, 'base64');
    const authTag = buf.subarray(buf.length - 16);
    const data = buf.subarray(0, buf.length - 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(resource.nonce, 'utf8'));
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
    const decoded = decipher.update(data, undefined, 'utf8') + decipher.final('utf8');
    return JSON.parse(decoded);
  }

  buildMiniProgramPayParams(prepayId: string) {
    const appId = this.config.get<string>('WX_APPID')!;
    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const packageStr = `prepay_id=${prepayId}`;
    const message = `${appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
    const paySign = this.sign(message);

    return {
      timeStamp,
      nonceStr,
      package: packageStr,
      signType: 'RSA' as const,
      paySign,
    };
  }

  private async request(method: string, path: string, body: string) {
    const url = `${this.apiBase}${path}`;
    const authorization = this.buildAuthorization(method, path, body);

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authorization,
      },
      body: method === 'GET' ? undefined : body,
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        this.logger.error(`微信支付响应解析失败: ${text}`);
      }
    }

    if (!res.ok) {
      const msg = (json.message as string) || text || res.statusText;
      throw new Error(`微信支付 API 错误(${res.status}): ${msg}`);
    }

    return json;
  }

  private buildAuthorization(method: string, path: string, body: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`;
    const signature = this.sign(message);
    return `WECHATPAY2-SHA256-RSA2048 mchid="${this.getMchId()}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.getSerialNo()}"`;
  }

  private sign(message: string): string {
    const privateKey = this.getPrivateKey();
    if (!privateKey) throw new Error('商户私钥未配置');
    return crypto.createSign('RSA-SHA256').update(message).sign(privateKey, 'base64');
  }

  private getMchId() {
    return this.config.get<string>('WX_MCH_ID');
  }

  private getSerialNo() {
    return this.config.get<string>('WX_MCH_SERIAL_NO');
  }

  private getApiV3Key() {
    return this.config.get<string>('WX_API_V3_KEY');
  }

  private getPrivateKey(): string | null {
    const inline = this.config.get<string>('WX_MCH_PRIVATE_KEY');
    if (inline) return inline.replace(/\\n/g, '\n');
    const keyPath = this.config.get<string>('WX_MCH_PRIVATE_KEY_PATH');
    if (keyPath && fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8');
    }
    return null;
  }
}
