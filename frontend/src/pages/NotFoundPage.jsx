import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="not-found">

      <div className="brand-mark">
        F
      </div>

      <span className="eyebrow">
        404
      </span>

      <h1>
        Page not found
      </h1>

      <p>
        The page you're looking for
        doesn't exist in this prototype.
      </p>

      <Link
        className="button button-primary"
        to="/"
      >
        Return home
      </Link>

    </div>
  );
}