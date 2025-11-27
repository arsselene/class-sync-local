-- Enable realtime for professors table
ALTER PUBLICATION supabase_realtime ADD TABLE public.professors;

-- Enable realtime for classrooms table
ALTER PUBLICATION supabase_realtime ADD TABLE public.classrooms;

-- Enable realtime for schedules table
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;