import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuthStore } from "../store/authStore";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Role } from "../types/domain";
import { useState, useRef, useEffect } from "react";
import { MapPin, Bell, User, LogOut, Globe } from "lucide-react";
import { getMyNotifications } from "../api/endpoints";
import { useI18n } from "../i18n/language";
import type { AppLanguage } from "../i18n/language";

interface NavItem {
  to: string;
  label: string;
}

const navByRole: Record<Role, NavItem[]> = {
  BENEFICIARY: [],
  CONTRIBUTOR: [],
  TECHNICIAN: [],
  WARDEN: [],
};

export function AppLayout() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const role = useAuthStore((state) => state.role);
  const city = useAuthStore((state) => state.city);
  const logout = useAuthStore((state) => state.logout);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());

  const { data: notificationData } = useQuery({
    queryKey: ["myNotifications"],
    queryFn: () => getMyNotifications(100),
    enabled: Boolean(role),
    refetchInterval: 5000,
  });

  const unreadCount = notificationData?.unread_count || 0;

  const languageOptions: Array<{ code: AppLanguage; label: string }> = [
    { code: "en", label: t("English") },
    { code: "hi", label: t("Hindi") },
    { code: "mr", label: t("Marathi") },
  ];

  const links = role ? navByRole[role] : [];

  useEffect(() => {
    if (!role) {
      seenNotificationIdsRef.current.clear();
      return;
    }

    const rows = notificationData?.notifications || [];
    rows
      .filter((item) => !item.is_read)
      .slice(0, 3)
      .forEach((item) => {
        if (!seenNotificationIdsRef.current.has(item.id)) {
          toast(item.title, {
            description: item.message,
          });
          seenNotificationIdsRef.current.add(item.id);
        }
      });
  }, [role, notificationData]);

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
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "44px",
                height: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src="/sahaylpg-logo.png"
                alt="SahayLPG logo"
                style={{ width: "70px", height: "70px", objectFit: "contain" }}
              />
            </span>
            SahayLPG
          </Link>
          <div
            className="city-pill"
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
            <span style={{ fontWeight: 500 }}>{city || t("City not set")}</span>
          </div>
        </div>

        <nav
          className="topnav"
          aria-label={t("Role navigation")}
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
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            position: "relative",
          }}
        >
          <div
            ref={langDropdownRef}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <button
              className="icon-action-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6B7280",
                display: "flex",
                alignItems: "center",
                padding: 0,
              }}
            >
              <Globe size={24} />
            </button>
            {langDropdownOpen && (
              <div
                className="floating-menu"
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
                {languageOptions.map((lang) => (
                  <button
                    className="floating-menu-item"
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
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
                      fontWeight: language === lang.code ? 700 : 400,
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#F3F4F6")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="icon-action-btn notification-btn"
            onClick={() => navigate("/notifications")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
              position: "relative",
              display: "flex",
              alignItems: "center",
              padding: 0,
            }}
            aria-label={t("Open notifications")}
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span
                className="notif-dot"
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  backgroundColor: "#DC2626",
                  borderRadius: "9999px",
                }}
              />
            )}
          </button>

          <div
            ref={dropdownRef}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <button
              className="profile-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                className="profile-avatar"
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
                className="floating-menu user-menu"
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
                  className="floating-menu-item"
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
                  <User size={16} /> {t("Profile")}
                </button>
                <button
                  className="floating-menu-item logout-item"
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
                  <LogOut size={16} /> {t("Logout")}
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
