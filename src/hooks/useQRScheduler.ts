import { useEffect } from "react";
import { useSchedules } from "./useSchedules";
import { useProfessors } from "./useProfessors";
import { useClassrooms } from "./useClassrooms";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function useQRScheduler() {
  const { schedules } = useSchedules();
  const { professors } = useProfessors();
  const { classrooms } = useClassrooms();

  useEffect(() => {
    // Check every minute for upcoming classes
    const interval = setInterval(async () => {
      const now = new Date();
      const currentDay = DAYS[now.getDay()];
      const currentTime = now.toTimeString().slice(0, 5);
      
      // Calculate time 10 minutes from now
      const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
      const targetTime = tenMinutesLater.toTimeString().slice(0, 5);

      // Find classes starting in 10 minutes
      const upcomingClasses = schedules.filter((schedule) => {
        return schedule.day === currentDay && 
               schedule.start_time >= currentTime && 
               schedule.start_time <= targetTime;
      });

      // Send QR codes for upcoming classes
      for (const schedule of upcomingClasses) {
        const professor = professors.find((p) => p.id === schedule.professor_id);
        const classroom = classrooms.find((c) => c.id === schedule.classroom_id);

        if (professor && classroom) {
          try {
            const { error } = await supabase.functions.invoke("send-class-qr", {
              body: {
                scheduleId: schedule.id,
                professorEmail: professor.email,
                professorName: professor.name,
                subject: schedule.subject,
                classroom: classroom.name,
                startTime: schedule.start_time,
                endTime: schedule.end_time,
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
