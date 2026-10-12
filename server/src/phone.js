// Normalises Kenyan mobile numbers (07…, 01…, +2547…, 2541…) to the 2547XXXXXXXX form Daraja expects.
export function normalizeKenyanPhone(input) {
  const digits = String(input ?? "").replace(/[\s\-().]/g, "").replace(/^\+/, "");
  let local;
  if (/^254[17]\d{8}$/.test(digits)) local = digits.slice(3);
  else if (/^0[17]\d{8}$/.test(digits)) local = digits.slice(1);
  else if (/^[17]\d{8}$/.test(digits)) local = digits;
  else return null;
  return `254${local}`;
}
