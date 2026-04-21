"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUniversities = void 0;
const University_1 = __importDefault(require("../models/University"));
const searchUniversities = async (req, res) => {
    try {
        const { search, state } = req.query;
        const filter = {};
        if (state)
            filter.state = state;
        if (search)
            filter.name = { $regex: search, $options: 'i' };
        const universities = await University_1.default.find(filter).limit(10);
        res.status(200).json({ data: { universities } });
    }
    catch (err) {
        console.error('searchUniversities error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.searchUniversities = searchUniversities;
