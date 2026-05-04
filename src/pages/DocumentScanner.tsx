import { useRef, useState } from "react"
import { Check, FileCheck2, FileText, FileX2, Loader2, ScanText, Sparkles, Upload, X } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/page-header"
import { useStore, type DocumentKind } from "@/store"

type ExtractedField = {
  key: string
  label: string
  value: string
  confidence: number
}

type ScannedItem = {
  id: string
  fileName: string
  kind: DocumentKind
  url: string
  isImage: boolean
  fields: ExtractedField[]
}

const tone: Record<string, { cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  verified: { cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: FileCheck2 },
  signed: { cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: FileCheck2 },
  "pending-signature": { cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: Loader2 },
  draft: { cls: "bg-muted text-muted-foreground", icon: FileCheck2 },
  failed: { cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300", icon: FileX2 },
}

function inferKind(name: string): DocumentKind {
  const lower = name.toLowerCase()
  if (lower.includes("bol")) return "BOL"
  if (lower.includes("pod")) return "POD"
  if (lower.includes("manifest")) return "Manifest"
  if (lower.includes("seal")) return "Seal"
  if (lower.includes("damage")) return "Damage"
  if (lower.includes("customs")) return "Customs"
  return "BOL"
}

function extractFields(kind: DocumentKind, fileName: string): ExtractedField[] {
  const baseConf = 80 + Math.floor(Math.random() * 18)
  const loadId = `LD-${4400 + Math.floor(Math.random() * 100)}`
  const sealId = `SL-${88000 + Math.floor(Math.random() * 999)}`
  const common: ExtractedField[] = [
    { key: "load", label: "Load #", value: loadId, confidence: baseConf },
    { key: "carrier", label: "Carrier", value: ["Schneider", "JB Hunt", "Werner", "Knight", "XPO"][Math.floor(Math.random() * 5)], confidence: baseConf - 2 },
    { key: "date", label: "Date", value: new Date().toISOString().slice(0, 10), confidence: baseConf + 4 },
  ]
  if (kind === "BOL") {
    return [
      ...common,
      { key: "shipper", label: "Shipper", value: "Bobhaul · Chicago", confidence: baseConf },
      { key: "consignee", label: "Consignee", value: "Indianapolis DC", confidence: baseConf - 5 },
      { key: "weight", label: "Weight", value: `${20000 + Math.floor(Math.random() * 20000)} lb`, confidence: baseConf },
      { key: "pieces", label: "Pieces", value: String(10 + Math.floor(Math.random() * 30)), confidence: baseConf + 2 },
      { key: "seal", label: "Seal", value: sealId, confidence: baseConf - 8 },
    ]
  }
  if (kind === "POD") {
    return [
      ...common,
      { key: "receiver", label: "Receiver", value: "M. Cole", confidence: baseConf },
      { key: "received_at", label: "Received at", value: "10:42", confidence: baseConf - 3 },
      { key: "condition", label: "Condition", value: "OK · no exception", confidence: baseConf - 10 },
    ]
  }
  if (kind === "Seal") {
    return [
      ...common,
      { key: "seal", label: "Seal #", value: sealId, confidence: baseConf - 5 },
      { key: "intact", label: "Intact", value: "yes", confidence: baseConf },
    ]
  }
  if (kind === "Damage") {
    return [
      ...common,
      { key: "claim", label: "Claim #", value: `CL-${1000 + Math.floor(Math.random() * 999)}`, confidence: baseConf },
      { key: "severity", label: "Severity", value: ["minor", "moderate", "severe"][Math.floor(Math.random() * 3)], confidence: baseConf - 12 },
    ]
  }
  if (kind === "Customs") {
    return [
      ...common,
      { key: "hs", label: "HS code", value: "8471.30", confidence: baseConf - 4 },
      { key: "value", label: "Declared value", value: "$48,200", confidence: baseConf - 8 },
    ]
  }
  return [
    ...common,
    { key: "doc", label: "Document", value: fileName, confidence: baseConf },
  ]
}

export default function DocumentScanner() {
  const fileInput = useRef<HTMLInputElement>(null)
  const documents = useStore((s) => s.documents)
  const generate = useStore((s) => s.generateDocument)
  const [scanning, setScanning] = useState(false)
  const [latest, setLatest] = useState<ScannedItem | null>(null)
  const [editing, setEditing] = useState<Record<string, string>>({})

  const today = documents.length
  const verified = documents.filter((d) => d.status === "verified" || d.status === "signed").length
  const failed = documents.filter((d) => d.status === "failed").length

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setScanning(true)
    setTimeout(() => {
      let lastItem: ScannedItem | null = null
      Array.from(files).forEach((f) => {
        const kind = inferKind(f.name)
        const { documentId } = generate({ kind, name: f.name })
        lastItem = {
          id: documentId,
          fileName: f.name,
          kind,
          url: URL.createObjectURL(f),
          isImage: f.type.startsWith("image/"),
          fields: extractFields(kind, f.name),
        }
      })
      if (lastItem) {
        setLatest(lastItem)
        setEditing(Object.fromEntries((lastItem as ScannedItem).fields.map((f) => [f.key, f.value])))
      }
      toast.success(`Scanned ${files.length} document${files.length === 1 ? "" : "s"}`)
      setScanning(false)
    }, 800)
  }

  const confirmFields = () => {
    if (!latest) return
    toast.success(`${latest.kind} fields confirmed`, {
      description: `${latest.fields.length} fields saved to ${latest.id}`,
    })
    setLatest(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Scanner"
        description="OCR and verify BOLs, PODs, and IDs."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card>
          <CardContent className="p-0">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFiles(e.dataTransfer.files)
              }}
              className="flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-muted/20 p-10 transition-colors hover:bg-muted/40"
            >
              <input
                ref={fileInput}
                type="file"
                multiple
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                {scanning ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
              </div>
              <div className="text-center">
                <p className="text-base font-medium">
                  {scanning ? "Processing…" : "Drop files or click to upload"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  PDF, JPG, PNG · up to 20 MB · multi-page supported
                </p>
              </div>
              <Button
                className="mt-2"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  fileInput.current?.click()
                }}
                disabled={scanning}
              >
                <ScanText className="mr-1.5 size-4" /> Choose file
              </Button>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today</CardTitle>
            <CardDescription>Scan stats</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <Stat label="Scanned" value={String(today)} />
            <Stat label="Verified" value={String(verified)} tone="text-emerald-600" />
            <Stat label="Failed" value={String(failed)} tone="text-rose-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent scans</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No documents yet.
            </div>
          ) : (
            <div className="divide-y">
              {documents.slice(0, 12).map((r) => {
                const t = tone[r.status]
                const Icon = t.icon
                return (
                  <div
                    key={r.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Icon
                          className={`size-4 ${
                            r.status === "pending-signature" ? "animate-spin" : ""
                          }`}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.kind} · {r.loadId ?? "—"}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className={t.cls}>{r.status}</Badge>
                    <span className="text-xs text-muted-foreground">{r.createdAt}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const item: ScannedItem = {
                          id: r.id,
                          fileName: r.name,
                          kind: r.kind,
                          url: "",
                          isImage: false,
                          fields: extractFields(r.kind, r.name),
                        }
                        setLatest(item)
                        setEditing(Object.fromEntries(item.fields.map((f) => [f.key, f.value])))
                      }}
                    >
                      View
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!latest} onOpenChange={(o) => !o && setLatest(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {latest && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  OCR result · {latest.kind}
                </SheetTitle>
                <SheetDescription>{latest.fileName}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 py-4">
                <div className="overflow-hidden rounded-lg border bg-muted/30">
                  {latest.url && latest.isImage ? (
                    <img src={latest.url} alt={latest.fileName} className="max-h-64 w-full object-contain" />
                  ) : (
                    <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                      <FileText className="size-10" />
                      <span className="text-xs">{latest.fileName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Extracted fields
                    </Label>
                    <Badge variant="secondary">{latest.fields.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {latest.fields.map((f) => {
                      const conf = f.confidence
                      const tone =
                        conf >= 90
                          ? "text-emerald-600"
                          : conf >= 75
                          ? "text-amber-600"
                          : "text-rose-600"
                      return (
                        <div key={f.key} className="grid grid-cols-[1fr_auto] gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">{f.label}</Label>
                            <Input
                              className="h-9"
                              value={editing[f.key] ?? f.value}
                              onChange={(e) =>
                                setEditing((prev) => ({ ...prev, [f.key]: e.target.value }))
                              }
                            />
                            <div className="mt-1 flex items-center gap-2">
                              <Progress value={conf} className="h-1 flex-1" />
                              <span className={`text-[10px] tabular-nums ${tone}`}>
                                {conf}%
                              </span>
                            </div>
                          </div>
                          <div className="self-start pt-5">
                            {(editing[f.key] ?? f.value) === f.value ? (
                              <Badge variant="outline" className="text-[10px]">auto</Badge>
                            ) : (
                              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">edited</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setLatest(null)}>
                    <X className="mr-1.5 size-4" /> Cancel
                  </Button>
                  <Button size="sm" onClick={confirmFields}>
                    <Check className="mr-1.5 size-4" /> Confirm fields
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${tone ?? ""}`}>{value}</div>
    </div>
  )
}
