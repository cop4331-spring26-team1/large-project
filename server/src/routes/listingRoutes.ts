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
import { upload } from '../middleware/upload';

const router = express.Router();

router.get('/',              getListings);
router.get('/mine',          protect, getMine);
router.get('/map',           getMapPins);
router.get('/:id',           getById);
router.post('/',             protect, upload.array('images', 10), createListing);
router.put('/:id',           protect, upload.array('images', 10), updateListing);
router.patch('/:id/status',  protect, updateStatus);
router.post('/:id/favorite', protect, toggleFavorite);
router.delete('/:id',        protect, deleteListing);

export default router;