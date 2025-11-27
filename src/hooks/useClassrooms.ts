import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  created_at?: string;
}

export function useClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClassrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClassrooms(data || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();

    const channel = supabase
      .channel('classrooms_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classrooms' },
        () => fetchClassrooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addClassroom = async (classroom: Omit<Classroom, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .insert([classroom]);

      if (error) throw error;
      toast.success('Classroom added successfully');
      return true;
    } catch (error) {
      console.error('Error adding classroom:', error);
      toast.error('Failed to add classroom');
      return false;
    }
  };

  const updateClassroom = async (id: string, classroom: Partial<Classroom>) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .update(classroom)
        .eq('id', id);

      if (error) throw error;
      toast.success('Classroom updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating classroom:', error);
      toast.error('Failed to update classroom');
      return false;
    }
  };

  const deleteClassroom = async (id: string) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Classroom deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting classroom:', error);
      toast.error('Failed to delete classroom');
      return false;
    }
  };

  return {
    classrooms,
    loading,
    addClassroom,
    updateClassroom,
    deleteClassroom,
    refetch: fetchClassrooms,
  };
}
