import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { signUp } from "aws-amplify/auth";
import { theme } from "../styles/LoginTheme";
import { logger } from "../helpers/logger";
import AuthSuccessRedirect from "../components/helpers/AuthSuccessRedirect";

const PENDING_KEY = "pendingCommunityPayload";
const PENDING_TOKEN_KEY = "pendingCaptchaToken";

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

function loadPendingToken(): string | undefined {
  return sessionStorage.getItem(PENDING_TOKEN_KEY) ?? undefined;
}

async function performSignUp(formData: any) {
  const { username, password, options } = formData;
  const captchaToken = loadPendingToken();

  return await signUp({
    username,
    password,
    options: {
      ...options,
      validationData: {
        ...(options?.validationData || {}),
        ...(captchaToken ? { captchaToken } : {}),
      },
    },
  });
}

export default function Join(): JSX.Element {
  if (!hasPendingPayload()) {
    return <Navigate to="/" replace />;
  }

  const services = {
    async handleSignUp(formData: any) {
      return performSignUp(formData);
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="auth-page">
        <div className="auth-flex-overlay">
          <Authenticator
            formFields={FORM_FIELDS}
            loginMechanisms={["email"]}
            services={services}
          >
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
