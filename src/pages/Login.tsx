import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { theme } from "../styles/LoginTheme";

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
            loginMechanisms={["email"]}
            formFields={LOGIN_FORM_FIELDS}
          >
            {() => <Navigate to="/sampleAdminPage" replace />}
          </Authenticator>
        </div>
      </div>
    </ThemeProvider>
  );
}
