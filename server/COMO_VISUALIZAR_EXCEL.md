# 📊 Como Visualizar os Arquivos Excel

## 📁 Localização dos Arquivos

Todos os arquivos Excel gerados são salvos na pasta:
```
server/excels/
```

## 🎯 3 Formas de Acessar os Arquivos Excel:

### 1️⃣ **Abrir Diretamente da Pasta (RECOMENDADO)**

1. Navegue até a pasta do projeto:
   ```
   c:\Users\laura\previdência\server\excels\
   ```

2. Abra o arquivo Excel com um duplo clique
   - O Excel será aberto normalmente no Microsoft Excel

3. **Vantagem:** Você pode visualizar, editar e salvar o arquivo normalmente

---

### 2️⃣ **Baixar via Postman**

1. Faça o upload do PDF:
   ```
   POST http://localhost:5000/api/pdf/upload
   ```

2. Na resposta, copie o caminho completo:
   ```json
   {
     "excelPath": "C:\\Users\\laura\\previdência\\server\\excels\\extracted-1697234567890.xlsx"
   }
   ```

3. Abra esse caminho no Windows Explorer
   - Copie o caminho
   - Cole na barra de endereços do Explorer
   - Pressione Enter

---

### 3️⃣ **Baixar via API**

1. Liste os arquivos disponíveis:
   ```
   GET http://localhost:5000/api/pdf/files
   ```

2. Resposta mostra o caminho completo:
   ```json
   {
     "success": true,
     "data": [
       {
         "name": "extracted-1697234567890.xlsx",
         "fullPath": "C:\\Users\\laura\\previdência\\server\\excels\\extracted-1697234567890.xlsx",
         "downloadUrl": "/api/pdf/download/extracted-1697234567890.xlsx"
       }
     ],
     "message": "Os arquivos Excel estão salvos em: C:\\Users\\laura\\previdência\\server\\excels"
   }
   ```

3. Use o `downloadUrl` no Postman:
   ```
   GET http://localhost:5000/api/pdf/download/extracted-1697234567890.xlsx
   ```
   
4. No Postman, clique em "Save Response" → "Save to a file"

---

## 💡 Dica Importante:

**Não precisa usar o Postman para visualizar!**

Depois de fazer o upload do PDF, simplesmente:
1. Abra o Windows Explorer
2. Navegue até: `c:\Users\laura\previdência\server\excels\`
3. Clique duas vezes no arquivo Excel
4. O Excel abrirá normalmente! 📊

---

## 📋 Estrutura dos Arquivos

Cada arquivo Excel contém as seguintes colunas:
- **MÊS/ANO FOLHA**
- **MÊS/ANO DIR**
- **DESC/VANT**
- **RUBRICA**
- **DESCRIÇÃO RUBRICA**
- **VALOR**

---

## 🗑️ Gerenciamento de Arquivos

Os arquivos **NÃO são deletados automaticamente** para que você possa:
- Abrir quando quiser
- Fazer backup
- Comparar versões

Se quiser limpar a pasta, apenas delete manualmente os arquivos que não precisa mais.

---

## 🚀 Fluxo Completo Recomendado:

1. **Faça o upload do PDF no Postman**
   ```
   POST http://localhost:5000/api/pdf/upload
   Body: form-data
   Campo: file (seu PDF)
   ```

2. **Anote o caminho da resposta**
   ```json
   {
     "excelPath": "C:\\Users\\laura\\previdência\\server\\excels\\extracted-1697234567890.xlsx"
   }
   ```

3. **Abra o arquivo diretamente**
   - Vá para a pasta `server/excels/`
   - Abra o último arquivo Excel criado
   - Visualize os dados extraídos! ✅

**Pronto! Agora você pode visualizar facilmente os arquivos Excel gerados! 🎉**
