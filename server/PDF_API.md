# 📄 API de Conversão PDF para Excel

API para extrair informações de arquivos PDF e converter para Excel.

## 🚀 Rotas Disponíveis

### 1. Upload de PDF Único

**POST** `/api/pdf/upload`

Envia um arquivo PDF e recebe os dados extraídos + link para download do Excel.

**Form Data:**
- `pdf`: Arquivo PDF (campo de upload)

**Resposta:**
```json
{
  "success": true,
  "message": "PDF processado com sucesso",
  "data": {
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "matricula": "12345",
    "dataAdmissao": "01/01/2020",
    "cargo": "Analista",
    "salario": "5000.00",
    "dataNascimento": "15/05/1990",
    "telefone": "(11) 98765-4321",
    "email": "joao@email.com"
  },
  "downloadUrl": "/api/pdf/download/extracted-1234567890.xlsx"
}
```

### 2. Upload de Múltiplos PDFs

**POST** `/api/pdf/upload-multiple`

Envia vários arquivos PDF de uma vez (máximo 10 arquivos).

**Form Data:**
- `pdfs`: Múltiplos arquivos PDF

**Resposta:**
```json
{
  "success": true,
  "message": "3 PDF(s) processado(s) com sucesso",
  "data": [
    { "nome": "João Silva", "cpf": "123.456.789-00", ... },
    { "nome": "Maria Santos", "cpf": "987.654.321-00", ... },
    { "nome": "Pedro Costa", "cpf": "456.789.123-00", ... }
  ],
  "downloadUrl": "/api/pdf/download/extracted-1234567890.xlsx"
}
```

### 3. Download do Excel

**GET** `/api/pdf/download/:fileName`

Faz o download do arquivo Excel gerado.

**Exemplo:**
```
GET /api/pdf/download/extracted-1234567890.xlsx
```

### 4. Listar Arquivos Disponíveis

**GET** `/api/pdf/files`

Lista todos os arquivos Excel disponíveis para download.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "name": "extracted-1234567890.xlsx",
      "downloadUrl": "/api/pdf/download/extracted-1234567890.xlsx",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## 📋 Campos Extraídos do PDF

A API tenta extrair os seguintes campos dos PDFs:

- **Nome**: Nome completo do funcionário
- **CPF**: CPF formatado
- **Matrícula**: Número de matrícula
- **Data de Admissão**: Data de entrada na empresa
- **Cargo**: Cargo/função exercida
- **Salário**: Valor do salário
- **Data de Nascimento**: Data de nascimento
- **Telefone**: Número de telefone
- **E-mail**: Endereço de e-mail

## 🛠️ Personalização

Para personalizar os campos extraídos, edite o arquivo:
`server/src/services/pdfService.ts`

Na função `extractDataFromPdf`, você pode:
- Adicionar novos campos
- Modificar as expressões regulares (regex)
- Ajustar a lógica de extração

**Exemplo de como adicionar um novo campo:**

```typescript
const extractedData: PdfData = {
  // ... campos existentes
  endereco: this.extractField(text, ['endereço', 'endereco'], /endere[çc]o[:\s]+([^\n]+)/i),
  cidade: this.extractField(text, ['cidade'], /cidade[:\s]+([^\n]+)/i),
};
```

## 🧪 Testando com Postman/Insomnia

### Upload Único:
1. Método: POST
2. URL: `http://localhost:5000/api/pdf/upload`
3. Body: form-data
4. Adicionar campo `pdf` (tipo: File)
5. Selecionar arquivo PDF

### Upload Múltiplo:
1. Método: POST
2. URL: `http://localhost:5000/api/pdf/upload-multiple`
3. Body: form-data
4. Adicionar campo `pdfs` (tipo: File)
5. Selecionar múltiplos arquivos PDF

## 🧪 Testando com cURL

```bash
# Upload único
curl -X POST http://localhost:5000/api/pdf/upload \
  -F "pdf=@caminho/para/seu/arquivo.pdf"

# Upload múltiplo
curl -X POST http://localhost:5000/api/pdf/upload-multiple \
  -F "pdfs=@arquivo1.pdf" \
  -F "pdfs=@arquivo2.pdf" \
  -F "pdfs=@arquivo3.pdf"

# Download
curl -O http://localhost:5000/api/pdf/download/extracted-1234567890.xlsx

# Listar arquivos
curl http://localhost:5000/api/pdf/files
```

## ⚙️ Configurações

- **Tamanho máximo do arquivo**: 10MB
- **Tipos aceitos**: Apenas PDF
- **Máximo de arquivos por vez**: 10
- **Diretório de upload**: `server/uploads/`

## 📝 Notas Importantes

1. **Formato do PDF**: A extração funciona melhor com PDFs que contêm texto (não imagens)
2. **Layout**: Os PDFs devem seguir um padrão para melhor extração
3. **Limpeza automática**: Os arquivos Excel são deletados 5 segundos após o download
4. **PDFs originais**: São deletados após o processamento

## 🔧 Ajustando a Extração

Se os dados não estão sendo extraídos corretamente, você pode:

1. Verificar o formato do PDF
2. Ajustar as expressões regulares no arquivo `pdfService.ts`
3. Adicionar tratamento específico para o layout do seu PDF

## 🎯 Próximos Passos

Para melhorar a extração, você pode:
- Usar OCR para PDFs escaneados (tesseract.js)
- Implementar machine learning para extração mais precisa
- Adicionar validação de dados extraídos
- Salvar histórico no banco de dados
