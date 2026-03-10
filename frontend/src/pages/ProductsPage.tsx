import { useState, useRef } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
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
} from 'lucide-react';

import { useUser } from '../contexts/UserContext';
import {
  useProducts,
  useCreateProduct,
  useDeleteProduct,
  useUploadProductImage,
} from '../hooks/useProducts';
import type { Product } from '../types';

// ---------- Product Card ----------

function ProductCard({
  product,
  onDelete,
  onUploadImage,
}: {
  product: Product;
  onDelete: (p: Product) => void;
  onUploadImage: (p: Product) => void;
}) {
  return (
    <Card variant="default" padding="none" className="overflow-hidden group">
      {/* Image area */}
      <div className="h-40 bg-slate-100 flex items-center justify-center relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">No image</span>
          </div>
        )}
        {/* Upload overlay on hover */}
        <button
          onClick={() => onUploadImage(product)}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium"
        >
          <UploadIcon className="w-4 h-4" />
          {product.image_url ? 'Replace Image' : 'Upload Image'}
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 text-sm truncate">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
          {product.image_url && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-50 text-green-600 text-[10px] font-medium rounded">
              Image
            </span>
          )}
        </div>

        {product.product_link && (
          <a
            href={product.product_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
          >
            <ExternalLinkIcon className="w-3 h-3" />
            Product link
          </a>
        )}

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => onUploadImage(product)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ImageIcon className="w-3 h-3" />
            {product.image_url ? 'Replace' : 'Add'} Image
          </button>
          <div className="flex-1" />
          <button
            onClick={() => onDelete(product)}
            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ---------- Create Product Modal ----------

function CreateProductModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateProduct();
  const [form, setForm] = useState({
    name: '',
    description: '',
    product_link: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isCreating = createMutation.isPending;

  const handleCreate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createMutation.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || null,
        product_link: form.product_link.trim() || null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => !isCreating && onClose()}
      />

      <Card
        variant="elevated"
        padding="lg"
        className="relative w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Add Product</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
            disabled={isCreating}
          >
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Product Name *"
            placeholder="e.g., AirPods Pro 2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            disabled={isCreating}
          />

          <Textarea
            label="Description"
            placeholder="Brief description of the product..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isCreating}
          />

          <Input
            label="Product Link"
            placeholder="https://example.com/product"
            value={form.product_link}
            onChange={(e) => setForm({ ...form, product_link: e.target.value })}
            disabled={isCreating}
          />

          <p className="text-xs text-slate-500">
            You can upload a product image after creating the product.
          </p>
        </div>

        {createMutation.isError && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {(createMutation.error as Error).message}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            leftIcon={<PlusIcon className="w-4 h-4" />}
            isLoading={isCreating}
          >
            {isCreating ? 'Creating...' : 'Add Product'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- Delete Confirmation Modal ----------

function DeleteProductModal({
  product,
  onClose,
  onConfirm,
  isLoading,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <Card variant="elevated" padding="lg" className="relative w-full max-w-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete Product</h2>
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- Main Page ----------

export function ProductsPage() {
  const { user } = useUser();
  const businessClientId = user?.client_id;

  const { data: products = [], isLoading, isError, error } = useProducts(businessClientId);
  const deleteMutation = useDeleteProduct();
  const uploadMutation = useUploadProductImage();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Hidden file input for image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetProduct, setUploadTargetProduct] = useState<Product | null>(null);

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
      {
        onSettled: () => {
          setUploadTargetProduct(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    deleteMutation.mutate(productToDelete.id, {
      onSuccess: () => setProductToDelete(null),
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Products</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage the products and services you advertise
            </p>
          </div>
          <Button
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Upload status banner */}
        {uploadMutation.isPending && (
          <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            <Loader2Icon className="w-4 h-4 animate-spin" />
            Uploading image for {uploadTargetProduct?.name}...
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2Icon className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Loading products...</p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircleIcon className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Failed to load products</h2>
            <p className="text-sm text-slate-500">{(error as Error).message}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <PackageIcon className="w-9 h-9 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No products yet</h2>
            <p className="text-slate-500 mb-8 max-w-sm text-sm">
              Add your first product to start creating campaigns and generating ads.
            </p>
            <Button
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Add your first product
            </Button>
          </div>
        )}

        {/* No search results */}
        {!isLoading && !isError && products.length > 0 && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <SearchIcon className="w-7 h-7 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">No products match your search</h2>
            <p className="text-sm text-slate-500">Try a different search term.</p>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && !isError && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={setProductToDelete}
                onUploadImage={handleUploadImage}
              />
            ))}
          </div>
        )}

        {/* Hidden file input for image uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Modals */}
        {showCreateModal && (
          <CreateProductModal onClose={() => setShowCreateModal(false)} />
        )}

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
