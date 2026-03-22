"use client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ReservationPanelProps {
  entityType: "tool" | "material"
  entityId: string
  showQuantity?: boolean
  currentUserId?: string
  isAdmin?: boolean
}

// ---------------------------------------------------------------------------
// Main Component (stub -- full implementation pending)
// ---------------------------------------------------------------------------
export function ReservationPanel(props: ReservationPanelProps) {
  void props
  return null
}
