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
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Classroom, Professor, ClassSchedule } from "@/types";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule() {
  const [schedules, setSchedules] = useLocalStorage<ClassSchedule[]>("schedules", []);
  const [classrooms] = useLocalStorage<Classroom[]>("classrooms", []);
  const [professors] = useLocalStorage<Professor[]>("professors", []);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    day: "",
    startTime: "",
    endTime: "",
    classroomId: "",
    professorId: "",
    subject: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.day ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.classroomId ||
      !formData.professorId ||
      !formData.subject
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    const newSchedule: ClassSchedule = {
      id: Date.now().toString(),
      ...formData,
    };

    setSchedules([...schedules, newSchedule]);
    toast.success("Class scheduled successfully");
    setFormData({
      day: "",
      startTime: "",
      endTime: "",
      classroomId: "",
      professorId: "",
      subject: "",
    });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id));
    toast.success("Schedule deleted successfully");
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
                  startTime: "",
                  endTime: "",
                  classroomId: "",
                  professorId: "",
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
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Classroom</Label>
                <Select
                  value={formData.classroomId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, classroomId: value })
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
                  value={formData.professorId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, professorId: value })
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
                          {schedule.startTime} - {schedule.endTime}
                        </TableCell>
                        <TableCell>{schedule.subject}</TableCell>
                        <TableCell>{getClassroomName(schedule.classroomId)}</TableCell>
                        <TableCell>{getProfessorName(schedule.professorId)}</TableCell>
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
