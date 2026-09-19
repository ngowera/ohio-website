export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export type LoanKind = 'personal' | 'business';
export function validateDetails(data: { kind: string; name: string; phone: string; amount: string; business: string }) {
  if (!['personal', 'business'].includes(data.kind)) return 'Choose a loan type.';
  if (data.name.trim().length < 2 || data.name.length > 100) return 'Enter your full name (2–100 characters).';
  if (!/^\+?[0-9\s()-]{7,25}$/.test(data.phone.trim()) || data.phone.replace(/\D/g, '').length < 7) return 'Enter a valid phone number.';
  if (!/^\d+(\.\d{1,2})?$/.test(data.amount) || Number(data.amount) <= 0 || Number(data.amount) > 1e12) return 'Enter a valid loan amount greater than zero.';
  if (data.kind === 'business' && (data.business.trim().length < 2 || data.business.length > 150)) return 'Enter your business name (2–150 characters).';
  return '';
}
