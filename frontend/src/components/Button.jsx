export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  )
}