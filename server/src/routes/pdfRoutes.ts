import { Router } from 'express';
import { PdfController } from '../controllers/pdfController';
import { upload } from '../config/upload';

const router = Router();

// Upload e processa um único PDF (aceita qualquer nome de campo: file, pdf, documento, etc)
router.post('/upload', upload.single('file'), PdfController.uploadAndProcess);

// Upload e processa múltiplos PDFs
router.post('/upload-multiple', upload.array('files', 10), PdfController.uploadAndProcessMultiple);

// Download do arquivo Excel gerado
router.get('/download/:fileName', PdfController.downloadExcel);
// Generate Excel from cached data for a given CPF (on-demand)
router.get('/generate/:cpf', PdfController.generateExcel);

// Lista arquivos disponíveis
router.get('/files', PdfController.listFiles);
// Cache de dados (vantagens/descontos) por usuário
router.get('/data-cache/users', PdfController.listCachedUsers);
router.get('/data-cache/users/:cpf', PdfController.getCachedUser);
router.delete('/data-cache/users/:cpf', PdfController.deleteCachedUser);

export default router;
