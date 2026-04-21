"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listing = exports.User = void 0;
// models/Schemas.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, {
    collection: 'Users', // name of the collection 
});
const ListingSchema = new mongoose.Schema({}, {
    collection: 'Listings', // name of the collection
});
const User = mongoose.model('User', UserSchema);
exports.User = User;
const Listing = mongoose.model('Listing', ListingSchema);
exports.Listing = Listing;
