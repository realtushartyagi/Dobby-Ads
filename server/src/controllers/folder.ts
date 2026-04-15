import { Request, Response } from 'express';
import Folder from '../models/Folder.js';
import Image from '../models/Image.js';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createFolder = async (req: any, res: Response) => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user.userId;

    const folder = new Folder({
      name,
      parentId: parentId || null,
      userId
    });

    await folder.save();
    res.status(201).json(folder);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getFolders = async (req: any, res: Response) => {
  try {
    const { parentId } = req.query;
    const userId = req.user.userId;

    const query: any = { userId };
    if (parentId) {
      query.parentId = parentId;
    } else {
      query.parentId = null; // root level
    }

    const folders = await Folder.find(query);
    
    // Add size to each folder
    const foldersWithSizes = await Promise.all(folders.map(async (folder) => {
      const size = await calculateFolderSize(folder._id);
      return {
        ...folder.toObject(),
        size,
        sizeFormatted: formatSize(size)
      };
    }));

    res.json(foldersWithSizes);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteFolder = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 1. Find all descendant folder IDs using graphLookup
    const folders = await Folder.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(userId) } },
      {
        $graphLookup: {
          from: 'folders',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parentId',
          as: 'descendants'
        }
      },
      {
        $project: {
          folderIds: {
            $concatArrays: [['$_id'], '$descendants._id']
          }
        }
      }
    ]);

    if (folders.length === 0) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const folderIds = folders[0].folderIds;

    // 2. Find all images in these folders
    const images = await Image.find({ folderId: { $in: folderIds }, userId });

    // 3. Delete image files from disk/Cloudinary
    const uploadDir = path.join(__dirname, '..', 'uploads');
    for (const image of images) {
      if (image.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(image.cloudinaryId);
        } catch (err) {
          console.error(`Failed to delete from Cloudinary: ${image.cloudinaryId}`, err);
        }
      } else {
        const filename = image.url.split('/').pop();
        if (filename) {
          const filePath = path.join(uploadDir, filename);
          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.error(`Failed to delete file: ${filePath}`, err);
          }
        }
      }
    }

    // 4. Delete images from DB
    await Image.deleteMany({ folderId: { $in: folderIds }, userId });

    // 5. Delete folders from DB
    await Folder.deleteMany({ _id: { $in: folderIds }, userId });

    res.json({ message: 'Folder and its contents deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const calculateFolderSize = async (folderId: mongoose.Types.ObjectId): Promise<number> => {
  // Use graphLookup to find all nested folders
  const result = await Folder.aggregate([
    { $match: { _id: folderId } },
    {
      $graphLookup: {
        from: 'folders',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parentId',
        as: 'descendants'
      }
    },
    {
      $project: {
        folderIds: {
          $concatArrays: [['$_id'], '$descendants._id']
        }
      }
    },
    {
      $lookup: {
        from: 'images',
        localField: 'folderIds',
        foreignField: 'folderId',
        as: 'images'
      }
    },
    {
      $project: {
        totalSize: { $sum: '$images.size' }
      }
    }
  ]);

  return result[0]?.totalSize || 0;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
