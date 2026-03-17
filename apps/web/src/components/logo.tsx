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
      {/* Outer rounded square */}
      <rect width="32" height="32" rx="8" fill="#2563EB" />

      {/* Warehouse grid — 3 boxes suggesting stacked inventory */}
      {/* Top row: 2 boxes */}
      <rect x="6" y="6" width="8" height="8" rx="1.5" fill="white" fillOpacity="0.35" />
      <rect x="18" y="6" width="8" height="8" rx="1.5" fill="white" fillOpacity="0.9" />

      {/* Middle row: 1 wide box spanning full width */}
      <rect x="6" y="17" width="20" height="4" rx="1.5" fill="white" fillOpacity="0.7" />

      {/* Bottom: location pin dot — the "where is my inventory" signal */}
      <rect x="6" y="24" width="12" height="2" rx="1" fill="white" fillOpacity="0.9" />
      <circle cx="25" cy="25" r="2.5" fill="#F97316" />
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
        <span className="text-base font-semibold tracking-tight text-slate-900">
          Logistik<span className="text-blue-600">App</span>
        </span>
      )}
    </div>
  )
}
