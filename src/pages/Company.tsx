import { useEffect, useMemo, useState } from "react"
import {
  AtSign,
  Building2,
  Camera,
  CheckCircle2,
  CreditCard,
  FileBadge,
  Globe,
  IdCard,
  Image as ImageIcon,
  MapPin,
  Palette,
  Phone,
  Save,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react"
import { toast } from "sonner"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useStore, type AccountInfo } from "@/store"

type ExtraInfo = {
  phone: string
  website: string
  description: string
  street: string
  city: string
  state: string
  postal: string
  country: string
  billingEmail: string
  billingAddressSame: boolean
  taxId: string
}

const seedExtra: ExtraInfo = {
  phone: "+1-214-555-0198",
  website: "https://www.bobhaul.com",
  description:
    "Freight and logistics company specializing in long-haul transportation and supply chain solutions.",
  street: "540 W Madison St, Suite 12",
  city: "Chicago",
  state: "IL",
  postal: "60661",
  country: "US",
  billingEmail: "ap@bobhaul.io",
  billingAddressSame: true,
  taxId: "EIN 47-2231904",
}

export default function Company() {
  const account = useStore((s) => s.account)
  const update = useStore((s) => s.updateAccount)
  const subscription = useStore((s) => s.subscription)
  const facilities = useStore((s) => s.facilities)
  const drivers = useStore((s) => s.drivers)
  const vehicles = useStore((s) => s.vehicles)

  const [draft, setDraft] = useState<AccountInfo>(account)
  const [extra, setExtra] = useState<ExtraInfo>(seedExtra)
  useEffect(() => setDraft(account), [account])

  const dirty = useMemo(
    () =>
      JSON.stringify(draft) !== JSON.stringify(account) ||
      JSON.stringify(extra) !== JSON.stringify(seedExtra),
    [draft, account, extra]
  )

  const save = () => {
    update(draft)
    toast.success("Company account saved")
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your facility logistics profile and settings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 size-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this company account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Removes the workspace immediately. Audit and billing history are retained
                  for compliance.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => toast.error("Demo only · account not deleted")}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button size="sm" onClick={save} disabled={!dirty}>
            <Save className="mr-2 size-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Identity banner */}
      <IdentityBanner
        name={draft.legalName}
        plan={subscription.plan}
        type="Facility / Warehouse"
      />

      {/* Tabs card */}
      <Card className="overflow-hidden p-0">
        <Tabs defaultValue="general" className="gap-0">
          <div className="border-b px-4 sm:px-6">
            <TabsList variant="line" className="h-auto py-3">
              <TabsTrigger value="general" className="px-3">
                <Building2 className="size-4" /> General Info
              </TabsTrigger>
              <TabsTrigger value="address" className="px-3">
                <MapPin className="size-4" /> Address
              </TabsTrigger>
              <TabsTrigger value="billing" className="px-3">
                <CreditCard className="size-4" /> Billing
              </TabsTrigger>
              <TabsTrigger value="compliance" className="px-3">
                <FileBadge className="size-4" /> Compliance
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="p-6">
            <GeneralInfoTab
              draft={draft}
              setDraft={setDraft}
              extra={extra}
              setExtra={setExtra}
            />
          </TabsContent>

          <TabsContent value="address" className="p-6">
            <AddressTab extra={extra} setExtra={setExtra} />
          </TabsContent>

          <TabsContent value="billing" className="p-6">
            <BillingTab
              extra={extra}
              setExtra={setExtra}
              plan={subscription.plan}
              taxId={extra.taxId}
              counts={{
                facilities: facilities.length,
                drivers: drivers.length,
                vehicles: vehicles.length,
              }}
            />
          </TabsContent>

          <TabsContent value="compliance" className="p-6">
            <ComplianceTab draft={draft} setDraft={setDraft} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

// ── Identity banner ─────────────────────────────────────────────────────────

function IdentityBanner({
  name,
  plan,
  type,
}: {
  name: string
  plan: string
  type: string
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-44 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_30%,#fff_1px,transparent_1px),radial-gradient(circle_at_80%_70%,#fff_1px,transparent_1px)] [background-size:120px_120px,160px_160px]" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-4 size-9 rounded-full shadow"
              onClick={() => toast.info("Theme picker coming soon")}
            >
              <Palette className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Personalize</TooltipContent>
        </Tooltip>
      </div>

      <div className="relative px-6 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-14 sm:-mt-16">
              <div className="relative">
                <div className="flex size-28 items-center justify-center rounded-2xl border bg-card shadow-md">
                  <div className="flex size-20 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    <Truck className="size-10" />
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 size-8 rounded-full shadow"
                  onClick={() => toast.info("Logo upload coming soon")}
                >
                  <Camera className="size-4" />
                </Button>
              </div>
            </div>

            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold leading-tight">{name}</h2>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                >
                  3PL
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {type}
                <span className="mx-1.5 text-foreground/30">·</span>
                <span className="font-medium text-foreground">{plan} Plan</span>
                <span className="mx-1.5 text-foreground/30">·</span>
                <button
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() => toast.info("Open plan switcher")}
                >
                  Change
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── General Info ────────────────────────────────────────────────────────────

function GeneralInfoTab({
  draft,
  setDraft,
  extra,
  setExtra,
}: {
  draft: AccountInfo
  setDraft: (v: AccountInfo) => void
  extra: ExtraInfo
  setExtra: (v: ExtraInfo) => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Field
          label="Company Name"
          labelIcon={Building2}
          value={draft.dba}
          onChange={(v) => setDraft({ ...draft, dba: v })}
        />
        <Field
          label="Legal Entity Name"
          labelIcon={Sparkles}
          value={draft.legalName}
          onChange={(v) => setDraft({ ...draft, legalName: v })}
        />
        <Field
          label="Registration Number"
          labelIcon={IdCard}
          value="REG-45879231"
          onChange={() => undefined}
        />
        <Field
          label="DOT Number"
          labelIcon={Truck}
          value={draft.dotNumber}
          onChange={(v) => setDraft({ ...draft, dotNumber: v })}
        />
        <Field
          label="Email"
          labelIcon={AtSign}
          type="email"
          value={draft.contactEmail}
          onChange={(v) => setDraft({ ...draft, contactEmail: v })}
        />
        <Field
          label="Phone"
          labelIcon={Phone}
          value={extra.phone}
          onChange={(v) => setExtra({ ...extra, phone: v })}
        />
        <Field
          label="MC Number"
          labelIcon={FileBadge}
          value={draft.mcNumber}
          onChange={(v) => setDraft({ ...draft, mcNumber: v })}
        />
        <div />
        <div className="sm:col-span-2">
          <Field
            label="Website"
            labelIcon={Globe}
            value={extra.website}
            onChange={(v) => setExtra({ ...extra, website: v })}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <FieldLabel icon={ImageIcon}>Description</FieldLabel>
          <Textarea
            rows={3}
            value={extra.description}
            onChange={(e) => setExtra({ ...extra, description: e.target.value })}
            placeholder="Short description visible to partners and on documents."
          />
        </div>
      </div>
    </div>
  )
}

// ── Address ─────────────────────────────────────────────────────────────────

function AddressTab({
  extra,
  setExtra,
}: {
  extra: ExtraInfo
  setExtra: (v: ExtraInfo) => void
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Headquarters address"
        description="Used on documents, invoices, and shipping labels."
      />
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Street Address"
            labelIcon={MapPin}
            value={extra.street}
            onChange={(v) => setExtra({ ...extra, street: v })}
          />
        </div>
        <Field
          label="City"
          value={extra.city}
          onChange={(v) => setExtra({ ...extra, city: v })}
        />
        <Field
          label="State / Region"
          value={extra.state}
          onChange={(v) => setExtra({ ...extra, state: v })}
        />
        <Field
          label="Postal Code"
          value={extra.postal}
          onChange={(v) => setExtra({ ...extra, postal: v })}
        />
        <div className="space-y-1.5">
          <FieldLabel>Country</FieldLabel>
          <Select
            value={extra.country}
            onValueChange={(v) => setExtra({ ...extra, country: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="MX">Mexico</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ── Billing ─────────────────────────────────────────────────────────────────

function BillingTab({
  extra,
  setExtra,
  plan,
  taxId,
  counts,
}: {
  extra: ExtraInfo
  setExtra: (v: ExtraInfo) => void
  plan: string
  taxId: string
  counts: { facilities: number; drivers: number; vehicles: number }
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Plan & billing"
        description="Subscription details and accounts payable contact."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <PlanCard label="Current plan" value={plan} hint="Renews monthly" highlight />
        <PlanCard label="Tax ID" value={taxId} hint="EIN" mono />
        <PlanCard
          label="Coverage"
          value={`${counts.facilities} sites · ${counts.drivers} drivers`}
          hint={`${counts.vehicles} trucks`}
        />
      </div>

      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Field
          label="Billing Email"
          labelIcon={AtSign}
          type="email"
          value={extra.billingEmail}
          onChange={(v) => setExtra({ ...extra, billingEmail: v })}
        />
        <Field
          label="Tax ID"
          labelIcon={IdCard}
          value={extra.taxId}
          onChange={(v) => setExtra({ ...extra, taxId: v })}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">
            Billing address same as headquarters
          </div>
          <div className="text-sm text-muted-foreground">
            Disable to use a separate billing address.
          </div>
        </div>
        <Switch
          checked={extra.billingAddressSame}
          onCheckedChange={(v) => setExtra({ ...extra, billingAddressSame: v })}
        />
      </div>
    </div>
  )
}

function PlanCard({
  label,
  value,
  hint,
  highlight,
  mono,
}: {
  label: string
  value: string
  hint?: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/5"
          : "bg-muted/30"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-base font-semibold ${
          mono ? "font-mono text-sm" : ""
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

// ── Compliance ──────────────────────────────────────────────────────────────

function ComplianceTab({
  draft,
  setDraft,
}: {
  draft: AccountInfo
  setDraft: (v: AccountInfo) => void
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Regulatory identifiers"
        description="Verified against FMCSA. Updates trigger re-verification."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ComplianceRow
          icon={Truck}
          label="DOT Number"
          value={draft.dotNumber}
          status="verified"
          onChange={(v) => setDraft({ ...draft, dotNumber: v })}
        />
        <ComplianceRow
          icon={FileBadge}
          label="MC Number"
          value={draft.mcNumber}
          status="verified"
          onChange={(v) => setDraft({ ...draft, mcNumber: v })}
        />
      </div>

      <SectionHeader
        title="Insurance"
        description="Carriers and expiration tracked per certificate."
      />

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Policy</th>
              <th className="px-4 py-2.5 text-left font-medium">Carrier</th>
              <th className="px-4 py-2.5 text-left font-medium">Coverage</th>
              <th className="px-4 py-2.5 text-left font-medium">Expires</th>
              <th className="w-px" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              {
                policy: "Auto liability",
                carrier: "Progressive Commercial",
                coverage: "$1,000,000",
                expires: "2026-09-30",
                ok: true,
              },
              {
                policy: "Cargo",
                carrier: "Great West Casualty",
                coverage: "$100,000",
                expires: "2026-08-12",
                ok: true,
              },
              {
                policy: "General liability",
                carrier: "The Hartford",
                coverage: "$2,000,000",
                expires: "2026-06-04",
                ok: false,
              },
            ].map((r) => (
              <tr key={r.policy} className="bg-card">
                <td className="px-4 py-3 font-medium">{r.policy}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.carrier}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.coverage}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      r.ok
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }
                  >
                    {r.expires}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComplianceRow({
  icon: Icon,
  label,
  value,
  status,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  status: "verified" | "pending"
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel icon={Icon}>{label}</FieldLabel>
        {status === "verified" ? (
          <Badge
            variant="secondary"
            className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          >
            <CheckCircle2 className="size-3" /> Verified
          </Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        )}
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// ── Atoms ──────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

function FieldLabel({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {Icon && <Icon className="size-3.5" />} {children}
    </Label>
  )
}

function Field({
  label,
  labelIcon,
  value,
  onChange,
  type = "text",
}: {
  label: string
  labelIcon?: React.ComponentType<{ className?: string }>
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel icon={labelIcon}>{label}</FieldLabel>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
