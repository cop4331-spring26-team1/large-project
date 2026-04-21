require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User     = require('../models/User');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node makeAdmin.js <email>');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: 'admin' },
    { new: true }
  );
  if (!user) {
    console.error(`No user found with email: ${email}`);
  } else {
    console.log(`✓ ${user.name} (${user.email}) is now admin`);
  }
  mongoose.disconnect();
});
