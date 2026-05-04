import { type ReactNode, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/store"

export function AddDriverDialog({ trigger }: { trigger?: ReactNode }) {
  const add = useStore((s) => s.addDriver)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    license: "CDL-A",
    licenseExp: "2027-12-31",
    phone: "",
    status: "off" as "on-duty" | "rest" | "off" | "expiring",
  })

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Name required")
      return
    }
    const id = add({
      name: form.name,
      license: form.license,
      licenseExp: form.licenseExp,
      hours: { used: 0, max: 11 },
      status: form.status,
      phone: form.phone || "—",
    })
    toast.success("Driver added", { description: id })
    setOpen(false)
    setForm({ name: "", license: "CDL-A", licenseExp: "2027-12-31", phone: "", status: "off" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1.5 size-4" /> Add driver
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add driver</DialogTitle>
          <DialogDescription>Roster new driver to company.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>License class</Label>
              <Select value={form.license} onValueChange={(v) => setForm({ ...form, license: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDL-A">CDL-A</SelectItem>
                  <SelectItem value="CDL-B">CDL-B</SelectItem>
                  <SelectItem value="Non-CDL">Non-CDL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>License expiry</Label>
              <Input type="date" value={form.licenseExp} onChange={(e) => setForm({ ...form, licenseExp: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input placeholder="+1 555 555 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit}>Add driver</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
