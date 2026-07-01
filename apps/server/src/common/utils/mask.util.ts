/** 敏感信息脱敏（P0#4） */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  if (phone.length < 7) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function maskIdCard(idCard: string | null | undefined): string | null {
  if (!idCard) return null;
  if (idCard.length <= 8) return idCard;
  return idCard.slice(0, 4) + '*'.repeat(Math.min(idCard.length - 8, 10)) + idCard.slice(-4);
}

export function maskName(name: string | null | undefined): string | null {
  if (!name) return null;
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}
