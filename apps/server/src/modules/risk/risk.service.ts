import { Injectable } from '@nestjs/common';
import { DEFAULT_SENSITIVE_WORDS } from './sensitive-words';
import { ErrorCode } from '../../common/error-codes';
import { BusinessException } from '../../common/exceptions/business.exception';

@Injectable()
export class RiskService {
  private words = [...DEFAULT_SENSITIVE_WORDS];

  /** 敏感词检测，命中则抛异常 */
  assertClean(text: string | null | undefined, field = '内容') {
    if (!text) return;
    const hit = this.words.find((w) => text.includes(w));
    if (hit) {
      throw new BusinessException(
        ErrorCode.SENSITIVE_CONTENT,
        `${field}包含敏感词「${hit}」，请修改后重试`,
      );
    }
  }

  filter(text: string): string {
    let result = text;
    for (const w of this.words) {
      result = result.split(w).join('*'.repeat(w.length));
    }
    return result;
  }

  /** 简单异常订单检测：同学生短时间大量下单 */
  assertOrderFrequency(recentOrderCount: number, maxPerHour = 10) {
    if (recentOrderCount >= maxPerHour) {
      throw new BusinessException(ErrorCode.BAD_REQUEST, '下单过于频繁，请稍后再试');
    }
  }
}
