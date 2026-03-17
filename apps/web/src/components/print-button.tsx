"use client"

import { IconPrinter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface PrintButtonProps {
  label?: string
  className?: string
}

export function PrintButton({ label = "Drucken", className }: PrintButtonProps) {
  return (
    <Button
      variant="outline"
      className={`gap-2 text-sm${className ? ` ${className}` : ""}`}
      onClick={() => window.print()}
    >
      <IconPrinter className="size-4" />
      {label}
    </Button>
  )
}
