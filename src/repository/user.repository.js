import User from "../models/User.js";

export async function createUser(userObj) {
  const user = new User(userObj);
  return user.save();
}

export async function findUserByEmail(email) {
  return User.findOne({ email, isDeleted: false }).select("-isDeleted").lean();
}

export async function findUserByPhone(phone) {
  return User.findOne({ phone, isDeleted: false }).select("-isDeleted").lean();
}

export async function findUserById(id) {
  return User.findOne({ _id: id, isDeleted: false })
    .select(
      `
      -password
      -isDeleted
      -updatedAt
      -createdAt
      -otp
      -otpExpires
      -resetPasswordToken
      -resetPasswordExpires
      -__v
      `,
    )
    .lean();
}

export async function findUserByIdWithPw(id) {
  return User.findOne({ _id: id, isDeleted: false })
    .select("-isDeleted -updatedAt -createdAt")
    .lean();
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

export async function updateUser(id, update) {
  return User.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
    new: true,
  }).lean();
}

export async function listUsers(filter, options) {
  // return User.find({ ...filter, isDeleted: false })
  //   .sort({
  //     createdAt: -1,
  //   })
  //   .select("-updatedAt -password -isDeleted")
  //   .populate("roles")
  //   .lean();
  const data = await User.paginate(filter, options);
  return data;
}
export async function listUsersDropdown(filter = {}) {
  return User.find({
    ...filter,
    isDeleted: false,
    status: "active",
  })
    .sort({
      createdAt: -1,
    })
    .select("name _id email")
    .lean();
}

export async function deleteUser(id) {
  return User.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
}

export async function getAllUsersForDropdown(filter = {}) {
  return User.find({
    ...filter,
    isDeleted: false,
    status: "active",
  })
    .sort({
      createdAt: -1,
    })
    .select("name _id email")
    .lean();
}
