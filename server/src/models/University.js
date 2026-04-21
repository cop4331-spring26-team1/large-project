const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    city:  { type: String, required: true, trim: true },
    state: { type: String, required: true, uppercase: true, trim: true },
    // Campus center point — used to calculate distanceToCampus
    coordinates: {
      type: {
        type:    String,
        enum:    ['Point'],
        default: 'Point',
      },
      coordinates: [Number], // [longitude, latitude]
    },
    // Common abbreviation e.g. "UCF", "MIT", "UCLA"
    abbreviation: { type: String, trim: true, uppercase: true },
    // Optional: match .edu domain to university for future features
    domain: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);

universitySchema.index({ coordinates: '2dsphere' });
universitySchema.index({ name: 'text', city: 1, state: 1 }); // text search

module.exports = mongoose.model('University', universitySchema);
