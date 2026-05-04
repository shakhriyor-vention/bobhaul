import { type ReactNode, useMemo, useState } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/store"

export function AssignDockDialog({
  loadId,
  trigger,
}: {
  loadId: string
  trigger?: ReactNode
}) {
  const allDocks = useStore((s) => s.docks)
  const docks = useMemo(() => allDocks.filter((d) => d.status === "free"), [allDocks])
  const assign = useStore((s) => s.assignDock)
  const [open, setOpen] = useState(false)
  const [dockId, setDockId] = useState(docks[0]?.id ?? "")

  const submit = () => {
    if (!dockId) {
      toast.error("No free docks")
      return
    }
    assign(loadId, dockId)
    toast.success(`Assigned ${loadId} → ${dockId}`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">Assign</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign dock · {loadId}</DialogTitle>
          <DialogDescription>
            {docks.length === 0 ? "No free docks available." : `${docks.length} free.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Dock door</Label>
          <Select value={dockId} onValueChange={setDockId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {docks.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!dockId}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
