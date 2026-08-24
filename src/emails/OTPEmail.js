import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Img,
} from "@react-email/components";
import React from "react";

const LOGO_URL =
  "https://LoyaltyHublink.s3.ap-southeast-2.amazonaws.com/images/LoyaltyHub.svg";

export default function OTPEmail({
  name,
  otp,
  purpose = "verification",
}) {
  const purposeText =
    purpose === "reset" ? "Password Reset" : "Email Verification";
  const message =
    purpose === "reset"
      ? "You requested to reset your password. Use the code below to proceed."
      : "Thank you for signing up! Use the code below to verify your email address.";
  const preview =
    purpose === "reset"
      ? "Reset your LoyaltyHub password"
      : "Verify your email for LoyaltyHub";

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, preview),
    React.createElement(
      Body,
      { style: bodyStyle },
      React.createElement(
        Container,
        { style: containerStyle },
        React.createElement(
          Section,
          { style: headerBandStyle },
          React.createElement(Img, {
            src: LOGO_URL,
            alt: "LoyaltyHub",
            style: logoStyle,
          })
        ),
        React.createElement(
          Section,
          { style: contentStyle },
          React.createElement(Heading, { style: headingStyle }, purposeText),
          React.createElement(
            Text,
            { style: subHeadingStyle },
            "Hi ",
            React.createElement("strong", null, name),
            React.createElement("br", null),
            React.createElement("br", null),
            message
          ),
          React.createElement(Hr, { style: dividerStyle }),
          React.createElement(
            Section,
            { style: otpBoxStyle },
            React.createElement(Text, { style: otpLabelStyle }, "Your verification code"),
            React.createElement(Text, { style: otpValueStyle }, otp)
          ),
          React.createElement(
            Text,
            { style: warningStyle },
            "This code expires in ",
            React.createElement("strong", null, "5 minutes"),
            ". Do not share it with anyone."
          ),
          React.createElement(Hr, { style: dividerStyle }),
          React.createElement(
            Text,
            { style: footerTextStyle },
            "If you didn't request this, you can safely ignore this email."
          )
        )
      )
    )
  );
}

const bodyStyle = {
  backgroundColor: "#f4f6f8",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "0",
  maxWidth: "560px",
  margin: "32px auto",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const headerBandStyle = {
  backgroundColor: "#0f3252",
  padding: "22px 24px",
  textAlign: "left",
};

const logoStyle = {
  width: "170px",
  height: "auto",
  display: "block",
};

const contentStyle = {
  padding: "32px",
};

const headingStyle = {
  textAlign: "center",
  color: "#0f3252",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const subHeadingStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.7",
  marginBottom: "20px",
};

const dividerStyle = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const otpBoxStyle = {
  backgroundColor: "#eff4f8",
  padding: "24px",
  borderRadius: "0",
  border: "1px solid #e3ebf2",
  textAlign: "center",
};

const otpLabelStyle = {
  fontSize: "11px",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  color: "#0f3252",
  marginBottom: "10px",
  marginTop: "0",
};

const otpValueStyle = {
  fontSize: "36px",
  color: "#0f3252",
  fontWeight: "800",
  letterSpacing: "8px",
  margin: "0",
};

const warningStyle = {
  fontSize: "13px",
  color: "#64748b",
  textAlign: "center",
  marginTop: "20px",
  fontStyle: "italic",
};

const footerTextStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  textAlign: "center",
  lineHeight: "1.6",
};
