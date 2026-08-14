import { Navigate } from "react-router-dom";

/**
 * Guards a route behind a session.
 *
 * `role="any"` (the default) accepts either an admin or a rep, which is what
 * the proposal screens need — admins reach them from All Events, reps reach
 * them at the end of the booking flow.
 */
export default function UserProtectedRoute({ children, role = "any" }) {
  const userToken = sessionStorage.getItem("userToken");
  const adminToken = sessionStorage.getItem("adminToken");

  if (role === "admin") {
    return adminToken ? children : <Navigate to="/admin" replace />;
  }

  if (role === "user") {
    return userToken ? children : <Navigate to="/" replace />;
  }

  if (userToken || adminToken) return children;

  return <Navigate to="/" replace />;
}
