import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "./Toast";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [menuOpen, setMenuOpen] = useState(false);

  const userToken = sessionStorage.getItem("userToken");
  const adminToken = sessionStorage.getItem("adminToken");

  const closeMenu = () => setMenuOpen(false);

  const logout = () => {
    const wasAdmin = !!adminToken;
    sessionStorage.clear();
    closeMenu();
    toast.success("Signed out.");
    navigate(wasAdmin ? "/admin" : "/", { replace: true });
  };

  const links = adminToken
    ? [{ to: "/allEvents", label: "All Events" }, { to: "/addTemplate", label: "Templates" }, { to: "/addMenu", label: "Menus" }]
    : userToken
      ? [{ to: "/events", label: "Events" }]
      : [{ to: "/", label: "Login" }, { to: "/admin", label: "Admin" }];

  // The auth screens carry their own branding — no chrome needed.
  const isAuthScreen = ["/", "/admin"].includes(location.pathname) && !userToken && !adminToken;
  if (isAuthScreen) return null;

  return (
    <nav className="nav">
      <NavLink to={adminToken ? "/allEvents" : "/events"} className="nav__brand" onClick={closeMenu}>
        <img src="/1.png" alt="Social Catering" />
      </NavLink>

      <button
        className={`nav__toggle ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        <span /><span /><span />
      </button>

      <div className={`nav__menu ${menuOpen ? "is-open" : ""}`}>
        <ul className="nav__links">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {(userToken || adminToken) && (
          <button className="sc-btn sc-btn--ghost sc-btn--sm" onClick={logout}>
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
