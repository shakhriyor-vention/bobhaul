import { useState } from "react"
import { Download, FileText, Plus } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { useStore, type DocumentKind } from "@/store"

type Template = { name: string; code: string; kind: DocumentKind; hot?: boolean }

const templates: Template[] = [
  { name: "Bill of Lading", code: "BOL", kind: "BOL", hot: true },
  { name: "Gate Pass", code: "GP", kind: "Gate Pass", hot: true },
  { name: "Seal Report", code: "SR", kind: "Seal" },
  { name: "Driver Manifest", code: "MF", kind: "Manifest" },
  { name: "Damage Report", code: "DR", kind: "Damage" },
  { name: "Customs Declaration", code: "CD", kind: "Customs" },
]

export default function DocumentGenerator() {
  const loads = useStore((s) => s.loads)
  const documents = useStore((s) => s.documents)
  const generate = useStore((s) => s.generateDocument)
  const [selected, setSelected] = useState<Template>(templates[0])
  const [form, setForm] = useState({
    loadId: loads[0]?.id ?? "",
    notes: "",
  })

  const generatedToday = (kind: DocumentKind) =>
    documents.filter((d) => d.kind === kind).length

  const submit = () => {
    if (!form.loadId) {
      toast.error("Pick a load")
      return
    }
    const { signatureId } = generate({ kind: selected.kind, loadId: form.loadId })
    toast.success(`${selected.name} generated`, {
      description: signatureId ? "Signature requested" : "Saved to vault",
    })
    setForm({ ...form, notes: "" })
  }

  const load = loads.find((l) => l.id === form.loadId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Generator"
        description="Templates and one-click document creation."
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info("Template builder coming soon")}
          >
            <Plus className="mr-1.5 size-4" /> New template
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Pre-configured document types · click to load form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => {
                const active = selected.code === t.code
                return (
                  <button
                    key={t.code}
                    onClick={() => setSelected(t)}
                    className={`group flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm ${
                      active ? "border-primary shadow-sm ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        {t.hot && (
                          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700">
                            Hot
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{t.code}</span>
                        <span>{generatedToday(t.kind)} today</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate · {selected.name}</CardTitle>
            <CardDescription>Fill once, export PDF</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Load</Label>
              <Select value={form.loadId} onValueChange={(v) => setForm({ ...form, loadId: v })}>
                <SelectTrigger><SelectValue placeholder="Select load" /></SelectTrigger>
                <SelectContent>
                  {loads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.id} · {l.origin} → {l.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {load && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Carrier</span>
                  <span>{load.carrier}</span>
                  <span className="text-muted-foreground">Weight</span>
                  <span>{load.weight.toLocaleString()} lb</span>
                  <span className="text-muted-foreground">Pieces</span>
                  <span>{load.pieces}</span>
                  <span className="text-muted-foreground">Seal</span>
                  <span className="font-mono">{load.seal ?? "—"}</span>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Special instructions</Label>
              <Textarea
                placeholder="Optional notes…"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={submit}>
              <Download className="mr-1.5 size-4" /> Generate {selected.code}
            </Button>
            {(selected.kind === "BOL" || selected.kind === "POD") && (
              <p className="text-center text-xs text-muted-foreground">
                Signature request will be sent to the driver automatically.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
