import express from 'express';
import { searchUniversities } from '../controllers/universityController';

const router = express.Router();

router.get('/', searchUniversities);

export default router;