import mongoose, {Document, Schema} from 'mongoose';

export interface IThread extends Document {
    listing: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    listingSnapshot: {
        title: string;
        mainImage: string;
        price: number;
        status: string;
    };
    blockedBy: mongoose.Types.ObjectId[];
    deletedBy: mongoose.Types.ObjectId[];
    lastMessage: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>({
    listing: {type: Schema.Types.ObjectId, ref: 'Listing', required: true},
    participants: [{type: Schema.Types.ObjectId, ref: 'User', required: true}],
    listingSnapshot: {
        title: {type: String},
        mainImage: {type: String},
        price: {type: Number},
        status: {type: String},
    },
    blockedBy: [{type: Schema.Types.ObjectId, ref: 'User'}],
    deletedBy: [{type: Schema.Types.ObjectId, ref: 'User'}],
    lastMessage: {type: String, default: ''},
    lastMessageAt: {type: Date}
},
    {timestamps: true}
);

export default mongoose.model<IThread>('Thread', ThreadSchema);