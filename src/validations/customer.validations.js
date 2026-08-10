import * as yup from "yup";

export const customerSchema = yup.object({
  name: yup.string().required("Customer name is required").min(2, "Name must be at least 2 characters"),
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

export const updateCustomerSchema = yup.object({
  name: yup.string().min(2, "Name must be at least 2 characters"),
  email: yup.string().email("Invalid email format"),
  password: yup.string().min(6, "Password must be at least 6 characters"),
  phone: yup
    .string()
    .test("is-valid-phone", "Please enter a valid phone number", function (value) {
      if (!value || value.trim() === "") return true;
      const cleaned = value.replace(/[\s\-\(\)\+]/g, "");
      return /^\d{8,15}$/.test(cleaned);
    }),
  status: yup.string().oneOf(["active", "inactive"]),
});
