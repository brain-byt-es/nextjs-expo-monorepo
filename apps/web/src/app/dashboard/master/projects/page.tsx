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

interface Project {
  id: string
  name: string
  customer: string
  startDate: string
  endDate: string
  projectLeader: string
  costCenter: string
}

const placeholderData: Project[] = [
  { id: "1", name: "Neubau Bürogebäude Zürich", customer: "Müller Bau AG", startDate: "01.01.2026", endDate: "30.06.2026", projectLeader: "Max Müller", costCenter: "KST-100" },
  { id: "2", name: "Sanierung Schulhaus Bern", customer: "Elektro Schmid GmbH", startDate: "15.02.2026", endDate: "31.08.2026", projectLeader: "Anna Schmidt", costCenter: "KST-101" },
  { id: "3", name: "Umbau Spital Basel", customer: "Sanitär Keller AG", startDate: "01.03.2026", endDate: "31.12.2026", projectLeader: "Peter Weber", costCenter: "KST-102" },
  { id: "4", name: "Erweiterung Lager Luzern", customer: "Holzbau Weber", startDate: "01.04.2026", endDate: "30.09.2026", projectLeader: "Lisa Meier", costCenter: "KST-103" },
  { id: "5", name: "Renovation Altstadt St. Gallen", customer: "Metallbau Gerber", startDate: "15.05.2026", endDate: "28.02.2027", projectLeader: "Thomas Braun", costCenter: "KST-104" },
]

export default function ProjectsPage() {
  const t = useTranslations("masterData")
  const tc = useTranslations("common")
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: "", customer: "", startDate: "", endDate: "", projectLeader: "", costCenter: "" })

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(placeholderData)
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const filtered = items.filter((item) =>
    [item.name, item.customer, item.projectLeader, item.costCenter]
      .some((v) => v.toLowerCase().includes(search.toLowerCase()))
  )

  const handleCreate = () => {
    const newItem: Project = {
      id: crypto.randomUUID(),
      ...form,
    }
    setItems((prev) => [...prev, newItem])
    setForm({ name: "", customer: "", startDate: "", endDate: "", projectLeader: "", costCenter: "" })
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("projects")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("title")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 size-4" />
              {t("addProject")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addProject")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("name")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("customer")}</Label>
                <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("startDate")}</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>{t("endDate")}</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t("projectLeader")}</Label>
                <Input value={form.projectLeader} onChange={(e) => setForm({ ...form, projectLeader: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("costCenter")}</Label>
                <Input value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
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
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("startDate")}</TableHead>
                    <TableHead>{t("endDate")}</TableHead>
                    <TableHead>{t("projectLeader")}</TableHead>
                    <TableHead>{t("costCenter")}</TableHead>
                    <TableHead className="w-[100px]">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.customer}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{item.startDate}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{item.endDate}</TableCell>
                      <TableCell>{item.projectLeader}</TableCell>
                      <TableCell className="text-muted-foreground">{item.costCenter}</TableCell>
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
