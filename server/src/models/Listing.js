const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Core info ─────────────────────────────────────────────────────────────
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type:    String,
      trim:    true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type:     Number,
      required: [true, 'Monthly rent is required'],
      min:      [0, 'Price cannot be negative'],
    },
    bedrooms: {
      type:     Number,
      required: [true, 'Number of bedrooms is required'],
      min:      [0, 'Bedrooms cannot be negative'], // 0 = studio
    },
    petsAllowed: {
      type:     Boolean,
      required: [true, 'Pet policy is required'],
    },
    utilitiesIncluded: {
      type:     Boolean,
      required: [true, 'Utilities policy is required'],
    },

    // ── Location ──────────────────────────────────────────────────────────────
    address: {
      type:     String,
      required: [true, 'Address is required'],
      trim:     true,
    },
    city: {
      type:     String,
      required: [true, 'City is required'],
      trim:     true,
    },
    state: {
      type:      String,
      required:  [true, 'State is required'],
      uppercase: true,
      trim:      true,
      maxlength: [2, 'Use 2-letter state code (e.g. FL)'],
    },
    university: {
      type:     String,
      required: [true, 'University name is required'],
      trim:     true,
    },

    // GeoJSON point — auto-populated from address via Nominatim geocoding
    coordinates: {
      type: {
        type:   String,
        enum:   ['Point'],
        default: 'Point',
      },
      coordinates: {
        type:    [Number], // [longitude, latitude] — GeoJSON order
        default: [0, 0],
      },
    },

    // Calculated in miles from address to campus center — auto-populated
    distanceToCampus: {
      type:    Number,
      default: null,
    },

    // ── Images ────────────────────────────────────────────────────────────────
    // Array of Cloudinary URLs. First image is the card thumbnail.
    images: {
      type:     [String],
      validate: {
        validator: (arr) => arr.length >= 1,
        message:   'At least one image is required',
      },
    },

    // ── Social ────────────────────────────────────────────────────────────────
    // Incremented/decremented when users favorite/unfavorite
    favoriteCount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Status lifecycle ──────────────────────────────────────────────────────
    // active   — visible to all, searchable
    // pending  — visible with "In Talks" banner, lister toggled this
    // offMarket — expired (auto) or admin action — hidden from search
    //             only admin can set back to active
    status: {
      type:    String,
      enum:    ['active', 'pending', 'offMarket'],
      default: 'active',
    },

    // ── Monetization (future — schema ready now) ──────────────────────────────
    // If boostedUntil is in the future, listing sorts to top
    boostedUntil: {
      type:    Date,
      default: null,
    },

    // ── Expiry ────────────────────────────────────────────────────────────────
    // Set to createdAt + 90 days on create. Cron job checks daily.
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
listingSchema.index({ coordinates: '2dsphere' });         // geo queries
listingSchema.index({ status: 1, createdAt: -1 });        // default sort
listingSchema.index({ state: 1, city: 1, university: 1 }); // search filters
listingSchema.index({ owner: 1 });                        // my listings
listingSchema.index({ expiresAt: 1 });                    // cron expiry check
listingSchema.index({ boostedUntil: 1, createdAt: -1 }); // boosted sort

// ── Pre-save: set expiresAt on first create ───────────────────────────────────
listingSchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 90); // 90 days from now
    this.expiresAt = expiry;
  }
  next();
});

// ── Virtual: is this listing currently boosted? ───────────────────────────────
listingSchema.virtual('isBoosted').get(function () {
  return this.boostedUntil && this.boostedUntil > new Date();
});

module.exports = mongoose.model('Listing', listingSchema);
