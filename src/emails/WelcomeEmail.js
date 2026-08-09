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
  Link,
  Img,
} from "@react-email/components";
import React from "react";

const LOGO_URL =
  "https://smartqrlink.s3.ap-southeast-2.amazonaws.com/images/smartQR.svg";

export default function WelcomeEmail({
  email,
  password,
  loginUrl,
  isNewBusiness = false,
}) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(Preview, null, "Welcome to SmartQR!"),
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
            style: logoStyle,
          })
        ),
        React.createElement(
          Section,
          { style: contentStyle },
          React.createElement(Heading, { style: headingStyle }, "Welcome to SmartQR!"),
          React.createElement(
            Text,
            { style: subHeadingStyle },
            "Congratulations! Your restaurant application has been approved. Here are your login credentials:"
          ),
          React.createElement(Hr, { style: dividerStyle }),
          React.createElement(
            Section,
            { style: credentialsBoxStyle },
            React.createElement(Text, { style: credentialLabelStyle }, "Email"),
            React.createElement(Text, { style: credentialValueStyle }, email),
            React.createElement(Text, { style: credentialLabelStyle }, "Password"),
            React.createElement(Text, { style: credentialValueStyle }, password)
          ),
          isNewBusiness &&
            React.createElement(
              Section,
              {
                style: {
                  marginTop: "20px",
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                },
              },
              React.createElement(
                Text,
                {
                  style: {
                    fontSize: "14px",
                    color: "#334155",
                    margin: 0,
                    lineHeight: "1.5",
                  },
                },
                "💡 ",
                React.createElement("strong", null, "SmartQR Main Account Created:"),
                " A business account has also been created for you under the same email. You can use these same credentials to sign in and manage your subscriptions at ",
                React.createElement(
                  Link,
                  {
                    href: process.env.FRONTEND_URL || "https://smartqrlink.com",
                    style: linkStyle,
                  },
                  "SmartQR Portal"
                ),
                "."
              )
            ),
          React.createElement(
            Text,
            { style: warningStyle },
            "Please change your password on first login."
          ),
          React.createElement(Hr, { style: dividerStyle }),
          React.createElement(
            Text,
            { style: linkTextStyle },
            "Login to your restaurant portal at: ",
            React.createElement(
              Link,
              { href: loginUrl, style: linkStyle },
              loginUrl
            )
          ),
          React.createElement(
            Text,
            { style: footerTextStyle },
            "If you have any questions, please contact our support team."
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

const credentialsBoxStyle = {
  backgroundColor: "#eff4f8",
  padding: "24px",
  borderRadius: "0",
  border: "1px solid #e3ebf2",
  textAlign: "center",
};

const credentialLabelStyle = {
  fontSize: "11px",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  color: "#0f3252",
  marginBottom: "4px",
  marginTop: "12px",
};

const credentialValueStyle = {
  fontSize: "18px",
  color: "#0f3252",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const warningStyle = {
  fontSize: "13px",
  color: "#64748b",
  textAlign: "center",
  marginTop: "20px",
  fontStyle: "italic",
};

const linkTextStyle = {
  fontSize: "14px",
  color: "#475569",
  textAlign: "center",
  marginTop: "20px",
  lineHeight: "1.6",
};

const linkStyle = {
  color: "#2563eb",
  textDecoration: "underline",
};

const footerTextStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  textAlign: "center",
  lineHeight: "1.6",
};
