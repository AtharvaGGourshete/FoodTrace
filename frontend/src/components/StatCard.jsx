export default function StatCard({
  label,
  value,
  change,
  icon: Icon,
}) {
  return (
    <div className="stat-card">

      <div className="stat-top">

        <span className="stat-label">
          {label}
        </span>

        <span className="stat-icon">
          {Icon && (
            <Icon
              size={22}
              strokeWidth={2}
              aria-hidden="true"
            />
          )}
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