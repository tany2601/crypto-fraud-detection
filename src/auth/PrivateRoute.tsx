import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PrivateRoute = () => {
  const { token, loading } = useAuth();
  if (loading) return null; // or a spinner
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};
export default PrivateRoute;
