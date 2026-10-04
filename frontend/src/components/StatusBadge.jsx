export default function StatusBadge({
  children,
  tone,
}) {
  const value = String(children);

  const normalized =
    tone ||
    value
      .toLowerCase()
      .replace(/\s+/g, "-");

  return (
    <span
      className={`status-badge ${normalized}`}
    >
      {value}
    </span>
  );
}