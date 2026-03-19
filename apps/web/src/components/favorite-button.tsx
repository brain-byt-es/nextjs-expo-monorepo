"use client"

import * as React from "react"
import { IconStarFilled, IconStar } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  isFavorite,
  toggleFavorite,
  type FavoriteItem,
} from "@/lib/favorites"

interface FavoriteButtonProps {
  item: FavoriteItem
  /** Optional class overrides for the button element */
  className?: string
  /** Icon size in px — defaults to 16 */
  iconSize?: number
  /** Called after the favorite state changes */
  onChange?: (isFav: boolean) => void
}

/**
 * A star-toggle button that persists the favorite state in localStorage.
 *
 * Usage on a detail page header:
 *   <FavoriteButton
 *     item={{ type: "material", id: material.id, name: material.name, url: `/dashboard/materials/${material.id}` }}
 *   />
 */
export function FavoriteButton({
  item,
  className,
  iconSize = 16,
  onChange,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = React.useState(false)

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  React.useEffect(() => {
    setFavorited(isFavorite(item.id))
  }, [item.id])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const next = toggleFavorite(item)
    setFavorited(next)
    onChange?.(next)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? `${item.name} aus Favoriten entfernen` : `${item.name} zu Favoriten hinzufügen`}
      title={favorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      className={cn(
        "rounded p-1 transition-colors",
        favorited
          ? "text-amber-400 hover:text-amber-500"
          : "text-muted-foreground/40 hover:text-amber-400",
        className
      )}
    >
      {favorited ? (
        <IconStarFilled
          style={{ width: iconSize, height: iconSize }}
          aria-hidden
        />
      ) : (
        <IconStar
          style={{ width: iconSize, height: iconSize }}
          aria-hidden
        />
      )}
    </button>
  )
}
