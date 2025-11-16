import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Classroom, ClassSchedule, Professor } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, DoorClosed, Clock } from "lucide-react";

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
  const [classrooms] = useLocalStorage<Classroom[]>("classrooms", []);
  const [schedules] = useLocalStorage<ClassSchedule[]>("schedules", []);
  const [professors] = useLocalStorage<Professor[]>("professors", []);
  const [classroomStatuses, setClassroomStatuses] = useState<ClassroomStatus[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentDay = DAYS[currentTime.getDay()];
    const currentTimeStr = currentTime.toTimeString().slice(0, 5);

    const statuses: ClassroomStatus[] = classrooms.map((classroom) => {
      const todaySchedules = schedules.filter(
        (s) => s.day === currentDay && s.classroomId === classroom.id
      );

      const currentClass = todaySchedules.find((schedule) => {
        return schedule.startTime <= currentTimeStr && schedule.endTime > currentTimeStr;
      });

      if (currentClass) {
        const professor = professors.find((p) => p.id === currentClass.professorId);
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
  }, [currentTime, classrooms, schedules, professors]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Door Control System</h1>
        <p className="text-muted-foreground mt-1">
          Real-time classroom availability monitoring
        </p>
        <div className="flex items-center gap-2 mt-4 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
          </span>
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
                        <div>
                          <span className="text-xs text-muted-foreground">Professor:</span>
                          <p className="text-sm font-medium">{currentClass.professor.name}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Time:</span>
                          <p className="text-sm font-medium">
                            {currentClass.schedule.startTime} - {currentClass.schedule.endTime}
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
