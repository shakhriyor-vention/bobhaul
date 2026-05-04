import { CheckCircle2, CreditCard, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { AddPaymentMethodDialog } from "@/components/dialogs/add-payment-method-dialog"
import { useStore } from "@/store"

const statusTone: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  refunded: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
}

export default function Payments() {
  const invoices = useStore((s) => s.invoices)
  const subscription = useStore((s) => s.subscription)
  const methods = useStore((s) => s.paymentMethods)
  const pay = useStore((s) => s.payInvoice)
  const removePm = useStore((s) => s.removePaymentMethod)
  const setDefault = useStore((s) => s.setDefaultPaymentMethod)

  const defaultPm = methods.find((m) => m.isDefault) ?? methods[0]

  const yearTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + i.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Invoices, payment methods, history."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next charge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${subscription.price.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">on {subscription.renewsOn}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paid this period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${yearTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter((i) => i.status === "paid").length} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Default method</CardTitle>
            <AddPaymentMethodDialog />
          </CardHeader>
          <CardContent>
            {defaultPm ? (
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-medium">{defaultPm.brand} · {defaultPm.last4}</div>
                  <div className="text-xs text-muted-foreground">
                    Expires {String(defaultPm.expMonth).padStart(2, "0")} / {String(defaultPm.expYear).slice(-2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No payment method on file.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment methods</CardTitle>
            <CardDescription>{methods.length} on file</CardDescription>
          </div>
          <AddPaymentMethodDialog />
        </CardHeader>
        <CardContent className="divide-y">
          {methods.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No methods.</div>
          ) : (
            methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <CreditCard className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {m.brand} · {m.last4}
                    {m.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expires {String(m.expMonth).padStart(2, "0")} / {String(m.expYear).slice(-2)}
                  </div>
                </div>
                {!m.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDefault(m.id)
                      toast.success(`${m.brand} ··· ${m.last4} set as default`)
                    }}
                  >
                    <CheckCircle2 className="mr-1.5 size-4" /> Set default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    removePm(m.id)
                    toast.success("Method removed")
                  }}
                  disabled={methods.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Last {invoices.length} entries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.method}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`capitalize ${statusTone[inv.status]}`}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    ${inv.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {inv.status === "failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            pay(inv.id)
                            toast.success(`${inv.id} retried`)
                          }}
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success(`Downloaded ${inv.id}.pdf`)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
