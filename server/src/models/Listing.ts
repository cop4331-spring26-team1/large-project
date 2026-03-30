import mongoose, { Document, Schema } from 'mongoose';

export interface IListing extends Document {
    hostId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    price: number;
    availableFrom: Date;
    availableTo: Date;
    photos: string[];
    amenities: string[];
    roomType: 'private' | 'shared';
    bedrooms: number;
    bathrooms: number;
    petsAllowed: boolean;
    utilitiesIncluded: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ListingSchema = new Schema<IListing>(
    {
        hostId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        address: {
            street: { type: String, required: true, trim: true },
            city:   { type: String, required: true, trim: true },
            state:  { type: String, required: true, trim: true },
            zip:    { type: String, required: true, trim: true },
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        availableFrom: {
            type: Date,
            required: true,
        },
        availableTo: {
            type: Date,
            required: true,
        },
        photos: {
            type: [String],
            default: [],
        },
        amenities: {
            type: [String],
            default: [],
        },
        roomType: {
            type: String,
            enum: ['private', 'shared'],
            required: true,
        },
        bedrooms: {
            type: Number,
            required: true,
            min: 1,
        },
        bathrooms: {
            type: Number,
            required: true,
            min: 1,
        },
        petsAllowed: {
            type: Boolean,
            default: false,
        },
        utilitiesIncluded: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

ListingSchema.index({ isActive: 1, price: 1 });

ListingSchema.index({ availableFrom: 1, availableTo: 1 });

export default mongoose.model<IListing>('Listing', ListingSchema);