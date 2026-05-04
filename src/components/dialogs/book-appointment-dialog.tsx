import { type ReactNode, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Repeat2,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore, type AppointmentEquipment } from "@/store"
import { cn } from "@/lib/utils"

const carriers = ["Bobhaul", "Schneider", "JB Hunt", "Werner", "Knight", "XPO"]

const equipmentOptions: { key: AppointmentEquipment; label: string }[] = [
  { key: "53ft", label: "53′ Trailer" },
  { key: "48ft", label: "48′ Trailer" },
  { key: "box", label: "Box truck" },
  { key: "reefer", label: "Reefer" },
  { key: "hazmat", label: "Hazmat" },
]

const directions: {
  key: "inbound" | "outbound" | "cross-dock"
  label: string
  hint: string
}[] = [
  { key: "inbound", label: "Inbound", hint: "Receiving" },
  { key: "outbound", label: "Outbound", hint: "Shipping" },
  { key: "cross-dock", label: "Cross-dock", hint: "In & out" },
]

const windowOptions = [
  { key: "any", label: "Anytime · 06:00 – 22:00", start: 6, end: 22 },
  { key: "morning", label: "Morning · 06:00 – 12:00", start: 6, end: 12 },
  { key: "afternoon", label: "Afternoon · 12:00 – 17:00", start: 12, end: 17 },
  { key: "evening", label: "Evening · 17:00 – 22:00", start: 17, end: 22 },
]

type SlotSuggestion = {
  time: string
  dockId: string
  fit: "best" | "ok" | "tight"
  note: string
}

function generateSlots(
  date: string,
  windowKey: string,
  equipment: AppointmentEquipment[],
): SlotSuggestion[] {
  const win = windowOptions.find((w) => w.key === windowKey) ?? windowOptions[0]
  const docks = ["D-01", "D-02", "D-03", "D-05", "D-06", "D-07", "D-08"]
  const needsReefer = equipment.includes("reefer")
  const needsHazmat = equipment.includes("hazmat")
  const result: SlotSuggestion[] = []
  for (let h = win.start; h < win.end && result.length < 6; h += 1) {
    const time = `${String(h).padStart(2, "0")}:${h % 2 === 0 ? "00" : "30"}`
    const dock = docks[(h + date.length) % docks.length]
    let fit: SlotSuggestion["fit"] = "ok"
    let note = "Standard · 60 min"
    if (needsReefer && (dock === "D-01" || dock === "D-03")) {
      fit = "best"
      note = "Reefer · Leveler · 90 min"
    } else if (needsHazmat && dock === "D-06") {
      fit = "best"
      note = "Hazmat · 90 min"
    } else if (h === win.end - 1) {
      fit = "tight"
      note = "Tight fit · close to window edge"
    }
    result.push({ time, dockId: dock, fit, note })
  }
  return result
}

function carrierLeadHours() {
  return 4
}

export function BookAppointmentDialog({
  trigger,
  defaultDate,
}: {
  trigger?: ReactNode
  defaultDate?: string
}) {
  const drivers = useStore((s) => s.drivers)
  const book = useStore((s) => s.bookAppointment)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    carrier: "Bobhaul",
    reference: "",
    direction: "inbound" as "inbound" | "outbound" | "cross-dock",
    equipment: ["53ft"] as AppointmentEquipment[],
    driverId: drivers[0]?.id ?? "",
    notes: "",
    recurring: false,
    recFrequency: "weekly" as "weekly" | "biweekly" | "monthly",
    recUntil: "2026-12-31",
    date: defaultDate ?? today,
    window: "any",
    slot: null as SlotSuggestion | null,
    origin: "Chicago, IL",
    destination: "Indianapolis, IN",
    weight: 30000,
    pieces: 20,
  })

  const reset = () => {
    setStep(1)
    setForm((f) => ({ ...f, slot: null, reference: "", notes: "" }))
  }

  const slots = useMemo(
    () => generateSlots(form.date, form.window, form.equipment),
    [form.date, form.window, form.equipment],
  )

  const leadHours = carrierLeadHours()
  const dateObj = new Date(form.date)
  const now = new Date()
  const hoursAhead = (dateObj.getTime() - now.getTime()) / 3_600_000
  const checks = [
    {
      ok: hoursAhead >= 0,
      label: `Lead time ≥ ${leadHours}h`,
      detail: hoursAhead < 0 ? "Date is in past" : `${Math.max(0, Math.round(hoursAhead))}h ahead`,
    },
    {
      ok: true,
      label: "Within hours · Mon–Sat 06:00–22:00",
      detail: "Facility open",
    },
    {
      ok: form.equipment.length > 0,
      label: "Equipment selected",
      detail: form.equipment.join(", ") || "None",
    },
    {
      ok: !!form.carrier,
      label: "Carrier in good standing",
      detail: form.carrier,
    },
  ]
  const allPass = checks.every((c) => c.ok)

  const next = () => {
    if (step === 1) {
      if (!form.carrier) return toast.error("Pick a carrier")
      if (!form.driverId) return toast.error("Pick a driver")
      if (form.equipment.length === 0) return toast.error("Pick equipment")
      setStep(2)
    } else if (step === 2) {
      if (!form.slot) return toast.error("Pick a slot")
      setStep(3)
    } else {
      submit()
    }
  }

  const submit = () => {
    if (!form.slot) return
    const { appointmentId } = book({
      time: form.slot.time,
      date: form.date,
      carrier: form.carrier,
      type: form.direction,
      driverId: form.driverId,
      origin: form.origin,
      destination: form.destination,
      weight: form.weight,
      pieces: form.pieces,
    })
    toast.success("Appointment booked", {
      description: `${appointmentId} · ${form.slot.dockId} · ${form.slot.time}`,
    })
    setOpen(false)
    reset()
  }

  const toggleEquipment = (k: AppointmentEquipment) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(k)
        ? f.equipment.filter((e) => e !== k)
        : [...f.equipment, k],
    }))
  }

  const driver = drivers.find((d) => d.id === form.driverId)

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <SheetTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1.5 size-4" /> New booking
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-4" />
            </div>
            <div>
              <SheetTitle>New booking</SheetTitle>
              <SheetDescription>Reserve a dock appointment</SheetDescription>
            </div>
          </div>
          <Stepper step={step} setStep={setStep} />
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="flex items-center gap-3">
                  <Repeat2 className="size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Recurring booking</div>
                    <div className="text-xs text-muted-foreground">
                      Auto-create every week or month
                    </div>
                  </div>
                </div>
                <Switch
                  checked={form.recurring}
                  onCheckedChange={(v) => setForm({ ...form, recurring: v })}
                />
              </div>

              {form.recurring && (
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frequency</Label>
                    <Select
                      value={form.recFrequency}
                      onValueChange={(v) =>
                        setForm({ ...form, recFrequency: v as typeof form.recFrequency })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Every week</SelectItem>
                        <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                        <SelectItem value="monthly">Every month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">End date</Label>
                    <Input
                      type="date"
                      value={form.recUntil}
                      onChange={(e) =>
                        setForm({ ...form, recUntil: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              <Section title="Carrier & load">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Carrier</Label>
                    <Select
                      value={form.carrier}
                      onValueChange={(v) => setForm({ ...form, carrier: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reference (PO / BOL)</Label>
                    <Input
                      placeholder="PO-998620"
                      value={form.reference}
                      onChange={(e) =>
                        setForm({ ...form, reference: e.target.value })
                      }
                    />
                  </div>
                </div>
              </Section>

              <Section title="Direction">
                <div className="grid grid-cols-3 gap-2">
                  {directions.map((d) => {
                    const on = form.direction === d.key
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setForm({ ...form, direction: d.key })}
                        className={cn(
                          "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                          on
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <div className="text-sm font-medium">{d.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.hint}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Section>

              <Section title="Equipment">
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((e) => {
                    const on = form.equipment.includes(e.key)
                    return (
                      <button
                        key={e.key}
                        type="button"
                        onClick={() => toggleEquipment(e.key)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          on
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted/40",
                        )}
                      >
                        {on && <CheckCircle2 className="mr-1 inline size-3" />}
                        {e.label}
                      </button>
                    )
                  })}
                </div>
              </Section>

              <Section title="Driver & origin">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Driver</Label>
                    <Select
                      value={form.driverId}
                      onValueChange={(v) => setForm({ ...form, driverId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} · {d.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Origin</Label>
                    <Input
                      value={form.origin}
                      onChange={(e) =>
                        setForm({ ...form, origin: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Destination</Label>
                    <Input
                      value={form.destination}
                      onChange={(e) =>
                        setForm({ ...form, destination: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Weight (lb)</Label>
                    <Input
                      type="number"
                      value={form.weight}
                      onChange={(e) =>
                        setForm({ ...form, weight: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pieces</Label>
                    <Input
                      type="number"
                      value={form.pieces}
                      onChange={(e) =>
                        setForm({ ...form, pieces: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label>Notes for warehouse team</Label>
                  <Textarea
                    rows={2}
                    placeholder="Fragile · hot load · palletized · etc."
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
              </Section>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <RuleBanner
                ok={allPass}
                title={allPass ? "All carrier rules met" : "Rules need attention"}
                detail={
                  allPass
                    ? `${slots.length} slots match your equipment & window`
                    : "Resolve conflicts before continuing"
                }
              />

              <div className="grid gap-2 rounded-lg border bg-card p-3">
                {checks.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          "size-3.5",
                          c.ok ? "text-emerald-600" : "text-rose-500",
                        )}
                      />
                      <span className="font-medium">{c.label}</span>
                    </div>
                    <span className="text-muted-foreground">{c.detail}</span>
                  </div>
                ))}
              </div>

              <Section title="Date & window">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred window</Label>
                    <Select
                      value={form.window}
                      onValueChange={(v) => setForm({ ...form, window: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {windowOptions.map((w) => (
                          <SelectItem key={w.key} value={w.key}>
                            {w.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Section>

              <Section title="Available slots">
                <div className="space-y-2">
                  {slots.map((s) => {
                    const on = form.slot?.time === s.time && form.slot?.dockId === s.dockId
                    return (
                      <button
                        key={`${s.time}-${s.dockId}`}
                        onClick={() => setForm({ ...form, slot: s })}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                          on
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-[10px] uppercase text-muted-foreground">
                              {new Date(form.date).toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </div>
                            <div className="font-mono text-base font-semibold tabular-nums">
                              {s.time}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {s.dockId}
                              </Badge>
                              {s.fit === "best" && (
                                <Badge className="bg-emerald-500/15 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                                  <Sparkles className="mr-0.5 size-2.5" /> Best fit
                                </Badge>
                              )}
                              {s.fit === "tight" && (
                                <Badge className="bg-amber-500/15 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                  Tight fit
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {s.note}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    )
                  })}
                </div>
              </Section>
            </div>
          )}

          {step === 3 && form.slot && (
            <div className="space-y-4">
              <RuleBanner
                ok
                title="Ready to book"
                detail="Review details — confirmation will fire on click"
              />
              <div className="overflow-hidden rounded-lg border bg-card">
                <ReviewRow label="Carrier" value={form.carrier} />
                <ReviewRow
                  label="Reference"
                  value={
                    form.reference ? (
                      <span className="font-mono text-xs">{form.reference}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
                <ReviewRow
                  label="Direction"
                  value={
                    <Badge variant="outline" className="capitalize">
                      {form.direction}
                    </Badge>
                  }
                />
                <ReviewRow
                  label="When"
                  value={
                    <span>
                      {new Date(form.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · <span className="font-mono">{form.slot.time}</span>
                    </span>
                  }
                />
                <ReviewRow
                  label="Dock"
                  value={
                    <Badge variant="outline" className="font-mono">
                      {form.slot.dockId}
                    </Badge>
                  }
                />
                <ReviewRow
                  label="Recurring"
                  value={
                    form.recurring
                      ? `${form.recFrequency} until ${form.recUntil}`
                      : "No · one-time"
                  }
                />
                <ReviewRow
                  label="Equipment"
                  value={
                    <div className="flex flex-wrap gap-1">
                      {form.equipment.map((e) => (
                        <Badge
                          key={e}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {e}
                        </Badge>
                      ))}
                    </div>
                  }
                />
                <ReviewRow
                  label="Driver"
                  value={driver?.name ?? "—"}
                  last
                />
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="border-t bg-card/50 px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={step === 1}
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
            >
              <ArrowLeft className="mr-1 size-4" /> Back
            </Button>
            <span className="text-xs text-muted-foreground">
              Step {step} of 3
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={next}>
                {step === 3 ? (
                  <>
                    <CheckCircle2 className="mr-1 size-4" /> Confirm booking
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="ml-1 size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Stepper({
  step,
  setStep,
}: {
  step: 1 | 2 | 3
  setStep: (s: 1 | 2 | 3) => void
}) {
  const labels: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: "Load & carrier" },
    { n: 2, label: "Time slot" },
    { n: 3, label: "Review" },
  ]
  return (
    <div className="mt-3 flex items-center gap-2">
      {labels.map((l, i) => {
        const done = step > l.n
        const active = step === l.n
        return (
          <div key={l.n} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!done}
              onClick={() => done && setStep(l.n)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                active && "border-primary bg-primary/5 text-primary",
                done && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                !active && !done && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[10px] font-bold",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-emerald-500 text-white",
                  !active && !done && "bg-muted",
                )}
              >
                {done ? "✓" : l.n}
              </span>
              <span className="truncate">{l.label}</span>
            </button>
            {i < labels.length - 1 && (
              <span className="hidden h-px w-3 bg-border sm:block" />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  )
}

function RuleBanner({
  ok,
  title,
  detail,
}: {
  ok: boolean
  title: string
  detail: string
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        ok
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-rose-500/40 bg-rose-500/10",
      )}
    >
      <CheckCircle2
        className={cn(
          "mt-0.5 size-4",
          ok ? "text-emerald-600" : "text-rose-500",
        )}
      />
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  last,
}: {
  label: string
  value: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5",
        !last && "border-b",
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
