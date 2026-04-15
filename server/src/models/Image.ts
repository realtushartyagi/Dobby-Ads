import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
  name: string;
  url: string;
  size: number;
  folderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  cloudinaryId?: string;
  createdAt: Date;
}

const ImageSchema: Schema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true }, // Size in bytes
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder', required: false },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cloudinaryId: { type: String },
}, { timestamps: true });

// Index for filtering images by folder and user
ImageSchema.index({ folderId: 1, userId: 1 });

export default mongoose.model<IImage>('Image', ImageSchema);
