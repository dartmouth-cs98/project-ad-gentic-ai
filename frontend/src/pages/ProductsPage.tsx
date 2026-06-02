// ProductsPage — Swiss/Linear editorial theme
import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../components/layout/AppShell';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { BrandImportModal } from '../components/products/BrandImportModal';
import {
  useProducts,
  useCreateProduct,
  useDeleteProduct,
  useUploadProductImages,
  useDeleteProductImage,
  PRODUCTS_KEY,
} from '../hooks/useProducts';
import type { Product } from '../types';

const MAX_IMAGES = 5;


function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={14} height={14}>
      <path d="M7 2v10M2 7h10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={13} height={13}>
      <circle cx="5.5" cy="5.5" r="4" />
      <path d="M9 9l3.5 3.5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
      <rect x="3" y="3" width="18" height="18" />
      <path d="M3 15l5-5 4 4 3-3 6 6" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={11} height={11}>
      <path d="M2 9h8M6 2v6M4 4l2-2 2 2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
      <path d="M2 4h10M5 4V2h4v2M4 4l.7 7.3a.5.5 0 00.5.7h3.6a.5.5 0 00.5-.7L10 4" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={10} height={10}>
      <path d="M5 2H2v8h8V7M7 2h3v3M10 2L5.5 6.5" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
      <path d="M8 2L3 8h4l-1 4 5-6H7z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={11} height={11}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" width={36} height={36}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={14} height={14} className="prd-spin">
      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
    </svg>
  );
}


function ProductCard({ product, onUploadImages, onDeleteImage, onDelete }: {
  product: Product;
  onUploadImages: (p: Product) => void;
  onDeleteImage: (p: Product, blobName: string) => void;
  onDelete: (p: Product) => void;
}) {
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const hasImages = product.image_urls.length > 0;
  const clampedIdx = hasImages ? Math.min(imgIdx, product.image_urls.length - 1) : 0;
  const currentUrl = hasImages ? product.image_urls[clampedIdx] : null;
  const currentBlob = hasImages ? product.image_names[clampedIdx] : null;
  const canAddMore = product.image_urls.length < MAX_IMAGES;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + product.image_urls.length) % product.image_urls.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % product.image_urls.length);
  };

  return (
    <div className="prd-card">
      {/* Media */}
      <div className="prd-card-media">
        <div className="prd-card-stripes" />

        {currentUrl ? (
          <img src={currentUrl} alt={product.name} className="prd-card-img" />
        ) : (
          <div className="prd-card-no-img">
            <ImageIcon />
            <span>NO IMAGE</span>
          </div>
        )}

        {/* Upload button */}
        {canAddMore && (
          <button
            className="prd-card-media-btn upload"
            onClick={() => onUploadImages(product)}
          >
            <UploadIcon />
            {hasImages ? 'ADD' : 'UPLOAD'}
          </button>
        )}

        {/* Delete current image */}
        {currentBlob && (
          <button
            className="prd-card-media-btn del-img"
            onClick={(e) => { e.stopPropagation(); onDeleteImage(product, currentBlob); }}
          >
            <XIcon />
          </button>
        )}

        {/* Carousel controls */}
        {product.image_urls.length > 1 && (
          <>
            <button className="prd-card-carousel-btn prev" onClick={prev}>‹</button>
            <button className="prd-card-carousel-btn next" onClick={next}>›</button>
            <div className="prd-card-dots">
              {product.image_urls.map((_, i) => (
                <span key={i} className={`prd-card-dot${i === clampedIdx ? ' on' : ''}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Body */}
      <div className="prd-card-body" style={{ position: 'relative' }}>
        <button
          className="prd-card-del"
          onClick={() => onDelete(product)}
          aria-label="Delete product"
        >
          <TrashIcon />
        </button>
        <div className="prd-card-name">{product.name}</div>

        {product.description && (
          <div className="prd-card-desc">{product.description}</div>
        )}

        <div className="prd-card-meta">
          {hasImages && (
            <span className="prd-card-meta-tag">
              {product.image_urls.length} IMG{product.image_urls.length !== 1 ? 'S' : ''}
            </span>
          )}
          {product.product_link && (
            <a
              href={product.product_link}
              target="_blank"
              rel="noopener noreferrer"
              className="prd-card-link"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalIcon />
              LINK
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="prd-card-actions">
          {canAddMore && (
            <button className="prd-card-action-btn" onClick={() => onUploadImages(product)}>
              <UploadIcon />
              {hasImages ? 'Add Image' : 'Upload'}
            </button>
          )}
          {!canAddMore && (
            <span style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 9.5,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--as-ink-3)',
              padding: '5px 8px',
            }}>
              MAX IMAGES
            </span>
          )}
          <div className="prd-card-spacer" />
          <button
            className="prd-card-action-btn"
            onClick={() => navigate(`/generate?productId=${product.id}`)}
            title="Set up a campaign for this product"
          >
            Campaign
          </button>
          <button
            className="prd-card-action-btn"
            onClick={() => navigate(`/generate?productId=${product.id}&express=1`)}
            title="Generate ads immediately with express mode"
            style={{ color: 'var(--as-accent)' }}
          >
            <ZapIcon />
            Express
          </button>
        </div>

      </div>
    </div>
  );
}


function CreateProductModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateProduct();
  const [form, setForm] = useState({ name: '', description: '', product_link: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isCreating = createMutation.isPending;

  const handleCreate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    createMutation.mutate(
      { name: form.name.trim(), description: form.description.trim() || null, product_link: form.product_link.trim() || null },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="as-modal-overlay" onClick={() => !isCreating && onClose()}>
      <div className="as-modal" style={{ width: 'min(480px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— NEW PRODUCT</div>
            <div className="as-modal-title">Add Product</div>
          </div>
          <button className="as-modal-close" onClick={onClose} disabled={isCreating}>
            <XIcon />
          </button>
        </div>

        <div className="as-modal-body">
          <div className="as-field">
            <label className="as-field-label">
              Name <span className="as-field-required">*</span>
            </label>
            <input
              className="as-input"
              placeholder="e.g., Aurora Daypack 32L"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isCreating}
            />
            {errors.name && (
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, color: '#c44', letterSpacing: '0.06em' }}>
                {errors.name}
              </span>
            )}
          </div>

          <div className="as-field">
            <label className="as-field-label">Description</label>
            <textarea
              className="as-textarea"
              rows={3}
              placeholder="Brief description of the product…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={isCreating}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="as-field">
            <label className="as-field-label">Product Link</label>
            <input
              className="as-input"
              placeholder="https://example.com/product"
              value={form.product_link}
              onChange={(e) => setForm({ ...form, product_link: e.target.value })}
              disabled={isCreating}
            />
          </div>

          <span style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'var(--as-ink-3)',
            textTransform: 'uppercase',
          }}>
            Upload up to {MAX_IMAGES} images after creating the product.
          </span>
        </div>

        {createMutation.isError && (
          <div style={{
            margin: '0 24px 16px',
            padding: '10px 12px',
            border: '1px solid rgba(200,50,50,0.3)',
            background: 'rgba(200,50,50,0.06)',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11,
            color: '#c44',
            letterSpacing: '0.04em',
          }}>
            {(createMutation.error as Error).message}
          </div>
        )}

        <div className="as-modal-foot">
          <button
            className="as-btn-ghost"
            onClick={onClose}
            disabled={isCreating}
            style={{ padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            className="as-btn-solid"
            onClick={handleCreate}
            disabled={isCreating}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px' }}
          >
            {isCreating ? <><SpinnerIcon /> Creating…</> : <><PlusIcon /> Add Product</>}
          </button>
        </div>
      </div>
    </div>
  );
}


function DeleteProductModal({ product, onClose, onConfirm, isLoading }: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="as-modal-overlay" onClick={onClose}>
      <div className="as-modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="as-modal-head">
          <div>
            <div className="as-modal-eyebrow">— DESTRUCTIVE ACTION</div>
            <div className="as-modal-title">Delete Product</div>
          </div>
          <button className="as-modal-close" onClick={onClose} disabled={isLoading}>
            <XIcon />
          </button>
        </div>

        <div className="as-modal-body">
          <p style={{ fontSize: 14, color: 'var(--as-ink-2)', lineHeight: 1.55 }}>
            Delete <span className="danger-name">{product.name}</span>? This cannot be undone.
          </p>
        </div>

        <div className="as-modal-foot">
          <button
            className="as-btn-ghost"
            onClick={onClose}
            disabled={isLoading}
            style={{ padding: '8px 16px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 18px',
              background: '#c44',
              color: '#fff',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? <><SpinnerIcon /> Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}


export function ProductsPage() {
  const { user } = useUser();
  const businessClientId = user?.client_id;
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, isError, error } = useProducts(businessClientId);
  const deleteMutation = useDeleteProduct();
  const uploadMutation = useUploadProductImages();
  const deleteImageMutation = useDeleteProductImage();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetProduct, setUploadTargetProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleUploadImages = (product: Product) => {
    setUploadTargetProduct(product);
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !uploadTargetProduct) return;
    uploadMutation.mutate(
      { productId: uploadTargetProduct.id, files },
      { onSettled: () => { setUploadTargetProduct(null); if (fileInputRef.current) fileInputRef.current.value = ''; } },
    );
  };

  const handleDeleteImage = (product: Product, blobName: string) => {
    deleteImageMutation.mutate({ productId: product.id, blobName });
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    deleteMutation.mutate(productToDelete.id, { onSuccess: () => setProductToDelete(null) });
  };

  return (
    <AppShell>
      <div className="as-main">
        <div className="as-canvas">

          {/* Page header */}
          <div className="as-page-head">
            <div>
              <span className="as-eyebrow">— CATALOGUE</span>
              <h1>
                Products
                {products.length > 0 && (
                  <span className="muted"> · {products.length}</span>
                )}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="as-btn-ghost"
                onClick={() => setShowImportModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px' }}
              >
                Import from website
              </button>
              <button
                className="as-btn-solid"
                onClick={() => setShowCreateModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}
              >
                <PlusIcon />
                Add Product
              </button>
            </div>
          </div>

          {/* Upload banner */}
          {uploadMutation.isPending && (
            <div className="prd-upload-banner">
              <SpinnerIcon />
              UPLOADING — {uploadTargetProduct?.name}
            </div>
          )}

          {/* Toolbar */}
          <div className="prd-toolbar">
            <div className="prd-search-wrap">
              <SearchIcon />
              <input
                type="text"
                className="prd-search"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="prd-state">
              <SpinnerIcon />
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="prd-state">
              <div className="prd-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" width={36} height={36}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5M12 15.5v1" />
                </svg>
              </div>
              <h2>Failed to load products</h2>
              <p>{(error as Error).message}</p>
            </div>
          )}

          {/* Empty — no products at all */}
          {!isLoading && !isError && products.length === 0 && (
            <div className="prd-state">
              <div className="prd-state-icon">
                <PackageIcon />
              </div>
              <h2>No products yet</h2>
              <p>Add your first product to start creating campaigns and generating ads.</p>
              <button
                className="as-btn-solid"
                onClick={() => setShowCreateModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}
              >
                <PlusIcon />
                Add your first product
              </button>
            </div>
          )}

          {/* Empty — search filtered everything */}
          {!isLoading && !isError && products.length > 0 && filteredProducts.length === 0 && (
            <div className="prd-state">
              <div className="prd-state-icon">
                <SearchIcon />
              </div>
              <h2>No matches</h2>
              <p>No products match "{searchQuery}".</p>
            </div>
          )}

          {/* Product grid */}
          {!isLoading && !isError && filteredProducts.length > 0 && (
            <div className="prd-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUploadImages={handleUploadImages}
                  onDeleteImage={handleDeleteImage}
                  onDelete={setProductToDelete}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: 'none' }}
        onChange={handleFilesSelected}
      />

      {showCreateModal && <CreateProductModal onClose={() => setShowCreateModal(false)} />}
      {showImportModal && (
        <BrandImportModal
          onClose={() => setShowImportModal(false)}
          onApplied={() => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })}
        />
      )}
      {productToDelete && (
        <DeleteProductModal
          product={productToDelete}
          isLoading={deleteMutation.isPending}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </AppShell>
  );
}
