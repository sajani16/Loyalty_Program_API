export const OTP_CONFIG = {
  // OTP expiration time in milliseconds (default: 10 minutes)
  EXPIRATION: parseInt(process.env.OTP_EXPIRATION) || 600000,

  // OTP length
  LENGTH: 6,

  // Generate a random OTP
  generate() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("[otp] OTP Generated", { otp });
    return otp;
  },

  // Get expiration date
  getExpirationDate() {
    return new Date(Date.now() + this.EXPIRATION);
  },

  // Check if OTP is expired
  isExpired(expirationDate) {
    return new Date() > new Date(expirationDate);
  },
};
