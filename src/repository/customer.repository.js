import Customer from "../models/Customer.js";

export async function createCustomer(customerObj) {
  const customer = new Customer(customerObj);
  return customer.save();
}

export async function findUserByEmail(email) {
  return Customer.findOne({ email, isDeleted: false })
    .select("-isDeleted")
    .lean();
}

export async function findCustomerByEmail(email) {
  return Customer.findOne({ email, isDeleted: false })
    .select("-isDeleted")
    .lean();
}

export async function findCustomerByEmailWithPassword(email) {
  return Customer.findOne({ email, isDeleted: false })
    .populate("role")
    .lean();
}

export async function findCustomerById(id) {
  return Customer.findOne({ _id: id, isDeleted: false })
    .select(
      "-password -isDeleted -updatedAt -createdAt -otp -otpExpires -resetPasswordToken -resetPasswordExpires -__v",
    )
    .populate("role")
    .lean();
}

export async function findCustomerByIdWithPassword(id) {
  return Customer.findOne({ _id: id, isDeleted: false })
    .populate("role")
    .lean();
}

export async function findUserById(id) {
  return Customer.findOne({ _id: id, isDeleted: false })
    .select(
      "-password -isDeleted -updatedAt -createdAt -otp -otpExpires -resetPasswordToken -resetPasswordExpires -__v",
    )
    .populate("role")
    .lean();
}

export async function updateCustomer(id, update) {
  return Customer.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
    new: true,
  }).lean();
}

export async function updateUser(id, update) {
  return Customer.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
    new: true,
  }).lean();
}

export async function deleteCustomer(id) {
  return Customer.findByIdAndUpdate(id, { isDeleted: true }, { new: true })
    .lean();
}

export async function findCustomerByResetToken(resetPasswordToken) {
  return Customer.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: new Date() },
    isDeleted: false,
  })
    .select("-isDeleted -updatedAt -createdAt")
    .lean();
}

export async function listCustomers(filter, options) {
  const data = await Customer.paginate(filter, options);
  return data;
}
