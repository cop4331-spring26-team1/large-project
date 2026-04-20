import mongoose, { Document, Schema } from 'mongoose';

export interface IListing extends Document {
    owner:             mongoose.Types.ObjectId;
    title:             string;
    description:       string;
    price:             number;
    bedrooms:          number;
    petsAllowed:       boolean;
    utilitiesIncluded: boolean;
    address:           string;
    city:              string;
    state:             string;
    university:        string;
    coordinates: {
        type:        'Point';
        coordinates: [number, number];
    };
    distanceToCampus:  number | null;
    images:            string[];
    favoriteCount:     number;
    status:            'active' | 'pending' | 'offMarket';
    boostedUntil:      Date | null;
    isBoosted:         boolean;
    expiresAt:         Date;
    createdAt:         Date;
    updatedAt:         Date;
}

const ListingSchema = new Schema<IListing>(
    {
        owner:             { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title:             { type: String,  required: true, trim: true },
        description:       { type: String,  required: true },
        price:             { type: Number,  required: true, min: 0 },
        bedrooms:          { type: Number,  required: true, min: 0 },
        petsAllowed:       { type: Boolean, default: false },
        utilitiesIncluded: { type: Boolean, default: false },
        address:           { type: String,  required: true },
        city:              { type: String,  required: true },
        state:             { type: String,  required: true },
        university:        { type: String,  required: true },
        coordinates: {
            type:        { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] },
        },
        distanceToCampus:  { type: Number, default: null },
        images:            [{ type: String }],
        favoriteCount:     { type: Number, default: 0 },
        status:            { type: String, enum: ['active', 'pending', 'offMarket'], default: 'active' },
        boostedUntil:      { type: Date, default: null },
        expiresAt:         { type: Date, required: true },
    },
    {
        timestamps: true,
        toJSON:     { virtuals: true },
        toObject:   { virtuals: true },
    }
);

ListingSchema.index({ coordinates: '2dsphere' });

ListingSchema.virtual('isBoosted').get(function () {
    return this.boostedUntil != null && this.boostedUntil > new Date();
});

export default mongoose.model<IListing>('Listing', ListingSchema);