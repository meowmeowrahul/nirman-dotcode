import { useAuthStore } from "../../store/authStore";
import { PageHeader } from "../../components/PageHeader";
import { StatusChip } from "../../components/StatusChip";

export function DashboardPage() {
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.userId);
  const regionId = useAuthStore((state) => state.regionId);
  const profileCompleted = useAuthStore((state) => state.profileCompleted);

  return (
    <section className="card">
      <PageHeader
        title="Role Dashboard"
        subtitle="Use the top navigation to continue your assigned workflow."
      />
      <div className="info-grid">
        <div>
          <p className="muted-text">Role</p>
          <p className="mono">{role}</p>
        </div>
        <div>
          <p className="muted-text">User ID</p>
          <p className="mono">{userId}</p>
        </div>
        <div>
          <p className="muted-text">Region ID</p>
          <p className="mono">{regionId || "N/A"}</p>
        </div>
        <div>
          <p className="muted-text">Profile</p>
          <StatusChip
            label={profileCompleted ? "COMPLETED" : "PENDING"}
            tone={profileCompleted ? "success" : "pending"}
          />
        </div>
      </div>
    </section>
  );
}
