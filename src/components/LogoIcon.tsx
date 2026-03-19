interface LogoIconProps {
  className?: string
}

export function LogoIcon({ className }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="20" width="6" height="10" rx="1.5" fill="#6366f1" />
      <rect x="13" y="13" width="6" height="17" rx="1.5" fill="#6366f1" />
      <rect x="23" y="5" width="6" height="25" rx="1.5" fill="#6366f1" />
      <path
        d="M3 25 C8 12, 10 22, 16 14 C22 6, 23 12, 29 3"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="3" cy="25" r="2.5" fill="#10b981" />
      <circle cx="16" cy="14" r="2.5" fill="#10b981" />
      <circle cx="29" cy="3" r="2.5" fill="#10b981" />
    </svg>
  )
}
