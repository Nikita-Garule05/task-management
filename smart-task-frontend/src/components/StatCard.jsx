function StatCard({ title, value, color, tag }) {
  return (
    <div className={`stat-card ${color}`}>
      {tag ? <span className={`stat-badge badge-${tag.toLowerCase()}`}>{tag}</span> : null}
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default StatCard;
