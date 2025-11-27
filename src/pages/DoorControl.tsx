import { useEffect, useState } from "react";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useSchedules, ClassSchedule } from "@/hooks/useSchedules";
import { useProfessors, Professor } from "@/hooks/useProfessors";
import { Classroom } from "@/hooks/useClassrooms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, DoorClosed, Clock, User, Calendar } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ClassroomStatus {
  classroom: Classroom;
  isOccupied: boolean;
  currentClass?: {
    schedule: ClassSchedule;
    professor: Professor;
  };
}

export default function DoorControl() {
  const { classrooms, loading: classroomsLoading } = useClassrooms();
  const { schedules, loading: schedulesLoading } = useSchedules();
  const { professors, loading: professorsLoading } = useProfessors();
  const [classroomStatuses, setClassroomStatuses] = useState<ClassroomStatus[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loading = classroomsLoading || schedulesLoading || professorsLoading;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loading) return;

    const currentDay = DAYS[currentTime.getDay()];
    const currentTimeStr = currentTime.toTimeString().slice(0, 5);

    const statuses: ClassroomStatus[] = classrooms.map((classroom) => {
      const todaySchedules = schedules.filter(
        (s) => s.day === currentDay && s.classroom_id === classroom.id
      );

      const currentClass = todaySchedules.find((schedule) => {
        return schedule.start_time <= currentTimeStr && schedule.end_time > currentTimeStr;
      });

      if (currentClass) {
        const professor = professors.find((p) => p.id === currentClass.professor_id);
        return {
          classroom,
          isOccupied: true,
          currentClass: professor ? { schedule: currentClass, professor } : undefined,
        };
      }

      return {
        classroom,
        isOccupied: false,
      };
    });

    setClassroomStatuses(statuses);
  }, [currentTime, classrooms, schedules, professors, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading door control...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Door Control System</h1>
          <p className="text-muted-foreground mt-1">
            Real-time classroom availability monitoring
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{currentTime.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Clock className="h-5 w-5" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classroomStatuses.map(({ classroom, isOccupied, currentClass }) => (
          <Card key={classroom.id} className={isOccupied ? "border-destructive" : "border-success"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{classroom.name}</span>
                {isOccupied ? (
                  <DoorClosed className="h-5 w-5 text-destructive" />
                ) : (
                  <DoorOpen className="h-5 w-5 text-success" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={isOccupied ? "destructive" : "default"}>
                    {isOccupied ? "Occupied" : "Available"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capacity:</span>
                  <span className="text-sm font-medium">{classroom.capacity} students</span>
                </div>

                {currentClass && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-muted-foreground">Subject:</span>
                          <p className="text-sm font-medium">{currentClass.schedule.subject}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{currentClass.professor.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {currentClass.schedule.start_time} - {currentClass.schedule.end_time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classroomStatuses.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No classrooms available. Please add classrooms first.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
