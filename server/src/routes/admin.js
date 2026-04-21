const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getStats,
  getUsers, updateUser, deleteUser,
  getAllListings, reactivateListing, adminDeleteListing,
  boostListing, unboostListing, forceListingStatus,
  getAllThreads,
} = require('../controllers/adminController');

router.use(protect, adminOnly); // all admin routes require auth + admin role

// Stats
router.get('/stats', getStats);

// Users
router.get(   '/users',       getUsers);
router.patch( '/users/:id',   updateUser);
router.delete('/users/:id',   deleteUser);

// Listings
router.get(   '/listings',                  getAllListings);
router.patch( '/listings/:id/reactivate',   reactivateListing);
router.patch( '/listings/:id/boost',        boostListing);
router.patch( '/listings/:id/unboost',      unboostListing);
router.patch( '/listings/:id/status',       forceListingStatus);
router.delete('/listings/:id',              adminDeleteListing);

// Threads (moderation)
router.get('/threads', getAllThreads);

module.exports = router;
