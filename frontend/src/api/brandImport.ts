import { apiUrl, authHeaders, formatApiDetail } from './config';
import type {
  BrandImportApplyRequest,
  BrandImportApplyResponse,
  BrandImportLimits,
  BrandImportPreview,
} from '../types/brandImport';

export async function analyzeBrandUrl(url: string): Promise<BrandImportPreview> {
  const res = await fetch(apiUrl('/brand-import/analyze'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ url }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatApiDetail(data.detail, 'Failed to analyze website'));
  }
  return data.preview as BrandImportPreview;
}

export async function applyBrandImport(
  body: BrandImportApplyRequest,
): Promise<BrandImportApplyResponse> {
  const res = await fetch(apiUrl('/brand-import/apply'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatApiDetail(data.detail, 'Failed to apply import'));
  }
  return data as BrandImportApplyResponse;
}

export async function fetchBrandImportLimits(): Promise<BrandImportLimits> {
  const res = await fetch(apiUrl('/brand-import/limits'), {
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(formatApiDetail(data.detail, 'Failed to load import limits'));
  }
  return data as BrandImportLimits;
}
