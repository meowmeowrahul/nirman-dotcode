import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  markAllNotificationsRead,
  getMyNotifications,
} from "../../api/endpoints";
import { getApiErrorMessage } from "../../api/error";
import { PageHeader } from "../../components/PageHeader";
import { useI18n } from "../../i18n/language";

export function NotificationsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["myNotifications"],
    queryFn: () => getMyNotifications(100),
    refetchInterval: 5000,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  return (
    <section className="card stack">
      <PageHeader
        title={t("Notifications")}
        subtitle={t("Latest updates and workflow events for your account.")}
      />

      <div className="row gap-12" style={{ justifyContent: "space-between" }}>
        <p className="muted-text">
          {unreadCount > 0
            ? `${unreadCount} ${
                unreadCount === 1
                  ? t("unread notification")
                  : t("unread notifications")
              }`
            : t("All notifications are read")}
        </p>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending || unreadCount === 0}
        >
          {markAllMutation.isPending ? t("Marking...") : t("Mark all as read")}
        </button>
      </div>

      {isLoading && (
        <p className="muted-text">{t("Loading notifications...")}</p>
      )}
      {!isLoading && error && (
        <p className="error-banner">
          {getApiErrorMessage(error, t("Unable to load notifications"))}
        </p>
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <div className="empty-state">
          <p>{t("No notifications yet.")}</p>
        </div>
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <div className="list-grid">
          {notifications.map((item) => {
            const meta = item.meta || {};
            const transactionId =
              typeof meta.transaction_id === "string"
                ? meta.transaction_id
                : null;
            const city = typeof meta.city === "string" ? meta.city : null;

            return (
              <article
                key={item.id}
                className="card"
                style={{
                  borderColor: item.is_read ? "#e5e7eb" : "#f97316",
                  backgroundColor: item.is_read ? "#ffffff" : "#fff8f2",
                }}
              >
                <div
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", margin: 0 }}>{item.title}</h3>
                  <span
                    className={`status-chip ${item.is_read ? "tone-pending" : "tone-warning"}`}
                  >
                    {item.is_read ? t("Read") : t("New")}
                  </span>
                </div>
                <p style={{ marginBottom: "8px" }}>{item.message}</p>
                <p className="muted-text" style={{ marginBottom: "4px" }}>
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                  })}
                </p>
                <p className="mono" style={{ marginBottom: 0 }}>
                  {t("Type")}: {item.type}
                  {transactionId
                    ? ` • ${t("Transaction")}: ${transactionId}`
                    : ""}
                  {city ? ` • ${t("City")}: ${city}` : ""}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
