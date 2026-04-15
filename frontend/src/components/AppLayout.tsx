import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types/domain";

interface NavItem {
  to: string;
  label: string;
}

const navByRole: Record<Role, NavItem[]> = {
  BENEFICIARY: [
    { to: "/beneficiary/request", label: "Emergency Request" },
    { to: "/escrow/closure", label: "Escrow Closure" },
  ],
  CONTRIBUTOR: [{ to: "/escrow/closure", label: "Escrow Closure" }],
  TECHNICIAN: [
    { to: "/technician/verify", label: "Verify Cylinder" },
    { to: "/technician/handover", label: "Handover" },
  ],
  WARDEN: [{ to: "/warden/kyc", label: "KYC Governance" }],
};

export function AppLayout() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);

  const links = role ? navByRole[role] : [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/dashboard">
          SecureLPG
        </Link>
        <nav className="topnav" aria-label="Role navigation">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx("nav-link", isActive && "nav-link-active")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="secondary-btn"
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </header>
      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  );
}
