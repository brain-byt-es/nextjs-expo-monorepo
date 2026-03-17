"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { AppSidebar } from "@/components/app-sidebar"
import { CommandPalette } from "@/components/command-palette"
import { DemoBanner } from "@/components/demo-banner"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  const devBypass = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_MODE === "true"

  useEffect(() => {
    if (!devBypass && !isPending && !session) {
      router.push("/login")
    }
  }, [session, isPending, router, devBypass])

  if (!devBypass && isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    )
  }

  if (!devBypass && !session) {
    return null
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <DemoBanner />
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  )
}
