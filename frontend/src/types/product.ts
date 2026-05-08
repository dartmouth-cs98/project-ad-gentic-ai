/** Shape returned by GET /products and GET /products/:id */
export interface Product {
    id: number;
    business_client_id: number;
    name: string;
    description: string | null;
    image_urls: string[];     // list of SAS-signed URLs (may be empty)
    image_names: string[];    // parallel list of blob names (used for deletion)
    product_link: string | null;
    product_metadata: string | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
}

/** Payload for POST /products (JSON body — images uploaded separately via multipart) */
export interface CreateProductPayload {
    name: string;
    description?: string | null;
    product_link?: string | null;
    product_metadata?: string | null;
    is_active?: boolean | null;
}

/** Payload for PUT /products/:id */
export interface UpdateProductPayload {
    name?: string;
    description?: string | null;
    product_link?: string | null;
    product_metadata?: string | null;
    is_active?: boolean | null;
}
