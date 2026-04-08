import mongoose, {Document, Schema} from 'mongoose';

export interface IUniversity extends Document {
    name: string;
    city: string;
    state: string;
    coordinates: {
        type: 'Point';
        coordinates: [number, number];
    };
    domain?: string;
}

const UniversitySchema = new Schema<IUniversity>({
   name: {type: String, required: true, trim: true},
   city: {type: String, required: true},
   state: {type: String, required: true},
   coordinates: {
       type: {type: String, enum: ['Point'], default: 'Point'},
       coordinates: {type: [Number], default: [0, 0]},
   },
    domain: {type: String, required: true},
});

UniversitySchema.index({coordinates: '2dsphere'});
UniversitySchema.index({name: 'text', city: 'text'});

export default mongoose.model<IUniversity>('University', UniversitySchema);