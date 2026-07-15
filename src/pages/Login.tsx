import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX } from "react";
import { Navigate, Link } from "react-router-dom";
import { theme } from "../styles/LoginTheme";
import { logger } from "../helpers/logger";
import ArrowIcon from "../components/icons/ArrowIcon";

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

function SignInHeader(): JSX.Element {
  return (
    <div className="auth-nav-container">
      <Link to="/" className="auth-nav-link">
        <ArrowIcon />
        Home
      </Link>
    </div>
  );
}

export default function Login(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <div className="auth-page">
        <div className="auth-flex-overlay">
          <Authenticator
            hideSignUp={true}
            formFields={LOGIN_FORM_FIELDS}
            loginMechanisms={["email"]}
            components={{
              SignIn: {
                Header: SignInHeader,
              },
            }}
          >
            {({ user }) => {
              if (user == null) {
                logger.error("Failed to log in user");
              }
              return <Navigate to="/manage" replace />;
            }}
          </Authenticator>
        </div>
      </div>
    </ThemeProvider>
  );
}