import * as yup from "yup";

export const registerSchema = yup.object({
  userType: yup
    .string()
    .oneOf(["customer", "business"], "userType must be customer or business")
    .required("userType is required"),
  name: yup.string().required("Name is required").min(2, "Name must be at least 2 characters"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  phone: yup
    .string()
    .test("is-valid-phone", "Please enter a valid phone number", function (value) {
      if (!value || value.trim() === "") return true; // Allow empty
      const cleaned = value.replace(/[\s\-\(\)\+]/g, "");
      return /^\d{8,15}$/.test(cleaned);
    }),
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required"),
});

export const verifyOtpSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  otp: yup
    .string()
    .length(6, "OTP must be 6 digits")
    .required("OTP is required"),
});

export const resendOtpSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
});

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
});

export const verifyResetOtpSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  otp: yup
    .string()
    .length(6, "OTP must be 6 digits")
    .required("OTP is required"),
});

export const resetPasswordSchema = yup.object({
  token: yup
    .string()
    .required("Reset token is required"),
  newPassword: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
});
