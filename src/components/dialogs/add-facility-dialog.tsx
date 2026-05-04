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
import { useStore, type Facility } from "@/store"

export function AddFacilityDialog({ trigger }: { trigger?: ReactNode }) {
  const add = useStore((s) => s.addFacility)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "Cross-dock" as Facility["type"],
    city: "",
    manager: "",
    docks: 12,
    yard: 32,
  })

  const submit = () => {
    if (!form.name.trim() || !form.city.trim()) {
      toast.error("Name and city required")
      return
    }
    const id = add({ ...form, status: "pilot" })
    toast.success("Facility created", { description: id })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1.5 size-4" /> Add facility
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add facility</DialogTitle>
          <DialogDescription>New facility starts in pilot status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Facility["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cross-dock">Cross-dock</SelectItem>
                  <SelectItem value="Warehouse">Warehouse</SelectItem>
                  <SelectItem value="Yard only">Yard only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Manager</Label>
            <Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Docks</Label>
              <Input type="number" value={form.docks} onChange={(e) => setForm({ ...form, docks: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Yard slots</Label>
              <Input type="number" value={form.yard} onChange={(e) => setForm({ ...form, yard: Number(e.target.value) })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
