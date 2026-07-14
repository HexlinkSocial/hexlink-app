import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX } from "react";
import { theme } from "../styles/LoginTheme";
import { logger } from "../helpers/logger";
import AuthSuccessRedirect from "../components/helpers/AuthSuccessRedirect";

const LOGIN_FORM_FIELDS = {
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

export default function Login(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <div className="auth-page">
        <div className="auth-flex-overlay">
          <Authenticator
            hideSignUp={true}
            formFields={LOGIN_FORM_FIELDS}
            loginMechanisms={["email"]}
          >
            {({ user }) => {
              if (user == null) {
                logger.error("Failed to log in user");
              }
              return <AuthSuccessRedirect />;
            }}
          </Authenticator>
        </div>
      </div>
    </ThemeProvider>
  );
}
