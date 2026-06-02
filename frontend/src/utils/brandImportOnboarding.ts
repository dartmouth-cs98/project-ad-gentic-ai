import { analyzeBrandUrl } from '../api/brandImport';
import type { BrandImportPreview } from '../types/brandImport';

/** Analyze only; used by onboarding autofill. */
export async function analyzeBrandUrlForOnboarding(url: string): Promise<BrandImportPreview> {
  return analyzeBrandUrl(url);
}

export function brandPreviewToOnboardingFields(preview: BrandImportPreview): {
  productDescription: string;
  targetCustomer: string;
} {
  const productDescription =
    preview.brand.value_propositions.join(' ') ||
    preview.products[0]?.description ||
    '';
  const targetCustomer = preview.brand.target_customer_assumptions || '';
  return { productDescription, targetCustomer };
}
