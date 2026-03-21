"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { IconCheck, IconX, IconClockHour4, IconInbox } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from "@/hooks/use-organization"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApprovalRow {
  id: string
  requestType: string
  entityType: string
  entityId: string
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  resolvedAt: string | null
  notes: string | null
  requesterId: string
  approverId: string | null
  requesterName: string | null
  requesterEmail: string | null
  approverName: string | null
}

type TabStatus = "pending" | "approved" | "rejected"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useRequestTypeLabels() {
  const t = useTranslations("approvals")
  return {
    tool_checkout: t("toolCheckout"),
    order: t("order"),
    stock_change: t("stockChange"),
  } as Record<string, string>
}

function useEntityTypeLabels() {
  const t = useTranslations("approvals")
  return {
    tool: t("entityTool"),
    material: t("entityMaterial"),
    order: t("entityOrder"),
  } as Record<string, string>
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: ApprovalRow["status"] }) {
  const t = useTranslations("approvals")
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-yellow-400 text-yellow-700 bg-yellow-50">
        <IconClockHour4 className="size-3 mr-1" />
        {t("pending")}
      </Badge>
    )
  }
  if (status === "approved") {
    return (
      <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
        <IconCheck className="size-3 mr-1" />
        {t("approved")}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50">
      <IconX className="size-3 mr-1" />
      {t("rejected")}
    </Badge>
  )
}

// ─── Approval Card ────────────────────────────────────────────────────────────

interface ApprovalCardProps {
  approval: ApprovalRow
  onDecide: (id: string, status: "approved" | "rejected") => void
  deciding: string | null
}

function ApprovalCard({ approval, onDecide, deciding }: ApprovalCardProps) {
  const t = useTranslations("approvals")
  const requestTypeLabels = useRequestTypeLabels()
  const entityTypeLabels = useEntityTypeLabels()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">
              {requestTypeLabels[approval.requestType] ?? approval.requestType}
            </CardTitle>
            <CardDescription className="mt-0.5">
              {entityTypeLabels[approval.entityType] ?? approval.entityType} &mdash; {t("from")}{" "}
              <span className="font-medium text-foreground">
                {approval.requesterName ?? approval.requesterEmail ?? t("unknown")}
              </span>
            </CardDescription>
          </div>
          <StatusBadge status={approval.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">{t("requestedAt")}</span>
          <span>{formatDateTime(approval.requestedAt)}</span>

          {approval.resolvedAt && (
            <>
              <span className="text-muted-foreground">{t("resolvedAt")}</span>
              <span>{formatDateTime(approval.resolvedAt)}</span>
            </>
          )}

          {approval.approverName && (
            <>
              <span className="text-muted-foreground">{t("decidedBy")}</span>
              <span>{approval.approverName}</span>
            </>
          )}
        </div>

        {approval.notes && (
          <p className="text-sm text-muted-foreground rounded-md bg-muted px-3 py-2">
            {approval.notes}
          </p>
        )}

        {approval.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onDecide(approval.id, "approved")}
              disabled={deciding === approval.id}
            >
              <IconCheck className="size-4 mr-1" />
              {t("approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => onDecide(approval.id, "rejected")}
              disabled={deciding === approval.id}
            >
              <IconX className="size-4 mr-1" />
              {t("reject")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ status }: { status: TabStatus }) {
  const t = useTranslations("approvals")
  const labels: Record<TabStatus, string> = {
    pending: t("emptyPending"),
    approved: t("emptyApproved"),
    rejected: t("emptyRejected"),
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <IconInbox className="size-10 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground text-sm">{labels[status]}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const t = useTranslations("approvals")
  const tc = useTranslations("common")
  const { orgId } = useOrganization()

  const [tab, setTab] = useState<TabStatus>("pending")
  const [approvals, setApprovals] = useState<ApprovalRow[]>([])
  const [loading, setLoading] = useState(true)

  // Decision dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTarget, setDialogTarget] = useState<{ id: string; status: "approved" | "rejected" } | null>(null)
  const [dialogNotes, setDialogNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [deciding, setDeciding] = useState<string | null>(null)

  const fetchApprovals = useCallback(async (status: TabStatus) => {
    if (!orgId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/approvals?status=${status}`, {
        headers: { "x-organization-id": orgId },
      })
      if (res.ok) {
        const data = await res.json()
        setApprovals(Array.isArray(data) ? data : [])
      }
    } catch {
      setApprovals([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void fetchApprovals(tab)
  }, [tab, fetchApprovals])

  // Counts for tab badges — fetched once
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    if (!orgId) return
    fetch(`/api/approvals?status=pending`, { headers: { "x-organization-id": orgId } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPendingCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setPendingCount(0))
  }, [orgId])

  const openDecisionDialog = (id: string, status: "approved" | "rejected") => {
    setDialogTarget({ id, status })
    setDialogNotes("")
    setDialogOpen(true)
  }

  const handleDecisionConfirm = async () => {
    if (!dialogTarget || !orgId) return
    setSubmitting(true)
    setDeciding(dialogTarget.id)
    try {
      const res = await fetch(`/api/approvals/${dialogTarget.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": orgId,
        },
        body: JSON.stringify({
          status: dialogTarget.status,
          notes: dialogNotes || undefined,
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        // Refresh current tab and pending count
        await fetchApprovals(tab)
        // Refresh pending count
        const countRes = await fetch(`/api/approvals?status=pending`, {
          headers: { "x-organization-id": orgId },
        })
        if (countRes.ok) {
          const data = await countRes.json()
          setPendingCount(Array.isArray(data) ? data.length : 0)
        }
      }
    } catch {
      // silently fail — production would show a toast here
    } finally {
      setSubmitting(false)
      setDeciding(null)
    }
  }

  const statusLabel = dialogTarget?.status === "approved" ? t("approve").toLowerCase() : t("reject").toLowerCase()

  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("pageDescription")}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabStatus)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            {t("pending")}
            {pendingCount !== null && pendingCount > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-xs rounded-full">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">{t("approved")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("rejected")}</TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected"] as const).map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-44 rounded-lg" />
                ))}
              </div>
            ) : approvals.length === 0 ? (
              <EmptyState status={s} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {approvals.map((a) => (
                  <ApprovalCard
                    key={a.id}
                    approval={a}
                    onDecide={openDecisionDialog}
                    deciding={deciding}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Decision confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogTarget?.status === "approved" ? t("approveTitle") : t("rejectTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("dialogDescription", { action: statusLabel })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="decision-notes">{t("noteLabel")}</Label>
            <Textarea
              id="decision-notes"
              placeholder={t("notePlaceholder")}
              value={dialogNotes}
              onChange={(e) => setDialogNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleDecisionConfirm}
              disabled={submitting}
              variant={dialogTarget?.status === "rejected" ? "destructive" : "default"}
            >
              {submitting
                ? t("saving")
                : dialogTarget?.status === "approved"
                  ? t("approve")
                  : t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
