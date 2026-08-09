import * as userService from "../services/user.services.js";

export const register = async (req, res, next) => {
  try {
    const result = await userService.registerUser({
      ...req.body,
      userType: "admin",
    });
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes("already registered")) {
      res.status(409).json({ success: false, message: err.message });
      return;
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser({ email, password });
    res.json(result);
  } catch (err) {
    if (err.code === "EMAIL_NOT_VERIFIED") {
      res.status(403).json({
        success: false,
        data: { email: err.email, requiresVerification: true },
        message: err.message,
      });
      return;
    }
    if (err.code === "ACCOUNT_INACTIVE") {
      res.status(403).json({ success: false, data: null, message: err.message });
      return;
    }
    if (err.message === "Invalid credentials") {
      res.status(401).json({ success: false, message: err.message });
      return;
    }
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP are required" });
      return;
    }
    const result = await userService.verifyOTP({ email, otp });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }
    const result = await userService.resendOTP({ email });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await userService.forgotPassword(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP are required" });
      return;
    }
    const result = await userService.verifyResetOTP({ email, otp });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const resendResetOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }
    const result = await userService.forgotPassword(email);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
      return;
    }
    const result = await userService.resetPassword({ token, newPassword });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const result = await userService.getProfileService(req.user.id);
    res.json({ success: true, data: result, message: "Profile fetched" });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    await userService.updateUserService(req.user.id, req.body);
    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, search, userType } = req.query;

    const filter = {
      isDeleted: false,
      userType: { $in: ["admin", "superadmin"] },
    };

    if (status) filter.status = status;
    if (userType) filter.userType = userType;
    if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, "i") } },
        { email: { $regex: new RegExp(search, "i") } },
      ];
    }

    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      select: "-password -isDeleted -otp -otpExpires -resetPasswordToken -resetPasswordExpires",
    };

    const result = await userService.getUsers(filter, options);
    res.json({
      success: true,
      data: result.docs,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.totalDocs,
        pages: result.totalPages,
      },
      message: "Users fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const result = await userService.findUserByIdService(req.params.id);
    res.json({ success: true, data: result, message: "User fetched" });
  } catch (err) {
    if (err.message === "User not found") {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    await userService.updateUserService(req.params.id, req.body);
    res.json({ success: true, message: "User updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUserService(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const createUserByAdmin = async (req, res, next) => {
  try {
    const result = await userService.registerUser({
      ...req.body,
      userType: req.body.userType || "admin",
    });
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes("already registered")) {
      res.status(409).json({ success: false, message: err.message });
      return;
    }
    next(err);
  }
};
