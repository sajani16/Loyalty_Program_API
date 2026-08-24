import Business from "../models/Business.js";

export async function createBusiness(businessObj) {
  const business = new Business(businessObj);
  return business.save();
}

export async function findUserByEmail(email) {
  return Business.findOne({ email, isDeleted: false })
    .select("-isDeleted")
    .lean();
}

export async function findBusinessByEmail(email) {
  return Business.findOne({ email, isDeleted: false })
    .select("-isDeleted")
    .lean();
}

export async function findBusinessByEmailWithPassword(email) {
  return Business.findOne({ email, isDeleted: false })
    .populate("role")
    .lean();
}

export async function findBusinessById(id) {
  return Business.findOne({ _id: id, isDeleted: false })
    .select(
      "-password -isDeleted -updatedAt -createdAt -otp -otpExpires -resetPasswordToken -resetPasswordExpires -__v",
    )
    .populate("role")
    .lean();
}

export async function findBusinessByIdWithPassword(id) {
  return Business.findOne({ _id: id, isDeleted: false })
    .populate("role")
    .lean();
}

export async function findUserById(id) {
  return Business.findOne({ _id: id, isDeleted: false })
    .select(
      "-password -isDeleted -updatedAt -createdAt -otp -otpExpires -resetPasswordToken -resetPasswordExpires -__v",
    )
    .populate("role")
    .lean();
}

export async function updateBusiness(id, update) {
  return Business.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
    new: true,
  }).lean();
}

export async function updateUser(id, update) {
  return Business.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
    new: true,
  }).lean();
}

export async function deleteBusiness(id) {
  return Business.findByIdAndUpdate(id, { isDeleted: true }, { new: true })
    .lean();
}

export async function findBusinessByResetToken(resetPasswordToken) {
  return Business.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: new Date() },
    isDeleted: false,
  })
    .select("-isDeleted -updatedAt -createdAt")
    .lean();
}

export async function listBusinesses(filter, options) {
  const data = await Business.paginate(filter, options);
  return data;
}
