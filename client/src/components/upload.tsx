import { useState } from "react";
import axios from "axios";
import api from "../services/api";
type UploadProps = {
  embedded?: boolean; // render sem wrapper de página
  multiple?: boolean; // permitir múltiplos arquivos
  className?: string; // classe extra para wrapper
  // callback após upload bem-sucedido; recebe opcionalmente o nome do arquivo gerado (suggested filename)
  onUploadComplete?: (fileName?: string) => void;
};

export function Upload({
  embedded = false,
  multiple = true,
  className = "",
  onUploadComplete,
}: UploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [tipoServidor, setTipoServidor] = useState<'ativo' | 'aposentado'>('ativo');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastDownloadedName, setLastDownloadedName] = useState("");

  const validatePdf = (file: File) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const invalid = selected.filter((f) => !validatePdf(f));
    if (invalid.length) {
      setError(`Arquivos inválidos: ${invalid.map((f) => f.name).join(", ")}`);
      return;
    }
    setFiles(selected);
    setError("");
    setMessage("");
    setLastDownloadedName("");
  };



  const handleUpload = async () => {
    if (!files.length) {
      setError("Por favor, selecione pelo menos um PDF");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    setLastDownloadedName("");

    const formData = new FormData();
    formData.append("tipoServidor", tipoServidor);
    if (files.length === 1) {
      formData.append("file", files[0]);
    } else {
      files.forEach((f) => formData.append("files", f));
    }

    try {
      const endpoint =
        files.length === 1
          ? `${api.defaults.baseURL}/pdf/upload`
          : `${api.defaults.baseURL}/pdf/upload-multiple`;

      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"];
      let suggestedName: string | undefined = undefined;
      if (disposition) {
        const match = /filename="?([^";]+)"?/i.exec(disposition);
        if (match) suggestedName = match[1];
      }

      // Do NOT auto-download the generated Excel. Notify parent with suggested filename
      setMessage("Excel gerado com sucesso. Clique em 'Baixar' para baixar o arquivo.");
      if (suggestedName) setLastDownloadedName(suggestedName);

      // Invoke the onUploadComplete callback if provided, passing the file name (if any)
      if (onUploadComplete) {
        onUploadComplete(suggestedName);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erro ao processar arquivo(s)";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div className={`bg-white rounded-lg shadow-xl p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h4 className="text-2xl font-bold text-gray-900 mb-2">
          PDF para Excel
        </h4>
        <p className="text-gray-600">
          Faça upload da ficha financeira e baixe o Excel organizado
        </p>
      </div>

      {/* Tipo de Servidor */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Tipo de servidor</div>
        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo-servidor"
              value="ativo"
              checked={tipoServidor === 'ativo'}
              onChange={() => setTipoServidor('ativo')}
            />
            <span className="text-sm text-gray-700">Servidor ativo</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipo-servidor"
              value="aposentado"
              checked={tipoServidor === 'aposentado'}
              onChange={() => setTipoServidor('aposentado')}
            />
            <span className="text-sm text-gray-700">Aposentado</span>
          </label>
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full ${
            embedded ? "h-40" : "h-64"
          } border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-16 h-16 mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {files.length ? (
              <div className="text-center max-w-xs">
                <p className="mb-2 text-sm text-gray-700 font-semibold">
                  {files.length === 1
                    ? `📎 ${files[0].name}`
                    : `${files.length} arquivos selecionados`}
                </p>
                <ul className="text-xs text-gray-500 max-h-24 overflow-auto space-y-1">
                  {files.slice(0, 5).map((f) => (
                    <li key={f.name}>{f.name}</li>
                  ))}
                  {files.length > 5 && (
                    <li>... (+{files.length - 5} outros)</li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-2 text-sm text-gray-700">
                  <span className="font-semibold">Clique para selecionar</span>{" "}
                  ou arraste os arquivos
                </p>
                <p className="text-xs text-gray-500">
                  Apenas PDFs (máx. 10MB cada)
                </p>
              </div>
            )}
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf"
            multiple={multiple}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!files.length || loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
          !files.length || loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:scale-95"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Gerando Excel...
          </span>
        ) : files.length > 1 ? (
          "Converter PDFs para Excel único"
        ) : (
          "Converter para Excel"
        )}
      </button>

      {/* Messages */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}
      {message && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">✅ {message}</p>
          {lastDownloadedName && (
            <p className="mt-2 text-xs text-green-700 break-all">
              Arquivo: {lastDownloadedName}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return card;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {card}
        {/* Info Section (opcional futuro) */}
      </div>
    </div>
  );
}
