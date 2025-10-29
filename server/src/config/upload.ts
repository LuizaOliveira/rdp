/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from 'multer';

// Use memory storage so uploaded PDFs are not written to disk.
// The file buffer will be available at `req.file.buffer`.
const storage = multer.memoryStorage();

// Filtro para aceitar apenas PDFs
const fileFilter = function (req: any, file: any, cb: any) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos PDF são permitidos!'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
