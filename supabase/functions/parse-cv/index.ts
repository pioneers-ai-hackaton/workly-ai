import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cvText } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const systemPrompt = `Extract CV information from the provided text and return ONLY a valid JSON object with this exact structure:
    {
      "name": "Full Name",
      "email": "email@example.com",
      "phone": "+1234567890",
      "location": "City, Country",
      "summary": "Professional summary paragraph (2-3 sentences)",
      "education": [
        {
          "degree": "Degree Name",
          "institution": "University/School Name",
          "year": "2020"
        }
      ],
      "experience": [
        {
          "title": "Job Title",
          "company": "Company Name",
          "period": "2020-2023",
          "description": "Brief description of role and achievements"
        }
      ],
      "skills": ["Skill 1", "Skill 2", "Skill 3"]
    }
    
    Extract all available information from the CV text.
    Do not include any markdown formatting or additional text.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'user',
            parts: [{ text: `CV Text:\n${cvText}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service limit reached. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Failed to parse CV');
    }

    const data = await response.json();
    let cvDataText = data.candidates[0].content.parts[0].text;
    
    cvDataText = cvDataText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Parsed CV:', cvDataText);
    
    let cv;
    try {
      cv = JSON.parse(cvDataText);
    } catch (parseError) {
      console.error('Failed to parse CV response:', parseError);
      
      // Fallback CV
      cv = {
        name: "Professional Candidate",
        email: "candidate@example.com",
        phone: "+1234567890",
        location: "Global",
        summary: "Experienced professional seeking new opportunities",
        education: [
          {
            degree: "Bachelor's Degree",
            institution: "University",
            year: "2020"
          }
        ],
        experience: [
          {
            title: "Professional",
            company: "Company",
            period: "2020-2024",
            description: "Various professional responsibilities"
          }
        ],
        skills: ["Communication", "Problem Solving", "Teamwork"]
      };
    }

    return new Response(
      JSON.stringify({ cv }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing CV:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
