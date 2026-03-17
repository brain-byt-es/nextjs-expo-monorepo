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

interface Customer {
  id: string
  name: string
  customerNumber: string
  contactPerson: string
  street: string
  zip: string
  city: string
}

const placeholderData: Customer[] = [
  { id: "1", name: "Müller Bau AG", customerNumber: "KD-001", contactPerson: "Fritz Müller", street: "Hauptstrasse 12", zip: "8001", city: "Zürich" },
  { id: "2", name: "Elektro Schmid GmbH", customerNumber: "KD-002", contactPerson: "Eva Schmid", street: "Industrieweg 5", zip: "3000", city: "Bern" },
  { id: "3", name: "Sanitär Keller AG", customerNumber: "KD-003", contactPerson: "Robert Keller", street: "Bahnhofstrasse 88", zip: "4051", city: "Basel" },
  { id: "4", name: "Holzbau Weber", customerNumber: "KD-004", contactPerson: "Ursula Weber", street: "Dorfstrasse 3", zip: "6003", city: "Luzern" },
  { id: "5", name: "Metallbau Gerber", customerNumber: "KD-005", contactPerson: "Markus Gerber", street: "Werkstrasse 22", zip: "9000", city: "St. Gallen" },
]

export default function CustomersPage() {
  const t = useTranslations("masterData")
  const tc = useTranslations("common")
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: "", customerNumber: "", contactPerson: "", street: "", zip: "", city: "" })

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(placeholderData)
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const filtered = items.filter((item) =>
    [item.name, item.customerNumber, item.contactPerson, item.city]
      .some((v) => v.toLowerCase().includes(search.toLowerCase()))
  )

  const handleCreate = () => {
    const newItem: Customer = {
      id: crypto.randomUUID(),
      ...form,
    }
    setItems((prev) => [...prev, newItem])
    setForm({ name: "", customerNumber: "", contactPerson: "", street: "", zip: "", city: "" })
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("customers")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("title")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 size-4" />
              {t("addCustomer")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addCustomer")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("name")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("customerNumber")}</Label>
                <Input value={form.customerNumber} onChange={(e) => setForm({ ...form, customerNumber: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("contactPerson")}</Label>
                <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{t("street")}</Label>
                <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("zip")}</Label>
                  <Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>{t("city")}</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
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
                    <TableHead>{t("customerNumber")}</TableHead>
                    <TableHead>{t("contactPerson")}</TableHead>
                    <TableHead>{t("street")}</TableHead>
                    <TableHead>{t("zip")}</TableHead>
                    <TableHead>{t("city")}</TableHead>
                    <TableHead className="w-[100px]">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.customerNumber}</TableCell>
                      <TableCell>{item.contactPerson}</TableCell>
                      <TableCell className="text-muted-foreground">{item.street}</TableCell>
                      <TableCell className="text-muted-foreground">{item.zip}</TableCell>
                      <TableCell className="text-muted-foreground">{item.city}</TableCell>
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
