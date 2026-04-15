import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types/domain";
import { useState, useRef, useEffect } from "react";
import { MapPin, Bell, User, LogOut, Globe } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
}

const navByRole: Record<Role, NavItem[]> = {
  BENEFICIARY: [],
  CONTRIBUTOR: [],
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const links = role ? navByRole[role] : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(event.target as Node)
      ) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            className="brand"
            to="/dashboard"
            style={{
              fontSize: "1.25rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            SahayLPG
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#F3F4F6",
              padding: "6px 12px",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              color: "#374151",
            }}
          >
            <MapPin size={16} color="#F97316" />
            <span style={{ fontWeight: 500 }}>Kothrud Region, Pune</span>
          </div>
        </div>

        <nav
          className="topnav"
          aria-label="Role navigation"
          style={{ flex: 1, justifyContent: "center" }}
        >
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            position: "relative",
          }}
        >
          <div ref={langDropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6B7280",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Globe size={24} />
            </button>
            {langDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  width: "120px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  zIndex: 50,
                  border: "1px solid #E5E7EB",
                  padding: "4px",
                }}
              >
                {["English", "Hindi", "Marathi"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLangDropdownOpen(false); /* handle language change */
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#374151",
                      borderRadius: "4px",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#F3F4F6")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
            }}
          >
            <Bell size={24} />
          </button>

          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="Profile"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#E5E7EB",
                  objectFit: "cover",
                }}
              />
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  width: "160px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  zIndex: 50,
                  border: "1px solid #E5E7EB",
                  padding: "4px",
                }}
              >
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/profile");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    gap: "8px",
                    color: "#374151",
                    borderRadius: "4px",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#F3F4F6")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <User size={16} /> Profile
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    gap: "8px",
                    color: "#DC2626",
                    borderRadius: "4px",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#FEE2E2")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  );
}
