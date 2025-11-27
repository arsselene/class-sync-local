import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Professor {
  id: string;
  name: string;
  email: string;
  department: string;
  created_at?: string;
}

export function useProfessors() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfessors = async () => {
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfessors(data || []);
    } catch (error) {
      console.error('Error fetching professors:', error);
      toast.error('Failed to load professors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();

    const channel = supabase
      .channel('professors_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'professors' },
        () => fetchProfessors()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addProfessor = async (professor: Omit<Professor, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('professors')
        .insert([professor]);

      if (error) throw error;
      toast.success('Professor added successfully');
      return true;
    } catch (error) {
      console.error('Error adding professor:', error);
      toast.error('Failed to add professor');
      return false;
    }
  };

  const updateProfessor = async (id: string, professor: Partial<Professor>) => {
    try {
      const { error } = await supabase
        .from('professors')
        .update(professor)
        .eq('id', id);

      if (error) throw error;
      toast.success('Professor updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating professor:', error);
      toast.error('Failed to update professor');
      return false;
    }
  };

  const deleteProfessor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('professors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Professor deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting professor:', error);
      toast.error('Failed to delete professor');
      return false;
    }
  };

  return {
    professors,
    loading,
    addProfessor,
    updateProfessor,
    deleteProfessor,
    refetch: fetchProfessors,
  };
}
