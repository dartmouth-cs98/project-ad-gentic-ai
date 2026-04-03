import { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import {
  PlusIcon,
  SearchIcon,
  PackageIcon,
  Loader2Icon,
  AlertCircleIcon,
  XIcon,
  ImageIcon,
  TrashIcon,
  UploadIcon,
  ExternalLinkIcon,
  Sun,
  Moon,
} from 'lucide-react';

import { useUser } from '../contexts/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import {
  useProducts,
  useCreateProduct,
  useDeleteProduct,
  useUploadProductImage,
} from '../hooks/useProducts';
import type { Product } from '../types';

const inputClass = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50';
const labelClass = 'block text-sm font-medium mb-1.5';

// ---------- Product Card ----------

function ProductCard({ product, onDelete, onUploadImage }: {
  product: Product;
  onDelete: (p: Product) => void;
  onUploadImage: (p: Product) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group hover:border-foreground/20 transition-colors">
      {/* Image area */}
      <div className="h-40 bg-muted flex items-center justify-center relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="w-7 h-7" />
            <span className="text-xs">No image</span>
          </div>
        )}
        <button
          onClick={() => onUploadImage(product)}
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium"
        >
          <UploadIcon className="w-4 h-4" />
          {product.image_url ? 'Replace Image' : 'Upload Image'}
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
            )}
          </div>
          {product.image_url && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded">
              Image
            </span>
          )}
        </div>

        {product.product_link && (
          <a
            href={product.product_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
          >
            <ExternalLinkIcon className="w-3 h-3" />
            Product link
          </a>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onUploadImage(product)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <ImageIcon className="w-3 h-3" />
            {product.image_url ? 'Replace' : 'Add'} Image
          </button>
          <div className="flex-1" />
          <button
            onClick={() => onDelete(product)}
            className="p-1 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Create Product Modal ----------

function CreateProductModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateProduct();
  const [form, setForm] = useState({ name: '', description: '', product_link: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isCreating = createMutation.isPending;

  const handleCreate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    createMutation.mutate(
      { name: form.name.trim(), description: form.description.trim() || null, product_link: form.product_link.trim() || null },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => !isCreating && onClose()} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Add Product</h2>
          <button onClick={onClose} disabled={isCreating} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
            <input className={inputClass} placeholder="e.g., AirPods Pro 2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={isCreating} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Brief description of the product..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={isCreating} />
          </div>

          <div>
            <label className={labelClass}>Product Link</label>
            <input className={inputClass} placeholder="https://example.com/product" value={form.product_link} onChange={(e) => setForm({ ...form, product_link: e.target.value })} disabled={isCreating} />
          </div>

          <p className="text-xs text-muted-foreground">You can upload a product image after creating the product.</p>
        </div>

        {createMutation.isError && (
          <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
            {(createMutation.error as Error).message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} disabled={isCreating} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isCreating ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Creating...</> : <><PlusIcon className="w-4 h-4" /> Add Product</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Delete Product Modal ----------

function DeleteProductModal({ product, onClose, onConfirm, isLoading }: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-xl p-6">
        <h2 className="text-base font-semibold mb-1">Delete Product</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete <span className="font-medium text-foreground">{product.name}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2Icon className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export function ProductsPage() {
  const { collapsed } = useSidebar();
  const { user } = useUser();
  const businessClientId = user?.client_id;

  const { data: products = [], isLoading, isError, error } = useProducts(businessClientId);
  const deleteMutation = useDeleteProduct();
  const uploadMutation = useUploadProductImage();

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetProduct, setUploadTargetProduct] = useState<Product | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleUploadImage = (product: Product) => {
    setUploadTargetProduct(product);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetProduct) return;
    uploadMutation.mutate(
      { productId: uploadTargetProduct.id, file },
      { onSettled: () => { setUploadTargetProduct(null); if (fileInputRef.current) fileInputRef.current.value = ''; } },
    );
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    deleteMutation.mutate(productToDelete.id, { onSuccess: () => setProductToDelete(null) });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 p-8`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage the products and services you advertise.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Product
            </button>
            <button onClick={toggleTheme} className="p-2 border border-border rounded-lg hover:bg-muted transition-colors" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground"
          />
        </div>

        {/* Upload status banner */}
        {uploadMutation.isPending && (
          <div className="mb-4 flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-lg px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
            <Loader2Icon className="w-4 h-4 animate-spin" />
            Uploading image for {uploadTargetProduct?.name}...
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2Icon className="w-6 h-6 animate-spin mb-3" />
            <p className="text-sm">Loading products...</p>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircleIcon className="w-8 h-8 text-red-500 mb-3" />
            <h2 className="text-base font-semibold mb-1">Failed to load products</h2>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <PackageIcon className="w-8 h-8 text-muted-foreground mb-4" />
            <h2 className="text-base font-semibold mb-1">No products yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Add your first product to start creating campaigns and generating ads.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add your first product
            </button>
          </div>
        )}

        {/* No search results */}
        {!isLoading && !isError && products.length > 0 && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <SearchIcon className="w-8 h-8 text-muted-foreground mb-3" />
            <h2 className="text-base font-semibold mb-1">No products match your search</h2>
            <p className="text-sm text-muted-foreground">Try a different search term.</p>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && !isError && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onDelete={setProductToDelete} onUploadImage={handleUploadImage} />
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelected} />

        {/* Modals */}
        {showCreateModal && <CreateProductModal onClose={() => setShowCreateModal(false)} />}
        {productToDelete && (
          <DeleteProductModal
            product={productToDelete}
            isLoading={deleteMutation.isPending}
            onClose={() => setProductToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </main>
    </div>
  );
}
