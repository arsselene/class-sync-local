import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSchedules } from "@/hooks/useSchedules";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useProfessors } from "@/hooks/useProfessors";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule() {
  const { schedules, loading: schedulesLoading, addSchedule, deleteSchedule } = useSchedules();
  const { classrooms, loading: classroomsLoading } = useClassrooms();
  const { professors, loading: professorsLoading } = useProfessors();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    day: "",
    start_time: "",
    end_time: "",
    classroom_id: "",
    professor_id: "",
    subject: "",
  });

  const loading = schedulesLoading || classroomsLoading || professorsLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.day ||
      !formData.start_time ||
      !formData.end_time ||
      !formData.classroom_id ||
      !formData.professor_id ||
      !formData.subject
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    const success = await addSchedule(formData);

    if (success) {
      setFormData({
        day: "",
        start_time: "",
        end_time: "",
        classroom_id: "",
        professor_id: "",
        subject: "",
      });
      setOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSchedule(id);
  };

  const getClassroomName = (id: string) => {
    return classrooms.find((c) => c.id === id)?.name || "Unknown";
  };

  const getProfessorName = (id: string) => {
    return professors.find((p) => p.id === id)?.name || "Unknown";
  };

  const groupedSchedules = DAYS.map((day) => ({
    day,
    classes: schedules.filter((s) => s.day === day),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading schedules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Manage weekly class schedules
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() =>
                setFormData({
                  day: "",
                  start_time: "",
                  end_time: "",
                  classroom_id: "",
                  professor_id: "",
                  subject: "",
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Class Schedule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={formData.day}
                  onValueChange={(value) =>
                    setFormData({ ...formData, day: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Classroom</Label>
                <Select
                  value={formData.classroom_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, classroom_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select classroom" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name} (Capacity: {classroom.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Professor</Label>
                <Select
                  value={formData.professor_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, professor_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map((professor) => (
                      <SelectItem key={professor.id} value={professor.id}>
                        {professor.name} - {professor.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject/Course</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Add Schedule
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {groupedSchedules.map(({ day, classes }) => (
          <div key={day}>
            <h2 className="text-xl font-bold mb-3">{day}</h2>
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Classroom</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No classes scheduled for {day}
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          {schedule.start_time} - {schedule.end_time}
                        </TableCell>
                        <TableCell>{schedule.subject}</TableCell>
                        <TableCell>{getClassroomName(schedule.classroom_id)}</TableCell>
                        <TableCell>{getProfessorName(schedule.professor_id)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
