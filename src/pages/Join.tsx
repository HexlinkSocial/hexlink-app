import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { theme } from "../styles/LoginTheme";
import { logger } from "../helpers/logger";
import AuthSuccessRedirect from "../components/helpers/AuthSuccessRedirect";

const PENDING_KEY = "pendingCommunityPayload";
const FORM_FIELDS = {
  signUp: {
    email: {
      label: "Email",
      placeholder: "Email",
      type: "email",
      required: true,
      order: 1,
    },
    password: {
      order: 2,
    },
    confirm_password: {
      order: 3,
    },
  },
  signIn: {
    username: {
      label: "Email",
      placeholder: "email@example.com",
      type: "email",
    },
  },
  forgotPassword: {
    email: {
      label: "Enter your email",
      placeholder: "Email",
      type: "email",
      required: true,
    },
  },
};

function hasPendingPayload(): boolean {
  return sessionStorage.getItem(PENDING_KEY) !== null;
}

export default function Join(): JSX.Element {
  if (!hasPendingPayload()) {
    return <Navigate to="/" replace />;
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="auth-page">
        <div className="auth-flex-overlay">
          <Authenticator formFields={FORM_FIELDS} loginMechanisms={["email"]}>
            {({ user }) => {
              if (user == null) {
                logger.error("Failed to authenticate user");
              }
              return <AuthSuccessRedirect />;
            }}
          </Authenticator>
        </div>
      </div>
    </ThemeProvider>
  );
}
