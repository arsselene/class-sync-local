-- Create table for QR codes
CREATE TABLE public.class_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  qr_code_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false
);

-- Create table for door access logs
CREATE TABLE public.door_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id TEXT NOT NULL,
  professor_id TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  access_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  qr_code_id UUID REFERENCES public.class_qr_codes(id)
);

-- Enable Row Level Security
ALTER TABLE public.class_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.door_access_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (no auth required)
CREATE POLICY "Allow public read access to QR codes" 
ON public.class_qr_codes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to QR codes" 
ON public.class_qr_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to QR codes" 
ON public.class_qr_codes 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public read access to door logs" 
ON public.door_access_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to door logs" 
ON public.door_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_class_qr_codes_schedule ON public.class_qr_codes(schedule_id);
CREATE INDEX idx_door_access_logs_classroom ON public.door_access_logs(classroom_id);
CREATE INDEX idx_door_access_logs_schedule ON public.door_access_logs(schedule_id);