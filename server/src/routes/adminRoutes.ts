import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
import {
  getUsersAdmin,
  updateUserAdmin,
  getListingsAdmin,
  deleteListingAdmin,
} from '../controllers/adminController';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/users', getUsersAdmin);
router.patch('/users/:id', updateUserAdmin);
router.get('/listings', getListingsAdmin);
router.delete('/listings/:id', deleteListingAdmin);

export default router;
