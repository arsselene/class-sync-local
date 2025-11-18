import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Classroom, ClassSchedule, Professor } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Send, Calendar, Clock, User, DoorOpen } from "lucide-react";
import { toast } from "sonner";

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
  const [classrooms] = useLocalStorage<Classroom[]>("classrooms", []);
  const [schedules] = useLocalStorage<ClassSchedule[]>("schedules", []);
  const [professors] = useLocalStorage<Professor[]>("professors", []);
  const [qrCodes, setQrCodes] = useState<EnrichedQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [professorFilter, setProfessorFilter] = useState<string>("all");
  const [classroomFilter, setClassroomFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchQRCodes();
    
    // Subscribe to real-time updates
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

      // Enrich QR codes with schedule, professor, and classroom data
      const enriched: EnrichedQRCode[] = (data || []).map((qr: QRCodeData) => {
        const schedule = schedules.find(s => s.id === qr.schedule_id);
        const professor = schedule ? professors.find(p => p.id === schedule.professorId) : undefined;
        const classroom = schedule ? classrooms.find(c => c.id === schedule.classroomId) : undefined;
        
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
      setLoading(false);
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
          startTime: qrCode.schedule.startTime,
          endTime: qrCode.schedule.endTime,
          day: qrCode.schedule.day,
        },
      });

      if (error) throw error;

      toast.success(`QR code sent to ${qrCode.professor.email}`);
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

  // Apply filters
  const filteredQRCodes = qrCodes.filter(qr => {
    if (professorFilter !== "all" && qr.professor?.id !== professorFilter) return false;
    if (classroomFilter !== "all" && qr.classroom?.id !== classroomFilter) return false;
    if (dateFilter !== "all" && qr.schedule?.day !== dateFilter) return false;
    if (statusFilter === "active" && (qr.used || isExpired(qr.expires_at))) return false;
    if (statusFilter === "used" && !qr.used) return false;
    if (statusFilter === "expired" && (!isExpired(qr.expires_at) || qr.used)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading QR codes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR Code Access Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage classroom access QR codes
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Professor</label>
              <Select value={professorFilter} onValueChange={setProfessorFilter}>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Classroom</label>
              <Select value={classroomFilter} onValueChange={setClassroomFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classrooms</SelectItem>
                  {classrooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Day</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredQRCodes.map((qr) => {
          const expired = isExpired(qr.expires_at);
          const status = qr.used ? 'used' : expired ? 'expired' : 'active';

          return (
            <Card key={qr.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">QR Code</CardTitle>
                  </div>
                  <Badge 
                    variant={status === 'active' ? 'default' : status === 'used' ? 'secondary' : 'destructive'}
                  >
                    {status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code Image */}
                <div className="flex justify-center p-4 bg-muted rounded-lg">
                  <img 
                    src={getQRCodeImageUrl(qr.qr_code_data)} 
                    alt="QR Code" 
                    className="w-48 h-48"
                  />
                </div>

                {/* Class Information */}
                {qr.schedule && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <DoorOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Subject: </span>
                        <span className="font-medium">{qr.schedule.subject}</span>
                      </div>
                    </div>

                    {qr.professor && (
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Professor: </span>
                          <span className="font-medium">{qr.professor.name}</span>
                        </div>
                      </div>
                    )}

                    {qr.classroom && (
                      <div className="flex items-start gap-2">
                        <DoorOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Classroom: </span>
                          <span className="font-medium">{qr.classroom.name}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Day: </span>
                        <span className="font-medium">{qr.schedule.day}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Time: </span>
                        <span className="font-medium">
                          {qr.schedule.startTime} - {qr.schedule.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expiry Info */}
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <div>Created: {new Date(qr.created_at).toLocaleString()}</div>
                  <div>Expires: {new Date(qr.expires_at).toLocaleString()}</div>
                </div>

                {/* Send Button */}
                {qr.professor && (
                  <Button 
                    onClick={() => sendQRCodeManually(qr)}
                    className="w-full"
                    variant={status === 'active' ? 'default' : 'outline'}
                    disabled={!qr.schedule || !qr.professor || !qr.classroom}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to {qr.professor.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredQRCodes.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {qrCodes.length === 0 
              ? "No QR codes generated yet. QR codes will be automatically generated 10 minutes before each class."
              : "No QR codes match the selected filters."
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
}
