import { Bell, Check, AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/store"

const kindIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertOctagon,
}

const kindTone = {
  info: "text-blue-600",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
}

export function NotificationsPopover() {
  const notifications = useStore((s) => s.notifications)
  const unread = useStore((s) => s.notifications.filter((n) => !n.read).length)
  const markAllRead = useStore((s) => s.markAllNotificationsRead)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <Badge className="absolute -right-1 -top-1 size-4 rounded-full p-0 text-[10px]">
              {unread}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-3">
          <div className="text-sm font-semibold">Notifications</div>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unread === 0}>
            <Check className="mr-1 size-3.5" /> Mark all read
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const Icon = kindIcon[n.kind]
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 ${n.read ? "" : "bg-muted/40"}`}
                  >
                    <Icon className={`mt-0.5 size-4 shrink-0 ${kindTone[n.kind]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground">{n.detail}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{n.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
