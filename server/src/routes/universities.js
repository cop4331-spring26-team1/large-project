const express    = require('express');
const router     = express.Router();
const University = require('../models/University');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/universities?search=florida — autocomplete for listing form
router.get('/', async (req, res) => {
  try {
    const { search, state } = req.query;
    const filter = {};
    if (state)  filter.state = state.toUpperCase();
    if (search) filter.$or   = [
      { name:         new RegExp(search, 'i') },
      { city:         new RegExp(search, 'i') },
      { abbreviation: new RegExp(search, 'i') },
    ];

    const universities = await University.find(filter)
      .select('name city state coordinates')
      .limit(20)
      .lean();

    return successResponse(res, { universities });
  } catch (err) {
    return errorResponse(res, err.message);
  }
});

module.exports = router;
