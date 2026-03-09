import { apiUrl, authHeaders } from './config';
import type { Product, CreateProductPayload, UpdateProductPayload } from '../types';

// ---------- API calls ----------

export async function fetchProducts(
  businessClientId: number,
): Promise<Product[]> {
  const params = new URLSearchParams({
    business_client_id: String(businessClientId),
  });

  const res = await fetch(apiUrl(`/products/?${params.toString()}`), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to fetch products.');
  }

  return (await res.json()) as Product[];
}

export async function fetchProduct(productId: number): Promise<Product> {
  const res = await fetch(apiUrl(`/products/${productId}`), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Product not found.');
  }

  return (await res.json()) as Product;
}

export async function createProduct(
  data: CreateProductPayload,
): Promise<Product> {
  const res = await fetch(apiUrl('/products/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to create product.');
  }

  return (await res.json()) as Product;
}

export async function updateProduct(
  productId: number,
  data: UpdateProductPayload,
): Promise<Product> {
  const res = await fetch(apiUrl(`/products/${productId}`), {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to update product.');
  }

  return (await res.json()) as Product;
}

export async function deleteProduct(productId: number): Promise<void> {
  const res = await fetch(apiUrl(`/products/${productId}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to delete product.');
  }
}

/** Upload or replace a product image (multipart). Returns updated product. */
export async function uploadProductImage(
  productId: number,
  file: File,
): Promise<Product> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(apiUrl(`/products/${productId}/upload-image`), {
    method: 'POST',
    headers: authHeaders(false), // no Content-Type — browser sets multipart boundary
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to upload product image.');
  }

  return (await res.json()) as Product;
}
