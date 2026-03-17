import { cn } from "@/lib/utils"

interface LogoMarkProps {
  className?: string
  size?: number
}

export function LogoMark({ className, size = 32 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="LogistikApp"
    >
      {/* Outer rounded square — primary brand color */}
      <rect width="32" height="32" rx="8" fill="var(--primary)" />

      {/* Warehouse grid — stacked inventory boxes */}
      {/* Top row: 2 boxes */}
      <rect x="6" y="6" width="8" height="8" rx="1.5" fill="white" fillOpacity="0.30" />
      <rect x="18" y="6" width="8" height="8" rx="1.5" fill="white" fillOpacity="0.90" />

      {/* Middle row: wide bar */}
      <rect x="6" y="17" width="20" height="4" rx="1.5" fill="white" fillOpacity="0.65" />

      {/* Bottom row */}
      <rect x="6" y="24" width="12" height="2" rx="1" fill="white" fillOpacity="0.90" />

      {/* Location pin dot — secondary accent */}
      <circle cx="25" cy="25" r="2.5" fill="var(--secondary)" />
    </svg>
  )
}

interface LogoProps {
  className?: string
  iconSize?: number
  showText?: boolean
}

export function Logo({ className, iconSize = 28, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={iconSize} />
      {showText && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          Logistik<span className="text-primary">App</span>
        </span>
      )}
    </div>
  )
}
