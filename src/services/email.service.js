// import IORedis from "ioredis";
// import { Queue } from "bullmq";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
// export const connection = new IORedis(process.env.REDIS_URL, {
//   maxRetriesPerRequest: null,
//   retryStrategy: (times) => {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
// });

// const emailQueue = new Queue("emailQueue", {
//   connection,
//   defaultJobOptions: {
//     attempts: 3,
//     backoff: { type: "exponential", delay: 1000 },
//     removeOnComplete: 100,
//     removeOnFail: 50,
//   },
// });

/** Extract address from `Name <email@domain.com>` or plain email. */
const parseResendSenderEmail = (sender = process.env.RESEND_SENDER) => {
  const raw = String(sender ?? "").trim();
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim();
};

/**
 * Build Resend `from` with document owner as display name:
 * `{userName} - Golo Sign <info@golosign.com>`
 */
export const buildResendFrom = (userName) => {
  const email = parseResendSenderEmail();
  const name = String(userName ?? "").trim();
  if (!name || !email) return process.env.RESEND_SENDER;
  return `${name} - Golo Sign <${email}>`;
};

export const sendEmail = async (mailOptions) => {
  const { to, subject, html, cc, bcc, replyTo, attachments, from } =
    mailOptions;

  const { data, error } = await resend.emails.send({
    from: from ?? process.env.RESEND_SENDER,
    to,
    subject,
    html,
    ...(cc && { cc }),
    ...(bcc && { bcc }),
    ...(replyTo && { reply_to: replyTo }),
    ...(attachments && { attachments }),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  // data.id is the Resend email ID for webhook correlation
  return data;
};

/** Retrieve email events from Resend for a specific email ID */
export const getResendEmailEvents = async (emailId) => {
  try {
    const { data, error } = await resend.emails.get(emailId);
    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

/**
 * Add generic email job to queue.
 *
 * options:
 * {
 *   to, subject,
 *   type: 'template' | 'html' | 'raw', // default 'template' when templateName present
 *   templateName, templateData,
 *   html,
 *   cc, bcc, replyTo, attachments,
 *   meta // optional object for monitoring / notification metadata
 * }
 */
export const addEmailJob = async (options = {}, jobOpts = {}) => {
  const job = await emailQueue.add("send-email", options, jobOpts);
  return job;
};

export const sendEnquiryEmailUserJob = async (emailPayload) => {
  return addEmailJob({
    to: emailPayload.email,
    subject: "Thank You for Reaching Out!",
    type: "template",
    templateName: "EnquiryEmailUser",
    templateData: emailPayload,
    meta: { purpose: "enquiry" },
  });
};

export const sendWelcomeEmailJob = async (emailPayload) => {
  return addEmailJob({
    to: emailPayload.email,
    subject: "Welcome to Golo Sign!",
    type: "template",
    templateName: "WelcomeEmail",
    templateData: emailPayload,
    meta: { purpose: "welcome" },
  });
};

export const sendPasswordResetEmailJob = async (emailPayload) => {
  return addEmailJob({
    to: emailPayload.email,
    subject: "Reset your password",
    type: "template",
    templateName: "WelcomeEmail",
    templateData: emailPayload,
    meta: { purpose: "password-reset" },
  });
};

export const sendOTPEmailJob = async (emailPayload) => {
  return addEmailJob({
    to: emailPayload.email,
    subject:
      emailPayload.purpose === "reset"
        ? "Password Reset Code"
        : "Verify Your Email",
    type: "template",
    templateName: "OTPEmail",
    templateData: emailPayload,
    meta: {
      purpose: "otp-verification",
    },
  });
};

/**
 * Send an OTP email immediately via Resend, bypassing the BullMQ/Redis queue.
 */
export const sendOTPEmailNow = async (emailPayload) => {
  const { sendOTPEmail } = await import("../emails/index.js");
  return sendOTPEmail({
    email: emailPayload.email,
    name: emailPayload.name,
    otp: emailPayload.otp,
    purpose: emailPayload.purpose || "verification",
  });
};


export const sendPaymentSuccessEmailJob = async (emailPayload) => {
  return addEmailJob({
    to: emailPayload.email,
    subject: `Payment Successful - ${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: emailPayload.currency || "AUD",
    }).format(emailPayload.amount)} - Invoice ${emailPayload.invoiceNumber}`,
    type: "template",
    templateName: "PaymentSuccessfulEmail",
    templateData: emailPayload,
    attachments: emailPayload.invoicePdf ? [
      {
        path: emailPayload.invoicePdf,
        filename: `Invoice_${emailPayload.invoiceNumber}.pdf`,
      },
    ] : [],
    meta: { purpose: "payment-success-with-invoice" },
  });
};

export const sendSubscriptionSuccessEmailJob = async (emailPayload) => {
  return addEmailJob({
    to: emailPayload.email,
    subject: emailPayload.trialDays > 0 ? "Your Free Trial Has Started!" : "Subscription Activated Successfully!",
    type: "template",
    templateName: "SubscriptionSuccessEmail",
    templateData: emailPayload,
    meta: { purpose: "subscription-success" },
  });
};

