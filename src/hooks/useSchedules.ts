import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClassSchedule {
  id: string;
  professor_id: string;
  classroom_id: string;
  subject: string;
  day: string;
  start_time: string;
  end_time: string;
  created_at?: string;
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();

    const channel = supabase
      .channel('schedules_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules' },
        () => fetchSchedules()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addSchedule = async (schedule: Omit<ClassSchedule, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .insert([schedule]);

      if (error) throw error;
      toast.success('Class scheduled successfully');
      return true;
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
      return false;
    }
  };

  const updateSchedule = async (id: string, schedule: Partial<ClassSchedule>) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update(schedule)
        .eq('id', id);

      if (error) throw error;
      toast.success('Schedule updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
      return false;
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Schedule deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
      return false;
    }
  };

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    refetch: fetchSchedules,
  };
}
