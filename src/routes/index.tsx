import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import RootLayout from "@/components/root-layout"
import { Skeleton } from "@/components/ui/skeleton"

const Dashboard = lazy(() => import("@/pages/Dashboard"))
const LiveMap = lazy(() => import("@/pages/LiveMap"))
const ControlTower = lazy(() => import("@/pages/ControlTower"))
const Messenger = lazy(() => import("@/pages/Messenger"))
const Company = lazy(() => import("@/pages/Company"))
const SiteDetails = lazy(() => import("@/pages/SiteDetails"))
const Facilities = lazy(() => import("@/pages/Facilities"))
const Users = lazy(() => import("@/pages/Users"))
const Drivers = lazy(() => import("@/pages/Drivers"))
const Fleet = lazy(() => import("@/pages/Fleet"))
const Appointments = lazy(() => import("@/pages/Appointments"))
const Gate = lazy(() => import("@/pages/Gate"))
const DockBoard = lazy(() => import("@/pages/DockBoard"))
const Loads = lazy(() => import("@/pages/Loads"))
const Optimization = lazy(() => import("@/pages/Optimization"))
const DocumentScanner = lazy(() => import("@/pages/DocumentScanner"))
const DocumentGenerator = lazy(() => import("@/pages/DocumentGenerator"))
const DigitalSignature = lazy(() => import("@/pages/DigitalSignature"))
const Compliance = lazy(() => import("@/pages/Compliance"))
const Subscription = lazy(() => import("@/pages/Subscription"))
const Payments = lazy(() => import("@/pages/Payments"))
const Profile = lazy(() => import("@/pages/Profile"))
const Settings = lazy(() => import("@/pages/Settings"))
const NotFound = lazy(() => import("@/pages/NotFound"))

function PageFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}

const wrap = (el: React.ReactElement) => (
  <Suspense fallback={<PageFallback />}>{el}</Suspense>
)

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: wrap(<Dashboard />) },
      { path: "map", element: wrap(<LiveMap />) },
      { path: "control-tower", element: wrap(<ControlTower />) },
      { path: "messenger", element: wrap(<Messenger />) },
      { path: "company", element: wrap(<Company />) },
      { path: "company/site-details", element: wrap(<SiteDetails />) },
      { path: "company/facilities", element: wrap(<Facilities />) },
      { path: "users", element: wrap(<Users />) },
      { path: "drivers", element: wrap(<Drivers />) },
      { path: "fleet", element: wrap(<Fleet />) },
      { path: "operations/appointments", element: wrap(<Appointments />) },
      { path: "operations/gate", element: wrap(<Gate />) },
      { path: "operations/dock", element: wrap(<DockBoard />) },
      { path: "operations/loads", element: wrap(<Loads />) },
      { path: "operations/optimization", element: wrap(<Optimization />) },
      { path: "documents/scanner", element: wrap(<DocumentScanner />) },
      { path: "documents/generator", element: wrap(<DocumentGenerator />) },
      { path: "documents/signature", element: wrap(<DigitalSignature />) },
      { path: "compliance", element: wrap(<Compliance />) },
      { path: "billing/subscription", element: wrap(<Subscription />) },
      { path: "billing/payments", element: wrap(<Payments />) },
      { path: "account/profile", element: wrap(<Profile />) },
      { path: "account/settings", element: wrap(<Settings />) },
      { path: "*", element: wrap(<NotFound />) },
    ],
  },
])
