import { DoorOpen, Users, Calendar, BookOpen } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useProfessors } from "@/hooks/useProfessors";
import { useSchedules } from "@/hooks/useSchedules";

export default function Dashboard() {
  const { classrooms, loading: classroomsLoading } = useClassrooms();
  const { professors, loading: professorsLoading } = useProfessors();
  const { schedules, loading: schedulesLoading } = useSchedules();

  const loading = classroomsLoading || professorsLoading || schedulesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

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
