import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  hashedPassword: string;
  role: 'user' | 'admin';
  dateCreated: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  hashedPassword: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  dateCreated: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;