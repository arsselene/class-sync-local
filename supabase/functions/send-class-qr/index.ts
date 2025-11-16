import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Resend API helper
async function sendEmail(apiKey: string, emailData: any) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(emailData),
  });
  
  if (!response.ok) {
    throw new Error(`Email sending failed: ${await response.text()}`);
  }
  
  return await response.json();
}

const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QRRequest {
  scheduleId: string;
  professorEmail: string;
  professorName: string;
  subject: string;
  classroom: string;
  startTime: string;
  endTime: string;
  day: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { scheduleId, professorEmail, professorName, subject, classroom, startTime, endTime, day }: QRRequest = await req.json();

    console.log("Processing QR code for schedule:", scheduleId);

    // Generate QR code data (unique identifier for this class session)
    const qrCodeData = `CLASS:${scheduleId}:${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // QR code valid for 1 hour

    // Store QR code in database
    const { data: qrCode, error: qrError } = await supabase
      .from("class_qr_codes")
      .insert({
        schedule_id: scheduleId,
        qr_code_data: qrCodeData,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (qrError) {
      console.error("Error storing QR code:", qrError);
      throw new Error("Failed to generate QR code");
    }

    console.log("QR code stored:", qrCode.id);

    // Generate QR code URL (using a free QR code API)
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`;

    // Send email to professor
    const emailResponse = await sendEmail(resendApiKey, {
      from: "Smart Class Management <onboarding@resend.dev>",
      to: [professorEmail],
      subject: `Class Access QR Code - ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0ea5e9;">Your Class Access QR Code</h1>
          
          <p>Hello ${professorName},</p>
          
          <p>Your class is starting soon! Here are the details:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Classroom:</strong> ${classroom}</p>
            <p><strong>Day:</strong> ${day}</p>
            <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          </div>
          
          <p>Use this QR code to access the classroom:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <img src="${qrCodeImageUrl}" alt="Class Access QR Code" style="max-width: 300px; border: 2px solid #0ea5e9; border-radius: 8px;"/>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Note:</strong> This QR code is valid for 1 hour and is for single use only.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
          
          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated message from Smart Class Management System.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        qrCodeId: qrCode.id,
        message: "QR code generated and sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-class-qr function:", error);
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
