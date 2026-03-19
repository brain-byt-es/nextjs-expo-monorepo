"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number | null
  onChange?: (value: number) => void
  max?: number
  size?: "sm" | "md" | "lg"
  readonly?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-6",
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  readonly = false,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const displayValue = hovered ?? value ?? 0
  const sizeClass = SIZE_CLASSES[size]

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role={readonly ? "img" : "radiogroup"}
      aria-label={`Bewertung: ${value ?? 0} von ${max} Sternen`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= displayValue

        return (
          <button
            key={starValue}
            type="button"
            disabled={readonly}
            aria-label={`${starValue} Stern${starValue !== 1 ? "e" : ""}`}
            onMouseEnter={() => !readonly && setHovered(starValue)}
            onMouseLeave={() => !readonly && setHovered(null)}
            onClick={() => !readonly && onChange?.(starValue)}
            className={cn(
              "transition-transform focus:outline-none",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
          >
            <svg
              className={cn(sizeClass, "transition-colors")}
              viewBox="0 0 24 24"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

// Compact display-only average score with half-star visual
export function StarDisplay({
  value,
  max = 5,
  size = "sm",
  showLabel = false,
  className,
}: {
  value: number | null
  max?: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}) {
  if (value == null) {
    return (
      <span className="text-xs text-muted-foreground italic">Keine Bewertung</span>
    )
  }

  const sizeClass = SIZE_CLASSES[size]
  const rounded = Math.round(value * 2) / 2 // round to nearest 0.5

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5" aria-label={`${value} von ${max} Sternen`}>
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1
          const filled = starValue <= rounded
          const half = !filled && starValue - 0.5 <= rounded

          return (
            <span key={i} className="relative">
              {/* Background star (empty) */}
              <svg
                className={cn(sizeClass, "text-muted-foreground/30")}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              {/* Foreground star (filled or half) */}
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden text-amber-400"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  <svg
                    className={sizeClass}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </span>
              )}
            </span>
          )
        })}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {value.toFixed(1)} / {max}
        </span>
      )}
    </div>
  )
}
