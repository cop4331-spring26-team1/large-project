import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    hashedPassword: string;
    university: string;
    profilePhoto?: string;
    rating: number;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        hashedPassword: {
            type: String,
            required: true,
        },

        university: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        profilePhoto: {
            type: String,
            default: '',
        },

        rating: {
            type: Number,
            default: 0.0,
            min: 0,
            max: 5,
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IUser>('User', UserSchema);