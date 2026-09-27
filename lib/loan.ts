export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export type LoanKind = 'personal' | 'business';
export function validateDetails(data: { kind: string; name: string; phone: string; nationalId: string; guarantorName: string; guarantorPhone: string; amount: string; business: string }) {
  if (!['personal', 'business'].includes(data.kind)) return 'Choose a loan type.';
  if (data.name.trim().length < 2 || data.name.length > 100) return 'Enter your full name (2–100 characters).';
  if (!/^\+?[0-9\s()-]{7,25}$/.test(data.phone.trim()) || data.phone.replace(/\D/g, '').length < 7) return 'Enter a valid phone number.';
  const cleanedNationalId = data.nationalId.replace(/\s+/g, '').replace(/-/g, '');
  if (!/^\d{8,20}$/.test(cleanedNationalId)) return 'Enter a valid national ID number.';
  if (data.guarantorName.trim().length < 2 || data.guarantorName.length > 100) return 'Enter your guarantor full name (2–100 characters).';
  if (!/^\+?[0-9\s()-]{7,25}$/.test(data.guarantorPhone.trim()) || data.guarantorPhone.replace(/\D/g, '').length < 7) return 'Enter a valid guarantor phone number.';
  const amount = Number(data.amount);
  if (!/^\d+(\.\d{1,2})?$/.test(data.amount) || Number.isNaN(amount) || amount < 100000 || amount > 2000000) return 'Loan amount must be between MWK 100,000 and MWK 2,000,000.';
  if (data.kind === 'business' && (data.business.trim().length < 2 || data.business.length > 150)) return 'Enter your business name (2–150 characters).';
  return '';
}
