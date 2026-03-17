"use client"

import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface ToolGroup {
  id: string
  name: string
  color: string
}

const PRESET_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
]

const placeholderData: ToolGroup[] = [
  { id: "1", name: "Bohrmaschinen", color: "#ef4444" },
  { id: "2", name: "Akkuschrauber", color: "#3b82f6" },
  { id: "3", name: "Messgeräte", color: "#22c55e" },
  { id: "4", name: "Sägen", color: "#f59e0b" },
  { id: "5", name: "Schleifgeräte", color: "#8b5cf6" },
  { id: "6", name: "Leitern & Gerüste", color: "#06b6d4" },
]

export default function ToolGroupsPage() {
  const t = useTranslations("masterData")
  const tc = useTranslations("common")
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<ToolGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: "", color: "#3b82f6" })

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(placeholderData)
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = () => {
    const newItem: ToolGroup = {
      id: crypto.randomUUID(),
      ...form,
    }
    setItems((prev) => [...prev, newItem])
    setForm({ name: "", color: "#3b82f6" })
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("toolGroups")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("title")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 size-4" />
              {t("addToolGroup")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addToolGroup")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("name")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("color")}</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`size-8 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="size-8 cursor-pointer rounded-full border-0 p-0"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{tc("cancel")}</Button>
              <Button onClick={handleCreate} disabled={!form.name}>{tc("create")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                {t("noResults")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("color")}</TableHead>
                    <TableHead className="w-[100px]">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block size-4 rounded-full ring-1 ring-border"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground text-xs font-mono">{item.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-8">
                            <IconEdit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(item.id)}>
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
