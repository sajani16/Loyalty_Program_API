import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export const EMAIL_FROM = process.env.RESEND_SENDER || "onboarding@resend.dev";

export default resend;
