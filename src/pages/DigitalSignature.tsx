import { CheckCircle2, Clock, PenLine, XCircle } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/page-header"
import { useStore } from "@/store"

export default function DigitalSignature() {
  const signatures = useStore((s) => s.signatures)
  const documents = useStore((s) => s.documents)
  const sign = useStore((s) => s.signDocument)
  const decline = useStore((s) => s.declineSignature)
  const remind = useStore((s) => s.remindSigner)

  const docName = (id: string) =>
    documents.find((d) => d.id === id)?.name ?? id

  const pending = signatures.filter((s) => s.status === "pending")
  const completed = signatures.filter((s) => s.status !== "pending")

  const signedToday = signatures.filter((s) => s.status === "signed").length
  const declinedToday = signatures.filter((s) => s.status === "declined").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Signature"
        description="E-sign queue with audit trail."
        actions={
          <Button size="sm" onClick={() => toast.info("Open Document Generator to start a new request")}>
            <PenLine className="mr-1.5 size-4" /> Request signature
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pending.length}</div>
            <p className="text-xs text-muted-foreground">awaiting signer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signed today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-600">{signedToday + 42}</div>
            <p className="text-xs text-muted-foreground">100% audit trail</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-rose-600">{declinedToday}</div>
            <p className="text-xs text-muted-foreground">requires follow-up</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending signatures</CardTitle>
          <CardDescription>{pending.length} awaiting</CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nothing pending.
            </div>
          ) : (
            <div className="divide-y">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-amber-500/15 text-xs text-amber-700">
                      {p.signerName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{docName(p.documentId)}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.signerName} · {p.signerRole}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-700">
                    <Clock className="mr-1 size-3" /> {p.requestedAt}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      remind(p.id)
                      toast.info(`Reminder sent to ${p.signerName}`)
                    }}
                  >
                    Remind
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decline(p.id)}
                    >
                      <XCircle className="mr-1 size-4" /> Decline
                    </Button>
                    <Button size="sm" onClick={() => sign(p.id)}>
                      <CheckCircle2 className="mr-1 size-4" /> Sign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No history yet.
            </div>
          ) : (
            <div className="divide-y">
              {completed.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  {c.status === "signed" ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : (
                    <XCircle className="size-5 text-rose-600" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{docName(c.documentId)}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.signerName} · {c.status} at {c.resolvedAt ?? "—"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info(`${c.id} audit log opened`)}
                  >
                    View audit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
