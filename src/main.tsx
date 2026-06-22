import "./helpers/amplifyConfig";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./App";
import { Authenticator } from "@aws-amplify/ui-react";
import "./styles/main.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator.Provider>
      <RouterProvider router={router} />
    </Authenticator.Provider>
  </React.StrictMode>,
);
