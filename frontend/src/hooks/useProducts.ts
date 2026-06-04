import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
} from '../api/products';
import type { CreateProductPayload, UpdateProductPayload } from '../types';

export const PRODUCTS_KEY = ['products'] as const;

export function useProducts(businessClientId: number | undefined) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, businessClientId],
    queryFn: () => fetchProducts(businessClientId!),
    enabled: !!businessClientId,
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductPayload) => createProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: UpdateProductPayload }) =>
      updateProduct(productId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

/** Upload one or more images for a product. Appends to existing list (max 5 total). */
export function useUploadProductImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, files }: { productId: number; files: File[] }) =>
      uploadProductImages(productId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

/** Delete a single image from a product by blob name. */
export function useDeleteProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, blobName }: { productId: number; blobName: string }) =>
      deleteProductImage(productId, blobName),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
