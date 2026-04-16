import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/language";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <section className="card center-card">
      <h1>{t("Page not found")}</h1>
      <p className="muted-text">
        {t("The page does not exist or you do not have access.")}
      </p>
      <Link className="primary-btn link-btn" to="/dashboard">
        {t("Back to dashboard")}
      </Link>
    </section>
  );
}
