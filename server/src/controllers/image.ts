import { Request, Response } from 'express';
import Image from '../models/Image.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadImage = async (req: any, res: Response) => {
  try {
    const { name, folderId } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Determine URL and Cloudinary ID
    const imageUrl = req.file.path || req.file.secure_url || `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const cloudinaryId = req.file.filename && imageUrl.includes('cloudinary') ? req.file.filename : undefined;

    const image = new Image({
      name: name || req.file.originalname,
      url: imageUrl,
      size: req.file.size,
      folderId: folderId || null,
      userId,
      cloudinaryId
    });

    await image.save();
    res.status(201).json(image);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getImages = async (req: any, res: Response) => {
  try {
    const { folderId } = req.query;
    const userId = req.user.userId;

    const query: any = { userId };
    if (folderId) {
      query.folderId = folderId;
    } else {
      query.folderId = null; // root level
    }

    const images = await Image.find(query);
    
    const formattedImages = images.map(img => ({
      ...img.toObject(),
      sizeFormatted: formatSize(img.size)
    }));

    res.json(formattedImages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteImage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const image = await Image.findOne({ _id: id, userId });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // 1. Delete from Cloudinary if applicable
    if (image.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryId);
      } catch (err) {
        console.error(`Failed to delete from Cloudinary: ${image.cloudinaryId}`, err);
      }
    } else {
      // 2. Delete from local disk
      const filename = image.url.split('/').pop();
      if (filename) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        const filePath = path.join(uploadDir, filename);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error(`Failed to delete file: ${filePath}`, err);
        }
      }
    }

    await Image.deleteOne({ _id: id, userId });

    res.json({ message: 'Image deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
