/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CURRENCY_NAME?: string;
  readonly VITE_CURRENCY_NAME_PLURAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
