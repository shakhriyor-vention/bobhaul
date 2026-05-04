import { Check, Sparkles } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"
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
import { useStore, type SubscriptionPlan } from "@/store"

const plans: { name: SubscriptionPlan; price: string; period: string; features: string[] }[] = [
  {
    name: "Starter",
    price: "$199",
    period: "/mo",
    features: ["Up to 2 hubs", "20 users", "Basic optimization", "Email support"],
  },
  {
    name: "Growth",
    price: "$549",
    period: "/mo",
    features: [
      "Up to 8 hubs",
      "Unlimited users",
      "AI dock optimizer",
      "Priority support",
      "Custom doc templates",
      "API + webhooks",
    ],
  },
  {
    name: "Enterprise",
    price: "$1,499",
    period: "/mo",
    features: [
      "Unlimited hubs",
      "SSO + SAML",
      "Dedicated infra",
      "24/7 SLA",
      "On-prem connector",
    ],
  },
]

export default function Subscription() {
  const subscription = useStore((s) => s.subscription)
  const facilities = useStore((s) => s.facilities)
  const users = useStore((s) => s.users)
  const change = useStore((s) => s.changePlan)

  const usage = [
    { label: "Active users", value: users.length, max: "Unlimited" },
    {
      label: "Hubs",
      value: facilities.length,
      max: subscription.plan === "Starter" ? 2 : subscription.plan === "Growth" ? 8 : "∞",
      percent: subscription.plan === "Growth" ? Math.min(100, (facilities.length / 8) * 100) : 50,
    },
    { label: "API calls (this month)", value: "184k", max: "500k", percent: 37 },
    { label: "Storage", value: "12.4 GB", max: "100 GB", percent: 12 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Plan, usage, and billing cycle."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Billing portal coming soon")}
          >
            Manage billing
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle>{subscription.plan} plan</CardTitle>
              <Badge>Current</Badge>
            </div>
            <CardDescription className="mt-1">
              Renews {subscription.renewsOn} · ${subscription.price} / month
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {usage.map((u) => (
            <div key={u.label} className="space-y-2">
              <div className="text-xs text-muted-foreground">{u.label}</div>
              <div className="text-xl font-semibold tabular-nums">{u.value}</div>
              <div className="text-xs text-muted-foreground">of {u.max}</div>
              {u.percent !== undefined && <Progress value={u.percent} className="h-1.5" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const current = subscription.plan === p.name
          return (
            <Card key={p.name} className={current ? "border-primary shadow-sm" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  {current && <Badge>Current</Badge>}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {current ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full">Switch to {p.name}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Switch to {p.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Proration preview based on current cycle remainder.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <ProrationPreview
                        currentPrice={subscription.price}
                        nextPrice={Number(p.price.replace(/[^0-9]/g, ""))}
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => change(p.name)}>
                          Confirm switch
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ProrationPreview({
  currentPrice,
  nextPrice,
}: {
  currentPrice: number
  nextPrice: number
}) {
  const today = new Date()
  const cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const daysLeft = Math.max(1, Math.round((cycleEnd.getTime() - today.getTime()) / 86400000))
  const cycleDays = 30
  const used = cycleDays - daysLeft
  const unusedCredit = Math.round((currentPrice * daysLeft) / cycleDays)
  const newCharge = Math.round((nextPrice * daysLeft) / cycleDays)
  const dueToday = Math.max(0, newCharge - unusedCredit)
  const isUpgrade = nextPrice > currentPrice

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Proration · {daysLeft} of {cycleDays} days remaining
      </div>
      <div className="space-y-1.5">
        <Row label={`Unused credit (${used}/${cycleDays}d)`} value={`-$${unusedCredit}`} />
        <Row label={`New plan (${daysLeft}d remaining)`} value={`$${newCharge}`} />
        <div className="my-1 border-t" />
        <Row
          label={isUpgrade ? "Charged today" : "Credited to next invoice"}
          value={`$${dueToday}`}
          bold
        />
        <div className="text-[11px] text-muted-foreground">
          Next full invoice on {new Date(cycleEnd).toLocaleDateString()}: ${nextPrice}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  )
}
