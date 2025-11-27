-- Create professors table
CREATE TABLE public.professors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedules table
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies for professors
CREATE POLICY "Allow public read access to professors" 
ON public.professors FOR SELECT USING (true);

CREATE POLICY "Allow public insert to professors" 
ON public.professors FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to professors" 
ON public.professors FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to professors" 
ON public.professors FOR DELETE USING (true);

-- Create public read/write policies for classrooms
CREATE POLICY "Allow public read access to classrooms" 
ON public.classrooms FOR SELECT USING (true);

CREATE POLICY "Allow public insert to classrooms" 
ON public.classrooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to classrooms" 
ON public.classrooms FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to classrooms" 
ON public.classrooms FOR DELETE USING (true);

-- Create public read/write policies for schedules
CREATE POLICY "Allow public read access to schedules" 
ON public.schedules FOR SELECT USING (true);

CREATE POLICY "Allow public insert to schedules" 
ON public.schedules FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to schedules" 
ON public.schedules FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to schedules" 
ON public.schedules FOR DELETE USING (true);