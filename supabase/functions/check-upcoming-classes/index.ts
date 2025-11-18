import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Checking for upcoming classes...");

    // Get current time and day
    const now = new Date();
    const currentDay = DAYS[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Calculate time 10 minutes from now
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
    const targetTime = tenMinutesLater.toTimeString().slice(0, 5);

    console.log(`Current day: ${currentDay}, Current time: ${currentTime}, Target time: ${targetTime}`);

    // This function is meant to be called from the frontend with schedule data
    // since we're using localStorage for schedules
    const { schedules } = await req.json();

    if (!schedules || !Array.isArray(schedules)) {
      return new Response(
        JSON.stringify({ message: "No schedules provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Find classes starting in 10 minutes
    const upcomingClasses = schedules.filter((schedule: any) => {
      return schedule.day === currentDay && 
             schedule.startTime >= currentTime && 
             schedule.startTime <= targetTime;
    });

    console.log(`Found ${upcomingClasses.length} upcoming classes`);

    // Trigger QR code generation for each upcoming class
    const results = await Promise.all(
      upcomingClasses.map(async (schedule: any) => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-class-qr`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify(schedule),
          });

          const result = await response.json();
          console.log(`QR code sent for schedule ${schedule.scheduleId}:`, result);
          return { scheduleId: schedule.scheduleId, success: true };
        } catch (error) {
          console.error(`Error sending QR for schedule ${schedule.scheduleId}:`, error);
          return { 
            scheduleId: schedule.scheduleId, 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ 
        message: `Processed ${upcomingClasses.length} upcoming classes`,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-upcoming-classes function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
