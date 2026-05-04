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
import { useStore } from "@/store"

export function AddVehicleDialog({ trigger }: { trigger?: ReactNode }) {
  const add = useStore((s) => s.addVehicle)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ model: "", year: 2024, odometer: 0 })

  const submit = () => {
    if (!form.model.trim()) {
      toast.error("Model required")
      return
    }
    const id = add({
      model: form.model,
      year: form.year,
      odometer: form.odometer,
      status: "idle",
      nextService: `PM in ${30 - Math.floor(form.odometer / 5000) % 30} days`,
    })
    toast.success("Vehicle registered", { description: id })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1.5 size-4" /> Register vehicle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register vehicle</DialogTitle>
          <DialogDescription>Add truck or tractor unit to fleet.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Input
              placeholder="Volvo VNL 860"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Odometer (mi)</Label>
              <Input
                type="number"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit}>Register</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
