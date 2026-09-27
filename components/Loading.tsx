export function Loading({ label = "Loading" }: Readonly<{ label?: string }>) {
  return <div className="empty-state" aria-live="polite"><span className="spinner" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 10 }} />{label}</div>;
}