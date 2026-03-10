import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../api/products';
import type { CreateProductPayload, UpdateProductPayload } from '../types';

export const PRODUCTS_KEY = ['products'] as const;

/** Fetch all products for a business client. */
export function useProducts(businessClientId: number | undefined) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, businessClientId],
    queryFn: () => fetchProducts(businessClientId!),
    enabled: !!businessClientId,
    staleTime: 30_000,
  });
}

/** Create a new product. Invalidates the products list on success. */
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductPayload) => createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

/** Update an existing product. Invalidates the products list on success. */
export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: UpdateProductPayload }) =>
      updateProduct(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

/** Delete a product. Invalidates the products list on success. */
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

/** Upload or replace a product image. Invalidates the products list on success. */
export function useUploadProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, file }: { productId: number; file: File }) =>
      uploadProductImage(productId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}
