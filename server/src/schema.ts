// models/Schemas.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { 
  collection: 'Users', // name of the collection 
});

const ListingSchema = new mongoose.Schema({

}, { 
  collection: 'Listings', // name of the collection
});

const User = mongoose.model('User', UserSchema);
const Listing = mongoose.model('Listing', ListingSchema);

export { User, Listing };