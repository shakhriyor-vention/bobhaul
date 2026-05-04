import { useState } from "react"
import { CreditCard, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch"
import { useStore, type PaymentMethod } from "@/store"

type Brand = PaymentMethod["brand"]

export function AddPaymentMethodDialog({ trigger }: { trigger?: React.ReactNode }) {
  const add = useStore((s) => s.addPaymentMethod)
  const [open, setOpen] = useState(false)
  const [brand, setBrand] = useState<Brand>("Visa")
  const [number, setNumber] = useState("")
  const [exp, setExp] = useState("")
  const [cvc, setCvc] = useState("")
  const [setDefault, setSetDefault] = useState(true)

  const last4 = number.replace(/\s/g, "").slice(-4)
  const validNumber = number.replace(/\s/g, "").length >= 13
  const validExp = /^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(exp)
  const validCvc = /^\d{3,4}$/.test(cvc)
  const valid = validNumber && validExp && validCvc

  const submit = () => {
    if (!valid) {
      toast.error("Check card details")
      return
    }
    const [m, y] = exp.split("/").map((s) => Number(s.trim()))
    add({ brand, last4, expMonth: m, expYear: 2000 + y, setDefault })
    setOpen(false)
    setNumber("")
    setExp("")
    setCvc("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="mr-1 size-3.5" /> Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="size-4" /> Add payment method
          </DialogTitle>
          <DialogDescription>Demo only · no card data leaves the browser.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Brand</Label>
            <Select value={brand} onValueChange={(v) => setBrand(v as Brand)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Visa">Visa</SelectItem>
                <SelectItem value="Mastercard">Mastercard</SelectItem>
                <SelectItem value="Amex">American Express</SelectItem>
                <SelectItem value="Discover">Discover</SelectItem>
                <SelectItem value="ACH">ACH bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Card number</Label>
            <Input
              placeholder="4242 4242 4242 4242"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Expiry (MM/YY)</Label>
              <Input placeholder="09/27" value={exp} onChange={(e) => setExp(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CVC</Label>
              <Input placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Set as default</div>
              <div className="text-xs text-muted-foreground">Use for next charge</div>
            </div>
            <Switch checked={setDefault} onCheckedChange={setSetDefault} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>Add card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
