export default function StatCard({
  label,
  value,
  change,
  icon,
}) {
  return (
    <div className="stat-card">

      <div className="stat-top">

        <span className="stat-label">
          {label}
        </span>

        <span className="stat-icon">
          {icon}
        </span>

      </div>

      <div className="stat-value">
        {value}
      </div>

      {change && (
        <div className="stat-change">
          {change}
        </div>
      )}

    </div>
  );
}