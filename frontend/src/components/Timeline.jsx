export default function Timeline({
  items,
}) {
  return (
    <div className="timeline">

      {items.map((item, index) => (

        <div
          className="timeline-item"
          key={`${item.date}-${item.event}`}
        >

          <div className="timeline-marker">
            {index === 0 ? "✓" : "•"}
          </div>

          <div className="timeline-content">

            <div className="timeline-head">

              <strong>
                {item.event}
              </strong>

              <span>
                {item.date} · {item.time}
              </span>

            </div>

            <p>
              {item.actor}
            </p>

            <small>
              {item.location} · {item.status}
            </small>

          </div>

        </div>

      ))}

    </div>
  );
}