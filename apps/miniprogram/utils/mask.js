/** 敏感信息脱敏（P0#4） */
function maskPhone(phone) {
  if (!phone) return '';
  if (phone.length < 7) return phone;
  return String(phone).replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function maskName(name) {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

module.exports = {
  maskPhone: maskPhone,
  maskName: maskName,
};
