/**
 * Promote a user to admin role by email.
 *
 * Usage:
 *   node scripts/promote_admin.js you@example.com
 *
 * Requires MONGODB_URI in environment.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../models/User_model");

(async () => {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Usage: node scripts/promote_admin.js <email>");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }
  user.role = "admin";
  await user.save();
  console.log(`Promoted ${user.email} to admin.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
