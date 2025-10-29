import { Router } from 'express';
import userRoutes from './userRoutes';
import pdfRoutes from './pdfRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/pdf', pdfRoutes);

export default router;
