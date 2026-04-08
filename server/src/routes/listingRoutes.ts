import express from 'express';
import {
    getListings,
    getMine,
    getMapPins,
    getById,
    createListing,
    updateListing,
    updateStatus,
    toggleFavorite,
    deleteListing,
} from '../controllers/listingController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/',              getListings);
router.get('/mine',          protect, getMine);
router.get('/map',           getMapPins);
router.get('/:id',           getById);
router.post('/',             protect, createListing);
router.put('/:id',           protect, updateListing);
router.patch('/:id/status',  protect, updateStatus);
router.post('/:id/favorite', protect, toggleFavorite);
router.delete('/:id',        protect, deleteListing);

export default router;