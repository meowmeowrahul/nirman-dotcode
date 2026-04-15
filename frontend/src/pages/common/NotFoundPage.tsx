import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="card center-card">
      <h1>Page not found</h1>
      <p className="muted-text">
        The page does not exist or you do not have access.
      </p>
      <Link className="primary-btn link-btn" to="/dashboard">
        Back to dashboard
      </Link>
    </section>
  );
}
