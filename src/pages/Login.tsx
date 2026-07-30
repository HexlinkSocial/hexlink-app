import { Authenticator, ThemeProvider, Text, Link as AmplifyLink } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX } from "react";
import { Navigate, Link as RouterLink } from "react-router-dom";
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

function RegistrationInfoNotice(): JSX.Element {
  return (
    <div className="auth-info-notice">
      <Text variation="primary">
        Looking for the register button? You can only register if you&apos;re
        adding a community. You can do this by clicking tiles on the{" "}
        <AmplifyLink as={RouterLink} to="/">
          map
        </AmplifyLink>
        .
      </Text>
    </div>
  );
}

function SignInHeader(): JSX.Element {
  return (
    <div className="auth-nav-container">
      <RouterLink to="/" className="auth-nav-link">
        <ArrowIcon />
        Home
      </RouterLink>
    </div>
  );
}

function SignInFooter(): JSX.Element {
  return <RegistrationInfoNotice />;
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
                Footer: SignInFooter,
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