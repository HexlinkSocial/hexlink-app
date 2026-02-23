import { Authenticator, ThemeProvider } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { theme } from "../styles/LoginTheme";

export default function Login(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
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
    </ThemeProvider>
  );
}
