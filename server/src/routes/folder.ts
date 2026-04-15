import express from 'express';
import { createFolder, getFolders, deleteFolder } from '../controllers/folder.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createFolder);
router.get('/', authMiddleware, getFolders);
router.delete('/:id', authMiddleware, deleteFolder);

export default router;
