import { useMemo, useState } from 'react';
import { analyzeBrandUrl, applyBrandImport } from '../../api/brandImport';
import type { BrandImportPreview } from '../../types/brandImport';

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width={14} height={14} className="prd-spin">
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" width={11} height={11}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

type Props = {
  initialUrl?: string;
  onClose: () => void;
  onApplied: () => void;
};

export function BrandImportModal({ initialUrl = '', onClose, onApplied }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [step, setStep] = useState<'url' | 'preview'>('url');
  const [preview, setPreview] = useState<BrandImportPreview | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Record<string, Set<number>>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, Set<number>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productDescriptionSuggestion = useMemo(() => {
    if (!preview) return '';
    const props = preview.brand.value_propositions;
    return props.length > 0 ? props.join(' ') : '';
  }, [preview]);

  const handleAnalyze = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeBrandUrl(url.trim());
      setPreview(result);
      const indexes = new Set(result.products.map((_, i) => i));
      setSelectedProducts(indexes);
      const images: Record<string, Set<number>> = {};
      result.products.forEach((p, i) => {
        if (p.image_candidates.length > 0) {
          images[String(i)] = new Set([0]);
        }
      });
      setSelectedImages(images);
      setBrokenImages({});
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyze failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (idx: number) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleImage = (productIdx: number, imageIdx: number) => {
    const key = String(productIdx);
    setSelectedImages((prev) => {
      const next = new Set(prev[key] ?? []);
      if (next.has(imageIdx)) next.delete(imageIdx);
      else next.add(imageIdx);
      return { ...prev, [key]: next };
    });
  };

  const handleApply = async () => {
    if (!preview || loading) return;
    setError(null);
    setLoading(true);
    try {
      const selected_images: Record<string, number[]> = {};
      for (const idx of selectedProducts) {
        const key = String(idx);
        const set = selectedImages[key];
        if (set && set.size > 0) {
          selected_images[key] = Array.from(set);
        }
      }
      const result = await applyBrandImport({
        preview,
        create_products: selectedProducts.size > 0,
        selected_product_indexes: Array.from(selectedProducts),
        selected_images,
        merge_onboarding_traits: false,
      });
      const imageWarnings = result.products_created.flatMap((p) =>
        p.image_errors.map((err) => `${p.name}: ${err}`),
      );
      if (imageWarnings.length > 0) {
        setError(
          `Import saved, but some images failed (${imageWarnings.length}). Check products and upload images manually.`,
        );
        onApplied();
        return;
      }
      onApplied();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="as-modal-overlay" onClick={() => !loading && onClose()}>
      <div
        className="as-modal"
        style={{ width: 'min(640px, 100%)', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— IMPORT</div>
            <div className="as-modal-title">From website</div>
          </div>
          <button className="as-modal-close" onClick={onClose} disabled={loading} type="button">
            <XIcon />
          </button>
        </div>

        <div className="as-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 'url' && (
            <>
              <p style={{ fontSize: 13, color: 'var(--as-ink-2)', lineHeight: 1.5 }}>
                We fetch your public pages and extract products, brand tone, FAQs, and more. Review before saving.
              </p>
              <div className="as-field">
                <label className="as-field-label">Business URL</label>
                <input
                  className="as-input"
                  placeholder="https://yourcompany.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {step === 'preview' && preview && (
            <>
              {preview.brand.name && (
                <div>
                  <div className="as-field-label">Brand</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{preview.brand.name}</div>
                  {preview.brand.tone && (
                    <div style={{ fontSize: 12, color: 'var(--as-ink-2)' }}>Tone: {preview.brand.tone}</div>
                  )}
                </div>
              )}

              {productDescriptionSuggestion && (
                <p style={{ fontSize: 13, color: 'var(--as-ink-2)' }}>
                  {productDescriptionSuggestion.slice(0, 280)}
                  {productDescriptionSuggestion.length > 280 ? '…' : ''}
                </p>
              )}

              {preview.products.length > 0 && (
                <div>
                  <div className="as-field-label">Products to create</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {preview.products.map((p, idx) => (
                      <label
                        key={`${p.name}-${idx}`}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: 10,
                          border: '1px solid var(--as-border)',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(idx)}
                          onChange={() => toggleProduct(idx)}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                          {p.pricing?.display && (
                            <div style={{ fontSize: 12, color: 'var(--as-ink-2)' }}>{p.pricing.display}</div>
                          )}
                          {p.image_candidates.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {p.image_candidates.map((img, imgIdx) => {
                                if (brokenImages[String(idx)]?.has(imgIdx)) return null;
                                return (
                                <label key={img.url} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <input
                                    type="checkbox"
                                    disabled={!selectedProducts.has(idx)}
                                    checked={selectedImages[String(idx)]?.has(imgIdx) ?? false}
                                    onChange={() => toggleImage(idx, imgIdx)}
                                  />
                                  <img
                                    src={img.url}
                                    alt={img.alt ?? ''}
                                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
                                    onError={() => {
                                      setBrokenImages((prev) => {
                                        const key = String(idx);
                                        const next = new Set(prev[key] ?? []);
                                        next.add(imgIdx);
                                        return { ...prev, [key]: next };
                                      });
                                      setSelectedImages((prev) => {
                                        const key = String(idx);
                                        const next = new Set(prev[key] ?? []);
                                        next.delete(imgIdx);
                                        return { ...prev, [key]: next };
                                      });
                                    }}
                                  />
                                </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <p style={{ fontSize: 13, color: '#c44' }}>{error}</p>
          )}
        </div>

        <div className="as-modal-foot">
          <button type="button" className="as-btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          {step === 'url' ? (
            <button
              type="button"
              className="as-btn-solid"
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
            >
              {loading ? <><SpinnerIcon /> Analyzing…</> : 'Analyze'}
            </button>
          ) : (
            <button
              type="button"
              className="as-btn-solid"
              onClick={handleApply}
              disabled={loading}
            >
              {loading ? <><SpinnerIcon /> Saving…</> : 'Apply import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Exported for onboarding: analyze only, returns preview. */
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
