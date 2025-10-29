// Tipagens mínimas para variáveis de ambiente do Vite usadas no projeto
interface ImportMetaEnv {
  readonly VITE_BASE_URL?: string;
  // adicione outras VITE_ variáveis aqui conforme necessário
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
