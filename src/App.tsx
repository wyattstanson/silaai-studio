import { useEffect, useState, type ReactNode } from "react";
import { StoreProvider, useStore } from "./data/store";
import { WindowProvider, type WinState } from "./components/windows/WindowManager";
import { Shell, type NavItem } from "./components/Shell";
import { Dashboard } from "./modules/Dashboard";
import { Orders } from "./modules/Orders";
import { Customers } from "./modules/Customers";
import { Payments } from "./modules/Payments";
import { Reports } from "./modules/Reports";
import { Settings } from "./modules/Settings";
import { Admin } from "./modules/Admin";
import { Placeholder } from "./modules/Placeholder";
import { Showcase } from "./modules/Showcase";
import { Auth } from "./modules/Auth";
import { Portal } from "./modules/Portal";
import { Requests } from "./modules/Requests";
import { OrderDetail } from "./modules/OrderSheet";
import { CustomerAdmin } from "./modules/CustomerAdmin";
import { Empty } from "./components/ui/ui";
import { isClosed } from "./lib/stages";
import { CustomPointer } from "./components/CustomPointer";
import { Splash } from "./components/Splash";

/* Content for a floating window; subscribes to the store so windows stay live. */
function WindowContent({ win, readOnly }: { win: WinState; readOnly: boolean }) {
  const { db } = useStore();
  if (win.kind === "order") {
    const o = db.orders.find(o => o.id === win.payload?.orderId);
    return o ? <OrderDetail order={o} bare readOnly={readOnly} /> : <Empty title="This order was removed" />;
  }
  if (win.kind === "customer") return <CustomerAdmin customerId={win.payload?.customerId} />;
  return null;
}

/* ---- Owner: full studio + admin ----------------------------- */
function Studio({ onShowcase }: { onShowcase: () => void }) {
  const { db, logout } = useStore();
  const [active, setActive] = useState("dashboard");
  const on = (id: string) => db.modules.find(m => m.id === id)?.enabled;
  const activeOrders = db.orders.filter(o => !isClosed(o.stage)).length;

  const nav: NavItem[] = [{ id: "dashboard", label: "Overview", icon: "overview", group: "Studio", tone: "neutral" }];
  if (on("tailoring")) {
    nav.push({ id: "orders", label: "Orders", icon: "orders", group: "Tailoring", count: activeOrders, tone: "accent" });
    nav.push({ id: "customers", label: "Customers", icon: "customers", group: "Tailoring", count: db.customers.length, tone: "sage" });
  }
  const openReq = db.requests.filter(r => ["submitted", "acknowledged"].includes(r.status)).length;
  nav.push({ id: "requests", label: "Requests", icon: "requests", group: "Manage", count: openReq, tone: "clay" });
  nav.push({ id: "admin", label: "Admin Console", icon: "settings", group: "Manage", tone: "clay" });
  if (on("sales")) nav.push({ id: "sales", label: "Material Sales", icon: "sales", group: "Counter", tone: "sage" });
  if (on("payments")) nav.push({ id: "payments", label: "Payments", icon: "payments", group: "Money", tone: "accent" });
  if (on("reports")) nav.push({ id: "reports", label: "Reports", icon: "reports", group: "Insight", tone: "neutral" });
  if (on("courier")) nav.push({ id: "courier", label: "Dispatch", icon: "courier", group: "Counter", tone: "clay" });
  if (on("course")) nav.push({ id: "course", label: "Courses", icon: "course", group: "Learning", tone: "sage" });

  const known = new Set([...nav.map(n => n.id), "settings"]);
  const view = known.has(active) ? active : "dashboard";
  const crumb = view === "settings" ? "Modules & Settings" : (nav.find(n => n.id === view)?.label ?? "Overview");

  return (
    <Shell nav={nav} active={view} onNavigate={setActive} crumb={crumb} onShowcase={onShowcase} onLogout={logout}
      viewKey={view} renderWindow={win => <WindowContent win={win} readOnly={false} />}>
      {view === "dashboard" && <Dashboard go={setActive} />}
      {view === "orders" && <Orders />}
      {view === "customers" && <Customers />}
      {view === "requests" && <Requests />}
      {view === "admin" && <Admin />}
      {view === "payments" && <Payments />}
      {view === "reports" && <Reports />}
      {view === "settings" && <Settings />}
      {view === "sales" && <Placeholder title="Material Sales" icon="sales" blurb="Sell fabric and trims over the counter, tied to the same customers." />}
      {view === "courier" && <Placeholder title="Dispatch & Courier" icon="courier" blurb="Track outside orders from ready to handed-over." />}
      {view === "course" && <Placeholder title="Courses" icon="course" blurb="Run tailoring classes and track students alongside the shop." />}
    </Shell>
  );
}

/* ---- Member: family portal ---------------------------------- */
function MemberPortal({ onShowcase }: { onShowcase: () => void }) {
  const { db, activeCustomer, logout } = useStore();
  const [active, setActive] = useState("portal");
  const cid = activeCustomer?.id;
  const activeOrders = db.orders.filter(o => o.customerId === cid && !isClosed(o.stage)).length;

  const openReq = db.requests.filter(r => r.customerId === cid && ["submitted", "acknowledged", "scheduled", "in_progress"].includes(r.status)).length;
  const nav: NavItem[] = [
    { id: "portal", label: "Overview", icon: "overview", group: "My Studio", tone: "neutral" },
    { id: "myorders", label: "My Orders", icon: "orders", group: "My Studio", count: activeOrders, tone: "accent" },
    { id: "requests", label: "Requests", icon: "requests", group: "My Studio", count: openReq, tone: "clay" },
    { id: "measurements", label: "Measurements", icon: "measure", group: "My Studio", tone: "sage" },
    { id: "history", label: "History", icon: "history", group: "My Studio", tone: "clay" },
  ];
  const view = nav.some(n => n.id === active) ? active : "portal";
  const crumb = nav.find(n => n.id === view)?.label ?? "Overview";

  return (
    <Shell nav={nav} active={view} onNavigate={setActive} crumb={crumb} onShowcase={onShowcase} onLogout={logout} canManage={false}
      viewKey={view} renderWindow={win => <WindowContent win={win} readOnly />}>
      {view === "requests" ? <Requests /> : <Portal active={view} go={setActive} />}
    </Shell>
  );
}

/* ---- Root routing ------------------------------------------- */
function Root() {
  const { user } = useStore();
  const [route, setRoute] = useState<"showcase" | "auth">("showcase");
  const [viewShowcase, setViewShowcase] = useState(false);

  useEffect(() => { setViewShowcase(false); if (user) setRoute("showcase"); }, [user?.id]);

  let view: ReactNode;
  if (!user) {
    view = route === "auth"
      ? <Auth onBack={() => setRoute("showcase")} />
      : <Showcase onEnter={() => setRoute("auth")} />;
  } else if (viewShowcase) {
    view = <Showcase loggedIn onEnter={() => setViewShowcase(false)} onBack={() => setViewShowcase(false)} />;
  } else {
    view = user.role === "owner"
      ? <Studio onShowcase={() => setViewShowcase(true)} />
      : <MemberPortal onShowcase={() => setViewShowcase(true)} />;
  }

  return view;
}

export default function App() {
  return (
    <StoreProvider>
      <WindowProvider>
        <Root />
      </WindowProvider>
      <CustomPointer />
      <Splash />
    </StoreProvider>
  );
}
