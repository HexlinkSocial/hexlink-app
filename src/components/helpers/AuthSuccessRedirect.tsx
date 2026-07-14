import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { JSX } from "react/jsx-runtime";

function AuthSuccessRedirect(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return <div />;
}

export default AuthSuccessRedirect;