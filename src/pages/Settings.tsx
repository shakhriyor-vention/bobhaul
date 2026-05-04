import {
  Bell,
  Globe,
  Languages,
  Monitor,
  Moon,
  Sun,
  Eye,
  Plug,
  Trash2,
  Download,
  Palette,
  Gauge,
} from "lucide-react"
import { toast } from "sonner"
import { useStore, type Accent, type Density } from "@/store"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { useTheme } from "@/components/theme-provider"

const accentSwatch: Record<Accent, string> = {
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
}

const integrations = [
  { name: "Slack", desc: "Push exception alerts to #ops", connected: true, init: "SL" },
  { name: "Twilio", desc: "Driver SMS notifications", connected: true, init: "TW" },
  { name: "QuickBooks", desc: "Invoice sync", connected: false, init: "QB" },
  { name: "DAT One", desc: "Load board feed", connected: false, init: "DA" },
  { name: "PowerBI", desc: "Daily KPI export", connected: true, init: "PB" },
]

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const prefs = useStore((s) => s.prefs)
  const updatePrefs = useStore((s) => s.updatePrefs)
  const resetPrefs = useStore((s) => s.resetPrefs)

  const save = () => toast.success("Settings saved")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Appearance, notifications, localization, and integrations."
        actions={
          <Button size="sm" onClick={save}>
            Save changes
          </Button>
        }
      />

      <Tabs defaultValue="appearance">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* APPEARANCE */}
        <TabsContent value="appearance" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-4" /> Theme
              </CardTitle>
              <CardDescription>How Bobhaul looks across your devices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <ThemeOption
                  active={theme === "light"}
                  onClick={() => setTheme("light")}
                  icon={Sun}
                  label="Light"
                  preview="bg-white border"
                />
                <ThemeOption
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                  icon={Moon}
                  label="Dark"
                  preview="bg-zinc-900 border border-zinc-700"
                />
                <ThemeOption
                  active={theme === "system"}
                  onClick={() => setTheme("system")}
                  icon={Monitor}
                  label="System"
                  preview="bg-gradient-to-br from-white to-zinc-900"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Accent color</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(accentSwatch) as Accent[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => updatePrefs({ accent: a })}
                      className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm capitalize transition-colors ${
                        prefs.accent === a ? "border-foreground" : "border-border hover:bg-muted"
                      }`}
                    >
                      <span className={`size-4 rounded-full ${accentSwatch[a]}`} />
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="size-4" /> Layout
              </CardTitle>
              <CardDescription>Density and spacing for tables and lists.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <DensityOption
                  active={prefs.density === "comfortable"}
                  onClick={() => updatePrefs({ density: "comfortable" as Density })}
                  label="Comfortable"
                  desc="More breathing room, easier scanning."
                />
                <DensityOption
                  active={prefs.density === "compact"}
                  onClick={() => updatePrefs({ density: "compact" as Density })}
                  label="Compact"
                  desc="Fits more rows on screen."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-4" /> Channels
              </CardTitle>
              <CardDescription>Where alerts reach you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                title="Email"
                desc="ops@bobhaul.io"
                checked={prefs.notif.email}
                onChange={(v) => updatePrefs({ notif: { ...prefs.notif, email: v } })}
              />
              <ToggleRow
                title="Push (browser)"
                desc="Toasts and desktop alerts on this device."
                checked={prefs.notif.push}
                onChange={(v) => updatePrefs({ notif: { ...prefs.notif, push: v } })}
              />
              <ToggleRow
                title="SMS"
                desc="+1 (312) 555-0144 · carrier rates may apply"
                checked={prefs.notif.sms}
                onChange={(v) => updatePrefs({ notif: { ...prefs.notif, sms: v } })}
              />
              <Separator />
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Email digest</Label>
                <Select
                  value={prefs.notif.digest}
                  onValueChange={(v) =>
                    updatePrefs({ notif: { ...prefs.notif, digest: v as "off" | "daily" | "weekly" } })
                  }
                >
                  <SelectTrigger className="sm:max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="daily">Daily summary</SelectItem>
                    <SelectItem value="weekly">Weekly summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Pick what gets through.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                title="Exceptions & SLA breaches"
                desc="Critical alerts only. Recommended on."
                checked={prefs.notif.exceptions}
                onChange={(v) => updatePrefs({ notif: { ...prefs.notif, exceptions: v } })}
              />
              <ToggleRow
                title="Appointment changes"
                desc="Bookings, cancellations, late arrivals."
                checked={prefs.notif.appointments}
                onChange={(v) => updatePrefs({ notif: { ...prefs.notif, appointments: v } })}
              />
              <ToggleRow
                title="Signature requests"
                desc="When BOL/POD needs your sign-off."
                checked={prefs.notif.sigs}
                onChange={(v) => updatePrefs({ notif: { ...prefs.notif, sigs: v } })}
              />
              <ToggleRow
                title="Optimizer suggestions"
                desc="Off by default — can be noisy."
                checked={prefs.notif.optimizer}
                onChange={(v) => updatePrefs({ notif: { ...prefs.notif, optimizer: v } })}
              />
              <ToggleRow
                title="Billing & invoices"
                desc="Payment receipts and renewals."
                checked={prefs.notif.billing}
                onChange={(v) => updatePrefs({ notif: { ...prefs.notif, billing: v } })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOCALIZATION */}
        <TabsContent value="localization" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-4" /> Region
              </CardTitle>
              <CardDescription>Affects times, dates, and unit display.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Language"
                icon={Languages}
                value={prefs.language}
                onChange={(v) => updatePrefs({ language: v })}
                options={[
                  { v: "en-US", l: "English (US)" },
                  { v: "en-GB", l: "English (UK)" },
                  { v: "es-MX", l: "Español (México)" },
                  { v: "fr-FR", l: "Français" },
                  { v: "de-DE", l: "Deutsch" },
                  { v: "ja-JP", l: "日本語" },
                ]}
              />
              <SelectField
                label="Time zone"
                value={prefs.timezone}
                onChange={(v) => updatePrefs({ timezone: v })}
                options={[
                  { v: "America/Chicago", l: "Central · Chicago" },
                  { v: "America/New_York", l: "Eastern · New York" },
                  { v: "America/Denver", l: "Mountain · Denver" },
                  { v: "America/Los_Angeles", l: "Pacific · Los Angeles" },
                  { v: "Europe/London", l: "GMT · London" },
                  { v: "Asia/Tokyo", l: "JST · Tokyo" },
                ]}
              />
              <SelectField
                label="Time format"
                value={prefs.timeFormat}
                onChange={(v) => updatePrefs({ timeFormat: v as "12h" | "24h" })}
                options={[
                  { v: "24h", l: "24-hour (14:30)" },
                  { v: "12h", l: "12-hour (2:30 PM)" },
                ]}
              />
              <SelectField
                label="Date format"
                value={prefs.dateFormat}
                onChange={(v) => updatePrefs({ dateFormat: v as "us" | "iso" | "eu" })}
                options={[
                  { v: "us", l: "MM/DD/YYYY" },
                  { v: "iso", l: "YYYY-MM-DD" },
                  { v: "eu", l: "DD/MM/YYYY" },
                ]}
              />
              <SelectField
                label="Units"
                value={prefs.units}
                onChange={(v) => updatePrefs({ units: v as "imperial" | "metric" })}
                options={[
                  { v: "imperial", l: "Imperial (lb, mi, °F)" },
                  { v: "metric", l: "Metric (kg, km, °C)" },
                ]}
              />
              <SelectField
                label="Week starts on"
                value={prefs.weekStart}
                onChange={(v) => updatePrefs({ weekStart: v as "monday" | "sunday" })}
                options={[
                  { v: "monday", l: "Monday" },
                  { v: "sunday", l: "Sunday" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACCESSIBILITY */}
        <TabsContent value="accessibility" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="size-4" /> Accessibility
              </CardTitle>
              <CardDescription>Make Bobhaul more comfortable to use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                title="Reduce motion"
                desc="Disable transitions and animations across the app."
                checked={prefs.reduceMotion}
                onChange={(v) => updatePrefs({ reduceMotion: v })}
              />
              <ToggleRow
                title="High contrast"
                desc="Stronger borders and contrast ratios."
                checked={prefs.highContrast}
                onChange={(v) => updatePrefs({ highContrast: v })}
              />
              <Separator />
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Text size</Label>
                <Select
                  value={prefs.textSize}
                  onValueChange={(v) => updatePrefs({ textSize: v as "small" | "medium" | "large" })}
                >
                  <SelectTrigger className="sm:max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="size-4" /> Connected services
              </CardTitle>
              <CardDescription>Apps that read or write Bobhaul data.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {integrations.map((it) => (
                <div key={it.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                    {it.init}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-muted-foreground">{it.desc}</div>
                  </div>
                  {it.connected ? (
                    <>
                      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        Connected
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.success(`${it.name} disconnected`)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success(`${it.name} connected`)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVANCED */}
        <TabsContent value="advanced" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="size-4" /> Data export
              </CardTitle>
              <CardDescription>Download a copy of your account data.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Includes profile, audit, appointments, and BOL records (last 12 months).
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.success("Export queued · email when ready")}
              >
                Request export
              </Button>
            </CardContent>
          </Card>

          <Card className="border-rose-500/30">
            <CardHeader>
              <CardTitle className="text-rose-700 dark:text-rose-300">Danger zone</CardTitle>
              <CardDescription>Destructive actions for this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <DangerRow
                title="Reset preferences"
                desc="Restore appearance, notifications, and localization to defaults."
                actionLabel="Reset"
                onConfirm={() => {
                  resetPrefs()
                  toast.success("Preferences reset")
                }}
              />
              <Separator />
              <DangerRow
                title="Wipe local cache"
                desc="Clear cached store data. You'll be signed out of this device."
                actionLabel="Wipe cache"
                destructive
                icon={Trash2}
                onConfirm={() => toast.error("Demo only · cache not wiped")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ThemeOption({
  active,
  onClick,
  icon: Icon,
  label,
  preview,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  preview: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors ${
        active ? "border-foreground bg-muted/40" : "border-border hover:bg-muted/30"
      }`}
    >
      <div className={`h-16 w-full rounded-md ${preview}`} />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="size-4" /> {label}
        </span>
        {active && <Badge variant="secondary" className="text-[10px]">Selected</Badge>}
      </div>
    </button>
  )
}

function DensityOption({
  active,
  onClick,
  label,
  desc,
}: {
  active: boolean
  onClick: () => void
  label: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors ${
        active ? "border-foreground bg-muted/40" : "border-border hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between text-sm font-medium">
        {label}
        {active && <Badge variant="secondary" className="text-[10px]">Selected</Badge>}
      </div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  )
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function SelectField({
  label,
  icon: Icon,
  value,
  onChange,
  options,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" />} {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DangerRow({
  title,
  desc,
  actionLabel,
  onConfirm,
  destructive,
  icon: Icon,
}: {
  title: string
  desc: string
  actionLabel: string
  onConfirm: () => void
  destructive?: boolean
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm">
        <div className="font-medium">{title}</div>
        <div className="text-muted-foreground">{desc}</div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={destructive ? "destructive" : "outline"} size="sm">
            {Icon && <Icon className="mr-1.5 size-4" />} {actionLabel}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}?</AlertDialogTitle>
            <AlertDialogDescription>{desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
