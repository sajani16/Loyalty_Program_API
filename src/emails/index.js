import { render } from "@react-email/render";
import { createElement } from "react";
import resend, { EMAIL_FROM } from "../config/resend.js";
import WelcomeEmail from "./WelcomeEmail.js";
import OTPEmail from "./OTPEmail.js";
import PasswordResetLinkEmail from "./PasswordResetLinkEmail.js";
import MemberInviteEmail from "./CustomerInviteEmail.js";

export const sendOTPEmail = async ({
  email,
  name,
  otp,
  purpose = "verification",
}) => {
  const subject =
    purpose === "reset"
      ? "Reset your password — SmartQR"
      : "Verify your email — SmartQR";

  const html = await render(createElement(OTPEmail, { name, otp, purpose }));

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject,
    html,
  });
};

export const sendPasswordResetLinkEmail = async ({
  email,
  name,
  resetUrl,
}) => {
  const html = await render(
    createElement(PasswordResetLinkEmail, { name, resetUrl }),
  );

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Reset your password — SmartQR",
    html,
  });
};

export const sendCustomerInvitationEmail = async ({
  email,
  firstName,
  password,
  loginUrl,
  businessName,
  inviterName,
}) => {
  const html = await render(
    createElement(MemberInviteEmail, {
      memberName: firstName,
      businessName,
      inviteLink: loginUrl,
      password,
      expiresIn: "48 hours",
      email: email,
    }),
  );

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Invitation to join ${businessName} on SmartQR`,
    html,
  });
};

export const sendWelcomeEmail = async ({
  email,
  password,
  loginUrl,
  isNewBusiness = false,
}) => {
  const html = await render(
    createElement(WelcomeEmail, { email, password, loginUrl, isNewBusiness }),
  );

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Welcome to SmartQR — Your Restaurant Account is Ready!",
    html,
  });
};



