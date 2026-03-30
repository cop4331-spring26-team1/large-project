import mongoose, {Document, Schema} from 'mongoose'

export interface IListing extends Document {
    title: string
    description?: string
    price: number
    location: string
    owner: mongoose.Types.ObjectId
    images: string[]
    isActive: boolean
    dateCreated: Date
}

const ListingSchema = new Schema({
    title: {type: String, required: true, trim: true},
    description: {type: String, required: true},
    price: {type: String, required: true, min: 0},
    location: {type: String, required: true},
    owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    images: [{type: String}],
    isActive: {type: Boolean, default: true},
    dateCreated: {type: Date, default: Date.now}
})

export default mongoose.model<IListing>('Listing', ListingSchema)