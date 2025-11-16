import { Link, useLocation } from "react-router-dom";
import { Home, DoorOpen, Users, Calendar, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Classrooms", href: "/classrooms", icon: DoorOpen },
  { name: "Professors", href: "/professors", icon: Users },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Door Control", href: "/door-control", icon: GraduationCap },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <GraduationCap className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold text-foreground">ClassMaster</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
