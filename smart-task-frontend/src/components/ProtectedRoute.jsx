import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { isAuthenticated } from "../auth/authService";

function ProtectedRoute({ children }) {
  const [, setAuthTick] = useState(0);

  useEffect(() => {
    const onAuthChanged = () => setAuthTick((x) => x + 1);
    window.addEventListener("stm_auth_changed", onAuthChanged);
    return () => window.removeEventListener("stm_auth_changed", onAuthChanged);
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
