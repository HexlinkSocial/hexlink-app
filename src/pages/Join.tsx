import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../styles/LoginTheme";
import "../styles/Login.css";

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

function AuthSuccessRedirect(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return <div />;
}

export default function Join(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <div className="login-page-container">
        <div className="login-flex-overlay">
          <Authenticator formFields={FORM_FIELDS} loginMechanisms={["email"]}>
            {() => <AuthSuccessRedirect />}
          </Authenticator>
        </div>
      </div>
    </ThemeProvider>
  );
}
