"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { ModeToggle } from "@/components/theme/theme-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Better-Auth admin plugin adds 'role' to user but types need explicit cast
interface SessionUser {
  role?: string
  [key: string]: unknown
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const user = session?.user as SessionUser | undefined

  useEffect(() => {
    if (!isPending && (!user || user.role !== "admin")) {
      router.replace("/dashboard")
    }
  }, [user, isPending, router])

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <h1 className="text-base font-medium">Admin</h1>
            <div className="ml-auto flex items-center gap-2">
              <ModeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
