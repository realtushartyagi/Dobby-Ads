import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  parentId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FolderSchema: Schema = new Schema({
  name: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Add index for faster queries on hierarchy and user isolation
FolderSchema.index({ parentId: 1, userId: 1 });

export default mongoose.model<IFolder>('Folder', FolderSchema);
