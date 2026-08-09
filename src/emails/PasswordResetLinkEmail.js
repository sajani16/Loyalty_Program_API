import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Img,
  Link,
} from "@react-email/components";
import React from "react";

const LOGO_URL =
  "https://smartqrlink.s3.ap-southeast-2.amazonaws.com/images/smartQR.svg";

export default function PasswordResetLinkEmail({
  name,
  resetUrl,
}) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "Reset your SmartQR password"),
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
            alt: "SmartQr",
            style: logoStyle,
          })
        ),
        React.createElement(
          Section,
          { style: contentStyle },
          React.createElement(Heading, { style: headingStyle }, "Reset Your Password"),
          React.createElement(
            Text,
            { style: paragraphStyle },
            "Hi ",
            React.createElement("strong", null, name || "there"),
            ","
          ),
          React.createElement(
            Text,
            { style: paragraphStyle },
            "We received a request to reset your password. Click the button below to continue."
          ),
          React.createElement(
            Section,
            { style: ctaWrapStyle },
            React.createElement(
              Link,
              { href: resetUrl, style: buttonStyle },
              "Reset Password"
            )
          ),
          React.createElement(
            Text,
            { style: smallNoteStyle },
            "This link expires in 10 minutes. If you did not request this, you can safely ignore this email."
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
  maxWidth: "560px",
  margin: "32px auto",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const headerBandStyle = {
  backgroundColor: "#0f3252",
  padding: "22px 24px",
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

const paragraphStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const ctaWrapStyle = {
  textAlign: "center",
  margin: "24px 0",
};

const buttonStyle = {
  display: "inline-block",
  backgroundColor: "#0f3252",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 700,
  padding: "12px 22px",
};

const smallNoteStyle = {
  color: "#64748b",
  fontSize: "13px",
  textAlign: "center",
  lineHeight: "1.6",
  margin: "6px 0 0",
};
