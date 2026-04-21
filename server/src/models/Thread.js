const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Listing',
    },

    // Always exactly [inquirerId, listerId]
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],

    // Snapshot at thread creation — survives listing deletion/expiry
    listingSnapshot: {
      title:     String,
      mainImage: String,
      price:     Number,
      status:    String, // updated when listing status changes
    },

    // Either party can block — blocks new messages from both sides
    blockedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],

    // Soft delete per user — both must delete for thread to be truly gone
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],

    // Preview shown in thread list
    lastMessage:   { type: String, default: '' },
    lastMessageAt: { type: Date,   default: Date.now },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
threadSchema.index({ participants: 1 });               // fetch user's threads
threadSchema.index({ listing: 1, participants: 1 });   // unique thread per pair
threadSchema.index({ lastMessageAt: -1 });             // sort threads by recent

module.exports = mongoose.model('Thread', threadSchema);
