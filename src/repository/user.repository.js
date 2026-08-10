import User from "../models/User.js";

export async function createUser(userObj) {
  const user = new User(userObj);
  return user.save();
}

export async function findUserByEmail(email) {
  return User.findOne({ email, isDeleted: false })
    .select("-isDeleted")
    .lean();
}

export async function findUserByEmailWithPassword(email) {
  return User.findOne({ email, isDeleted: false })
    .populate("role")
    .lean();
}

export async function findUserById(id) {
  return User.findOne({ _id: id, isDeleted: false })
    .select(
      "-password -isDeleted -updatedAt -createdAt -otp -otpExpires -resetPasswordToken -resetPasswordExpires -__v",
    )
    .populate("role")
    .lean();
}

export async function updateUser(id, update) {
  return User.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
    new: true,
  }).lean();
}

export async function findUserByResetToken(resetPasswordToken) {
  return User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: new Date() },
    isDeleted: false,
  })
    .select("-isDeleted -updatedAt -createdAt")
    .lean();
}

