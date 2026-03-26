import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoMarkProps {
  className?: string
  size?: number
}

export function LogoMark({ className, size = 32 }: LogoMarkProps) {
  return (
    <Image
      src="/zentory-logo.svg"
      alt="Zentory"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  )
}

/** Styled brand wordmark: ZEN (bold 700) + TORY (light 300), all caps */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("tracking-tight uppercase", className)}>
      <span className="font-bold">Zen</span><span className="font-light">tory</span>
    </span>
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
      {showText && <Wordmark className="text-base text-foreground" />}
    </div>
  )
}
