import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { ClassSchedule, Professor, Classroom } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function useQRScheduler() {
  const [schedules] = useLocalStorage<ClassSchedule[]>("schedules", []);
  const [professors] = useLocalStorage<Professor[]>("professors", []);
  const [classrooms] = useLocalStorage<Classroom[]>("classrooms", []);

  useEffect(() => {
    // Check every minute for upcoming classes
    const interval = setInterval(async () => {
      const now = new Date();
      const currentDay = DAYS[now.getDay()];
      const currentTime = now.toTimeString().slice(0, 5);
      
      // Calculate time 5 minutes from now
      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
      const targetTime = fiveMinutesLater.toTimeString().slice(0, 5);

      // Find classes starting in 5 minutes
      const upcomingClasses = schedules.filter((schedule) => {
        return schedule.day === currentDay && 
               schedule.startTime >= currentTime && 
               schedule.startTime <= targetTime;
      });

      // Send QR codes for upcoming classes
      for (const schedule of upcomingClasses) {
        const professor = professors.find((p) => p.id === schedule.professorId);
        const classroom = classrooms.find((c) => c.id === schedule.classroomId);

        if (professor && classroom) {
          try {
            const { error } = await supabase.functions.invoke("send-class-qr", {
              body: {
                scheduleId: schedule.id,
                professorEmail: professor.email,
                professorName: professor.name,
                subject: schedule.subject,
                classroom: classroom.name,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                day: schedule.day,
              },
            });

            if (error) {
              console.error("Error sending QR code:", error);
            } else {
              console.log(`QR code sent successfully for ${schedule.subject} to ${professor.email}`);
            }
          } catch (error) {
            console.error("Error invoking send-class-qr function:", error);
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [schedules, professors, classrooms]);
}
