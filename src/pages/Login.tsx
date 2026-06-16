import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { theme } from "../styles/LoginTheme";
import "../styles/Login.css";

export default function Login(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <div className="login-page-container">
        <div className="login-flex-overlay">
          <Authenticator
            hideSignUp={true}
            formFields={{
              forgotPassword: {
                username: {
                  label: "Enter your email",
                  placeholder: "Email",
                  type: "email",
                  required: true,
                },
              },
            }}
          >
            {() => <Navigate to="/sampleAdminPage" replace />}
          </Authenticator>
        </div>
      </div>
    </ThemeProvider>
  );
}
