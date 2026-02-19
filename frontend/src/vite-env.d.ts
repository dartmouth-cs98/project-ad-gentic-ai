/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENV: 'local' | 'production';
    readonly VITE_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
