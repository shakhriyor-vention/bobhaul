import { useState } from "react"
import {
  Activity,
  AtSign,
  Building2,
  Camera,
  Clock,
  KeyRound,
  Laptop,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
import { PageHeader } from "@/components/page-header"

type ProfileDraft = {
  fullName: string
  title: string
  email: string
  phone: string
  branch: string
  bio: string
}

const seed: ProfileDraft = {
  fullName: "Jules Okafor",
  title: "Operations Lead",
  email: "ops@bobhaul.io",
  phone: "+1 (312) 555-0144",
  branch: "North Hub · Chicago, IL",
  bio: "Runs the North Hub day shift. Owns dock throughput, gate flow, and exception triage.",
}

const sessions = [
  {
    id: "s1",
    device: "MacBook Pro · Chrome",
    icon: Laptop,
    location: "Chicago, IL · 67.182.4.x",
    last: "Active now",
    current: true,
  },
  {
    id: "s2",
    device: "iPhone 15 · Safari",
    icon: Smartphone,
    location: "Chicago, IL · cellular",
    last: "2h ago",
  },
  {
    id: "s3",
    device: "Yard tablet · Edge",
    icon: Laptop,
    location: "North Hub · 10.0.4.18",
    last: "Yesterday",
  },
]

const recentActivity = [
  { id: "a1", text: "Approved appointment AP-006 (Bobhaul · LD-4441)", time: "12m ago" },
  { id: "a2", text: "Resolved exception EX-1040 · Late arrival LD-4421", time: "48m ago" },
  { id: "a3", text: "Generated BOL for LD-4421", time: "1h ago" },
  { id: "a4", text: "Reassigned D-03 to LD-4422", time: "3h ago" },
  { id: "a5", text: "Signed in from MacBook Pro · Chicago, IL", time: "Today, 06:42" },
]

export default function Profile() {
  const [draft, setDraft] = useState<ProfileDraft>(seed)
  const [saved, setSaved] = useState<ProfileDraft>(seed)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })
  const [twoFA, setTwoFA] = useState(true)
  const [sessionAlerts, setSessionAlerts] = useState(true)

  const initials = draft.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const save = () => {
    setSaved(draft)
    toast.success("Profile updated")
  }

  const changePassword = () => {
    if (!pwd.current || !pwd.next) {
      toast.error("Fill both password fields")
      return
    }
    if (pwd.next.length < 8) {
      toast.error("Use 8+ characters")
      return
    }
    if (pwd.next !== pwd.confirm) {
      toast.error("Passwords don't match")
      return
    }
    setPwd({ current: "", next: "", confirm: "" })
    toast.success("Password changed")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Personal info, security, and recent activity."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setDraft(saved)} disabled={!dirty}>
              Discard
            </Button>
            <Button size="sm" onClick={save} disabled={!dirty}>
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="size-16 rounded-xl">
                  <AvatarImage src="" alt={draft.fullName} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                    {initials || "OP"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 size-7 rounded-full"
                  onClick={() => toast.info("Photo upload coming soon")}
                >
                  <Camera className="size-3.5" />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate">{draft.fullName}</CardTitle>
                <CardDescription className="truncate">{draft.title}</CardDescription>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">Operator</Badge>
                  <Badge variant="outline">2FA on</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Separator />
            <Row icon={AtSign} label="Email" value={draft.email} />
            <Row icon={Phone} label="Phone" value={draft.phone} />
            <Row icon={Building2} label="Branch" value={draft.branch} />
            <Row icon={MapPin} label="Time zone" value="America/Chicago (CDT)" />
            <Separator />
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label="Loads handled" value="312" />
              <Stat label="On-time %" value="94" />
              <Stat label="Tenure" value="2y 4m" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal info</CardTitle>
              <CardDescription>Visible to your team.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} />
              <Field label="Job title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
              <Field label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
              <Field label="Phone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
              <div className="sm:col-span-2">
                <Field label="Branch" value={draft.branch} onChange={(v) => setDraft({ ...draft, branch: v })} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bio</Label>
                <Textarea
                  rows={3}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  placeholder="Short blurb about your role…"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" /> Security
              </CardTitle>
              <CardDescription>Password, two-factor, and access alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <PwdField label="Current password" value={pwd.current} onChange={(v) => setPwd({ ...pwd, current: v })} />
                <PwdField label="New password" value={pwd.next} onChange={(v) => setPwd({ ...pwd, next: v })} />
                <PwdField label="Confirm" value={pwd.confirm} onChange={(v) => setPwd({ ...pwd, confirm: v })} />
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={changePassword}>
                  <KeyRound className="mr-1.5 size-4" /> Update password
                </Button>
              </div>
              <Separator />
              <ToggleRow
                title="Two-factor authentication"
                desc="Require an authenticator code on every sign-in."
                checked={twoFA}
                onChange={setTwoFA}
              />
              <ToggleRow
                title="New sign-in alerts"
                desc="Email me when an unrecognized device signs in."
                checked={sessionAlerts}
                onChange={setSessionAlerts}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active sessions</CardTitle>
              <CardDescription>Devices currently signed into your account.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <s.icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {s.device}
                      {s.current && (
                        <Badge variant="secondary" className="text-[10px]">Current</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.location}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{s.last}</div>
                  {!s.current && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.success(`${s.device} signed out`)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4" /> Recent activity
              </CardTitle>
              <CardDescription>What you've done across the hub.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 size-1.5 rounded-full bg-primary/60" />
                    <div className="flex-1">{e.text}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {e.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-500/30">
            <CardHeader>
              <CardTitle className="text-rose-700 dark:text-rose-300">Danger zone</CardTitle>
              <CardDescription>Account-level actions that can't be undone.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <div className="font-medium">Delete account</div>
                <div className="text-muted-foreground">
                  Removes your access immediately. Audit history is retained.
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1.5 size-4" /> Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll lose access to North Hub immediately. Audit history is retained for compliance.
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate">{value}</div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function PwdField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
      />
    </div>
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
