import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name:                 string;
    email:                string;
    hashedPassword:       string;
    role:                 'user' | 'admin';
    isBlocked:            boolean;
    isVerifiedStudent:    boolean;
    avatarKey:            string;
    favorites:            mongoose.Types.ObjectId[];
    isEmailVerified:      boolean;
    emailVerifyToken?:    string;
    emailVerifyExpires?:  Date;
    passwordResetToken?:  string;
    passwordResetExpires?: Date;
    createdAt:            Date;
    updatedAt:            Date;
    isAdmin:              boolean;
}

const UserSchema = new Schema<IUser>(
    {
        name:                { type: String,  required: true, trim: true },
        email:               { type: String,  required: true, unique: true, lowercase: true },
        hashedPassword:      { type: String,  required: true },
        role:                { type: String,  enum: ['user', 'admin'], default: 'user' },
        isBlocked:           { type: Boolean, default: false },
        isVerifiedStudent:   { type: Boolean, default: false },
        avatarKey:           { type: String,  default: 'student_male' },
        favorites:           [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
        isEmailVerified:     { type: Boolean, default: false },
        emailVerifyToken:    { type: String },
        emailVerifyExpires:  { type: Date },
        passwordResetToken:  { type: String },
        passwordResetExpires: { type: Date },
    },
    {
        timestamps:  true,
        toJSON:      { virtuals: true },
        toObject:    { virtuals: true },
    }
);

UserSchema.virtual('isAdmin').get(function () {
    return this.role === 'admin';
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;