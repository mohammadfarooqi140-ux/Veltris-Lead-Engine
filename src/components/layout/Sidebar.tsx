import Link from "next/link";
import {
  LayoutDashboard,
  Upload,
  ListTodo,
  CheckCircle,
  Clock,
  Database,
  BarChart3,
  Settings
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col h-full shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-100">Veltris Lead Engine</h1>
        <p className="text-xs text-zinc-500 mt-1">Internal Tool v1.0</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <NavItem href="/upload" icon={<Upload size={18} />} label="Upload Leads" />
        <NavItem href="/queue" icon={<ListTodo size={18} />} label="Approval Queue" />
        <NavItem href="/approved" icon={<CheckCircle size={18} />} label="Approved Leads" />
        <NavItem href="/follow-ups" icon={<Clock size={18} />} label="Follow Ups" />
        <NavItem href="/crm" icon={<Database size={18} />} label="Google Sheets CRM" />
        <NavItem href="/reports" icon={<BarChart3 size={18} />} label="Reports" />
        <NavItem href="/settings" icon={<Settings size={18} />} label="Settings & Setup" />
      </nav>

      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} Veltris
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
