import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GROQ_API_KEY } from "../config/keys.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Hospital {
  id: string;
  name: string;
  distance: number;
  address: string;
  equipment?: string[];
  specialties?: string[];
}

interface PatientData {
  vitals: {
    spo2: number;
    heartRate: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
    temperature: number;
    gcs: number;
  };
  triageLevel: string;
  complaint: string;
  requiredEquipment?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientData, hospitalList } = await req.json() as {
      patientData: PatientData;
      hospitalList: Hospital[];
    };

    console.log('Received recommendation request for patient with triage:', patientData.triageLevel);

    // Try to get API key from env first, then fall back to config import
    const apiKey = Deno.env.get('GROQ_API_KEY') || GROQ_API_KEY;

    if (!apiKey || apiKey === "your_groq_api_key_here") {
      console.log('No valid Groq API key found, returning fallback signal');
      return new Response(JSON.stringify({ useFallback: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build prompt for Groq
    const prompt = `You are a medical AI assistant helping to recommend the best hospital for an emergency patient.

Patient Information:
- Triage Level: ${patientData.triageLevel}
- Chief Complaint: ${patientData.complaint}
- Vitals:
  * SpO2: ${patientData.vitals.spo2}%
  * Heart Rate: ${patientData.vitals.heartRate} bpm
  * Blood Pressure: ${patientData.vitals.bloodPressureSys}/${patientData.vitals.bloodPressureDia} mmHg
  * Temperature: ${patientData.vitals.temperature}°C
  * GCS: ${patientData.vitals.gcs}
- Required Equipment: ${patientData.requiredEquipment?.join(', ') || 'None specified'}

Available Hospitals:
${hospitalList.map((h, idx) => `
${idx + 1}. ${h.name}
   - Distance: ${h.distance} km
   - Address: ${h.address}
   - Equipment: ${h.equipment?.join(', ') || 'Not specified'}
   - Specialties: ${h.specialties?.join(', ') || 'Not specified'}
`).join('\n')}

Task: Analyze the patient's condition and recommend the TOP 3 hospitals in ranked order. For each hospital provide:
1. Hospital name (exactly as listed above)
2. Confidence score (0-100)
3. Brief reasoning (max 50 words)

Consider: urgency based on triage level, required equipment availability, relevant specialties, and reasonable distance.

Respond ONLY with valid JSON in this exact format:
{
  "recommendations": [
    {
      "hospitalName": "Hospital Name",
      "confidence": 95,
      "reasoning": "Brief explanation"
    }
  ],
  "aiMode": true
}`;

    console.log('Calling Groq API...');
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a medical AI assistant. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      return new Response(JSON.stringify({ useFallback: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groqData = await groqResponse.json();
    const aiResponse = groqData.choices[0].message.content;
    
    console.log('Groq AI response received:', aiResponse);

    // Parse AI response
    const parsedResponse = JSON.parse(aiResponse);
    
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in recommend-hospital function:', error);
    return new Response(JSON.stringify({ useFallback: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
