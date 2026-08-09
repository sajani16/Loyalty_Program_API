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

export default function MemberInviteEmail({
  memberName = "",
  businessName,
  inviteLink,
  password = "",
  expiresIn = "48 hours",
  email = "",
}) {
  const memberEmail = email || memberName;

  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `You're invited to join ${businessName}`),
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
            alt: "SmartQR",
            width: "120",
            style: logoStyle,
          })
        ),
        React.createElement(
          Section,
          { style: contentStyle },
          React.createElement(Heading, { style: headingStyle }, "You're invited"),
          React.createElement(
            Text,
            { style: paragraphStyle },
            "Hi ",
            React.createElement("strong", null, memberName || "there"),
            ","
          ),
          React.createElement(
            Text,
            { style: paragraphStyle },
            "You've been invited by ",
            React.createElement("strong", null, businessName),
            " to join SmartQR."
          ),
          React.createElement(
            Text,
            { style: paragraphStyle },
            "Get started by clicking the button below to accept your invitation and set up your account."
          ),
          React.createElement(
            Section,
            { style: ctaWrapStyle },
            React.createElement(
              Link,
              { href: inviteLink, style: buttonStyle },
              "Accept Invitation"
            )
          ),
          password &&
            React.createElement(
              Section,
              { style: passwordBoxStyle },
              React.createElement(
                Text,
                { style: passwordLabelStyle },
                "Your login credentials:"
              ),
              React.createElement(
                Text,
                { style: passwordMutedStyle },
                "Email: ",
                React.createElement("strong", null, memberEmail)
              ),
              React.createElement(
                Text,
                { style: passwordLabelStyle },
                `Password: ${password}`
              ),
              React.createElement(
                Text,
                { style: passwordMutedStyle },
                "Please change your password after logging in."
              )
            ),
          React.createElement(
            Text,
            { style: smallNoteStyle },
            `This link expires in ${expiresIn}. If you didn't expect this invitation, you can ignore this email.`
          )
        )
      )
    )
  );
}

const bodyStyle = { backgroundColor: "#f4f6f8" };

const containerStyle = {
  backgroundColor: "#ffffff",
  maxWidth: "620px",
  margin: "28px auto",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const headerBandStyle = {
  backgroundColor: "#0f3252",
  padding: "20px 24px",
};

const logoStyle = {
  display: "block",
};

const contentStyle = { padding: "28px 24px" };

const headingStyle = {
  margin: "0 0 12px",
  color: "#0f3252",
  fontSize: "28px",
  fontWeight: 700,
};

const paragraphStyle = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0 0 14px",
};

const ctaWrapStyle = {
  textAlign: "center",
  margin: "18px 0",
};

const buttonStyle = {
  display: "inline-block",
  backgroundColor: "#0f3252",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 700,
  padding: "12px 26px",
};

const smallNoteStyle = {
  color: "#6b7280",
  fontSize: "13px",
  textAlign: "center",
  marginTop: "8px",
};

const passwordBoxStyle = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  textAlign: "center",
};

const passwordLabelStyle = {
  color: "#4b5563",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 8px",
};

const passwordMutedStyle = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0",
};
