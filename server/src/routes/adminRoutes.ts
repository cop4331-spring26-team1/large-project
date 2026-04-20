import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
const router = express.Router();

import {
  getUsersAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  getListingsAdmin,
  reactivateListingAdmin,
  deleteListingAdmin,
} from '../controllers/adminController';

router.get('/users',                        getUsersAdmin);
router.patch('/users/:id',                  updateUserAdmin);
router.delete('/users/:id',                 deleteUserAdmin);
router.get('/listings',                     getListingsAdmin);
router.patch('/listings/:id/reactivate',    reactivateListingAdmin);
router.delete('/listings/:id',              deleteListingAdmin);

export default router;
