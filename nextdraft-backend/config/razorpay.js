const Razorpay = require("razorpay");

let instance = null;

const getRazorpay = () => {
  if (instance) return instance;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn(
      "[Razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payments are disabled until you add them."
    );
    return null;
  }
  instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return instance;
};

const isConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

module.exports = { getRazorpay, isConfigured };
