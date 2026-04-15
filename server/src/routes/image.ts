import express from 'express';
import { uploadImage, getImages, deleteImage } from '../controllers/image.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('image'), uploadImage);
router.get('/', authMiddleware, getImages);
router.delete('/:id', authMiddleware, deleteImage);

export default router;
