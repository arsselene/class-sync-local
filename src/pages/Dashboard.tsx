import { DoorOpen, Users, Calendar, BookOpen } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Classroom, Professor, ClassSchedule } from "@/types";

export default function Dashboard() {
  const [classrooms] = useLocalStorage<Classroom[]>("classrooms", []);
  const [professors] = useLocalStorage<Professor[]>("professors", []);
  const [schedules] = useLocalStorage<ClassSchedule[]>("schedules", []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your class management system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Classrooms"
          value={classrooms.length}
          icon={DoorOpen}
          color="primary"
        />
        <StatCard
          title="Total Professors"
          value={professors.length}
          icon={Users}
          color="secondary"
        />
        <StatCard
          title="Scheduled Classes"
          value={schedules.length}
          icon={Calendar}
          color="success"
        />
        <StatCard
          title="Total Capacity"
          value={classrooms.reduce((sum, c) => sum + c.capacity, 0)}
          icon={BookOpen}
          color="warning"
        />
      </div>
    </div>
  );
}
