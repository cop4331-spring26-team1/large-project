import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    thread: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    body:   string;
    readBy: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        thread: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User',   required: true },
        body:   { type: String, required: true },
        readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);