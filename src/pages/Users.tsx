import { useState } from "react"
import { AtSign, Building2, Clock, KeyRound, MoreHorizontal, Search, Send, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/page-header"
import { InviteUserDialog } from "@/components/dialogs/invite-user-dialog"
import { useStore } from "@/store"

const roleTone: Record<string, string> = {
  "Hub Manager": "bg-primary/10 text-primary",
  Dispatcher: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Operator: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  Compliance: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Gate Guard": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
}

const statusTone: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  invited: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  suspended: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
}

export default function Users() {
  const users = useStore((s) => s.users)
  const remove = useStore((s) => s.removeUser)
  const [query, setQuery] = useState("")
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = users.find((u) => u.id === openId)

  const filtered = users.filter((u) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  const target = users.find((u) => u.id === pendingDelete)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Staff, roles, and access."
        actions={<InviteUserDialog />}
      />

      <Card>
        <CardHeader className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="text-base">All users · {users.length}</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              className="h-9 pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(u.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {u.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleTone[u.role]}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.branch}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusTone[u.status]}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {u.lastActive}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {u.status === "invited" && (
                          <DropdownMenuItem onClick={() => toast.info("Invite resent")}>
                            Resend invite
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast.info("Reset link sent")}>
                          Send password reset
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-600"
                          onClick={() => setPendingDelete(u.id)}
                        >
                          <Trash2 className="mr-2 size-4" /> Remove user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {open.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{open.name}</div>
                    <div className="text-sm font-normal text-muted-foreground">{open.email}</div>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  {open.role} · {open.branch}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className={roleTone[open.role]}>{open.role}</Badge>
                  <Badge variant="secondary" className={statusTone[open.status]}>{open.status}</Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <DetailRow icon={AtSign} label="Email" value={open.email} />
                  <DetailRow icon={Building2} label="Branch" value={open.branch} />
                  <DetailRow icon={ShieldCheck} label="Role" value={open.role} />
                  <DetailRow icon={Clock} label="Last active" value={open.lastActive} />
                </div>

                <Separator />

                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Permissions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {permsForRole(open.role).map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {open.status === "invited" && (
                    <Button variant="outline" size="sm" onClick={() => toast.info("Invite resent")}>
                      <Send className="mr-1.5 size-4" /> Resend invite
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => toast.info("Reset link sent")}>
                    <KeyRound className="mr-1.5 size-4" /> Reset password
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setOpenId(null)
                      setPendingDelete(open.id)
                    }}
                  >
                    <Trash2 className="mr-1.5 size-4" /> Remove
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove user?</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.name} ({target?.email}) will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  remove(pendingDelete)
                  toast.success("User removed")
                  setPendingDelete(null)
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function permsForRole(role: string): string[] {
  switch (role) {
    case "Hub Manager":
      return ["full hub", "users", "billing", "exceptions", "reports"]
    case "Dispatcher":
      return ["appointments", "loads", "dock board", "optimizer"]
    case "Operator":
      return ["loads", "dock board", "documents"]
    case "Compliance":
      return ["drivers", "fleet", "compliance", "audit log"]
    case "Gate Guard":
      return ["gate kiosk", "check-in", "check-out"]
    default:
      return ["read-only"]
  }
}

function DetailRow({
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
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm">{value}</div>
      </div>
    </div>
  )
}
