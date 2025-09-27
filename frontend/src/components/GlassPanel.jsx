export function GlassPanel({ children, className = '' }) {
  return <div className={`glass-effect ${className}`}>{children}</div>
}