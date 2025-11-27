import { useEffect, useState } from "react";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useSchedules, ClassSchedule } from "@/hooks/useSchedules";
import { useProfessors, Professor } from "@/hooks/useProfessors";
import { Classroom } from "@/hooks/useClassrooms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Send, Calendar, Clock, User, DoorOpen, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface QRCodeData {
  id: string;
  schedule_id: string;
  qr_code_data: string;
  created_at: string;
  expires_at: string;
  used: boolean;
}

interface EnrichedQRCode extends QRCodeData {
  schedule?: ClassSchedule;
  professor?: Professor;
  classroom?: Classroom;
}

export default function Access() {
  const { classrooms, loading: classroomsLoading } = useClassrooms();
  const { schedules, loading: schedulesLoading } = useSchedules();
  const { professors, loading: professorsLoading } = useProfessors();
  const [qrCodes, setQrCodes] = useState<EnrichedQRCode[]>([]);
  const [qrLoading, setQrLoading] = useState(true);
  
  // Global Filters
  const [globalProfessorFilter, setGlobalProfessorFilter] = useState<string>("all");
  const [globalClassroomFilter, setGlobalClassroomFilter] = useState<string>("all");
  const [globalDateFilter, setGlobalDateFilter] = useState<Date | undefined>(undefined);
  const [globalDayFilter, setGlobalDayFilter] = useState<string>("all");
  
  // QR Code specific filters
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loading = classroomsLoading || schedulesLoading || professorsLoading;

  useEffect(() => {
    if (!loading) {
      fetchQRCodes();
    }
  }, [loading, schedules, professors, classrooms]);

  useEffect(() => {
    const channel = supabase
      .channel('qr_codes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_qr_codes'
        },
        () => {
          fetchQRCodes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schedules, professors, classrooms]);

  const fetchQRCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('class_qr_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched: EnrichedQRCode[] = (data || []).map((qr: QRCodeData) => {
        const schedule = schedules.find(s => s.id === qr.schedule_id);
        const professor = schedule ? professors.find(p => p.id === schedule.professor_id) : undefined;
        const classroom = schedule ? classrooms.find(c => c.id === schedule.classroom_id) : undefined;
        
        return {
          ...qr,
          schedule,
          professor,
          classroom
        };
      });

      setQrCodes(enriched);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast.error('Failed to load QR codes');
    } finally {
      setQrLoading(false);
    }
  };

  const sendQRCodeManually = async (qrCode: EnrichedQRCode) => {
    if (!qrCode.schedule || !qrCode.professor || !qrCode.classroom) {
      toast.error('Missing schedule information');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-class-qr', {
        body: {
          scheduleId: qrCode.schedule.id,
          professorEmail: qrCode.professor.email,
          professorName: qrCode.professor.name,
          subject: qrCode.schedule.subject,
          classroom: qrCode.classroom.name,
          startTime: qrCode.schedule.start_time,
          endTime: qrCode.schedule.end_time,
          day: qrCode.schedule.day,
        },
      });

      if (error) throw error;

      toast.success('QR code sent successfully!');
    } catch (error) {
      console.error('Error sending QR code:', error);
      toast.error('Failed to send QR code');
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getQRCodeImageUrl = (qrCodeData: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
  };

  const getProfessorName = (profId: string) => {
    return professors.find(p => p.id === profId)?.name || "Unknown";
  };

  const getClassroomName = (classId: string) => {
    return classrooms.find(c => c.id === classId)?.name || "Unknown";
  };

  // Global filtered data
  const filteredProfessors = professors.filter(prof => {
    if (globalProfessorFilter !== "all" && prof.id !== globalProfessorFilter) return false;
    return true;
  });

  const filteredClassrooms = classrooms.filter(classroom => {
    if (globalClassroomFilter !== "all" && classroom.id !== globalClassroomFilter) return false;
    return true;
  });

  const filteredSchedules = schedules.filter(schedule => {
    if (globalProfessorFilter !== "all" && schedule.professor_id !== globalProfessorFilter) return false;
    if (globalClassroomFilter !== "all" && schedule.classroom_id !== globalClassroomFilter) return false;
    if (globalDayFilter !== "all" && schedule.day !== globalDayFilter) return false;
    if (globalDateFilter) {
      const selectedDay = DAYS[globalDateFilter.getDay()];
      if (schedule.day !== selectedDay) return false;
    }
    return true;
  });

  const filteredQRCodes = qrCodes.filter((qr) => {
    if (statusFilter === "active" && (qr.used || new Date(qr.expires_at) < new Date())) return false;
    if (statusFilter === "expired" && new Date(qr.expires_at) >= new Date()) return false;
    if (statusFilter === "used" && !qr.used) return false;
    return true;
  });

  if (loading || qrLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Access Control</h1>
        <p className="text-muted-foreground mt-1">
          View and manage classroom access with global filters
        </p>
      </div>

      {/* Global Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Global Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Professor</label>
              <Select value={globalProfessorFilter} onValueChange={setGlobalProfessorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Professors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Professors</SelectItem>
                  {professors.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Classroom</label>
              <Select value={globalClassroomFilter} onValueChange={setGlobalClassroomFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classrooms</SelectItem>
                  {classrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Day of Week</label>
              <Select value={globalDayFilter} onValueChange={setGlobalDayFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !globalDateFilter && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {globalDateFilter ? format(globalDateFilter, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={globalDateFilter}
                    onSelect={setGlobalDateFilter}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {(globalProfessorFilter !== "all" || globalClassroomFilter !== "all" || globalDateFilter || globalDayFilter !== "all") && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setGlobalProfessorFilter("all");
                  setGlobalClassroomFilter("all");
                  setGlobalDateFilter(undefined);
                  setGlobalDayFilter("all");
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtered Results */}
      {(globalProfessorFilter !== "all" || globalClassroomFilter !== "all" || globalDateFilter || globalDayFilter !== "all") && (
        <Card>
          <CardHeader>
            <CardTitle>Filtered Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Professors Section */}
            {filteredProfessors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Professors ({filteredProfessors.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Classes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfessors.map((prof) => {
                      const profSchedules = filteredSchedules.filter(s => s.professor_id === prof.id);
                      return (
                        <TableRow key={prof.id}>
                          <TableCell className="font-medium">{prof.name}</TableCell>
                          <TableCell>{prof.email}</TableCell>
                          <TableCell>{prof.department}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{profSchedules.length} classes</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Classrooms Section */}
            {filteredClassrooms.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DoorOpen className="h-5 w-5" />
                  Classrooms ({filteredClassrooms.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Classes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClassrooms.map((classroom) => {
                      const classSchedules = filteredSchedules.filter(s => s.classroom_id === classroom.id);
                      return (
                        <TableRow key={classroom.id}>
                          <TableCell className="font-medium">{classroom.name}</TableCell>
                          <TableCell>{classroom.capacity}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{classSchedules.length} classes</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Schedules Section */}
            {filteredSchedules.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Class Schedules ({filteredSchedules.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Professor</TableHead>
                      <TableHead>Classroom</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <Badge>{schedule.day}</Badge>
                        </TableCell>
                        <TableCell>{schedule.start_time} - {schedule.end_time}</TableCell>
                        <TableCell className="font-medium">{schedule.subject}</TableCell>
                        <TableCell>{getProfessorName(schedule.professor_id)}</TableCell>
                        <TableCell>{getClassroomName(schedule.classroom_id)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Codes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generated QR Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Status Filter</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredQRCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No QR codes found matching the filters
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredQRCodes.map((qr) => (
                <Card key={qr.id} className={cn(
                  "relative",
                  qr.used && "opacity-60",
                  isExpired(qr.expires_at) && !qr.used && "border-destructive"
                )}>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center space-y-3">
                      <img
                        src={getQRCodeImageUrl(qr.qr_code_data)}
                        alt="QR Code"
                        className="w-48 h-48 object-contain"
                      />
                      
                      <div className="w-full space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{qr.professor?.name || 'Unknown Professor'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{qr.classroom?.name || 'Unknown Classroom'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{qr.schedule?.day || 'Unknown Day'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {qr.schedule?.start_time} - {qr.schedule?.end_time}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Subject: {qr.schedule?.subject || 'Unknown'}
                        </div>
                      </div>

                      <div className="flex gap-2 w-full">
                        <Badge variant={qr.used ? "secondary" : isExpired(qr.expires_at) ? "destructive" : "default"}>
                          {qr.used ? "Used" : isExpired(qr.expires_at) ? "Expired" : "Active"}
                        </Badge>
                      </div>

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => sendQRCodeManually(qr)}
                        disabled={qr.used || isExpired(qr.expires_at)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to Professor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
