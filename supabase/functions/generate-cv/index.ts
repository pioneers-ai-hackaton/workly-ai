import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const conversationSummary = messages
      .filter((m: Message) => m.role === 'user')
      .map((m: Message) => m.content)
      .join(' ');

    const systemPrompt = `Based on the user's conversation, generate a professional CV/resume.
    Return ONLY a valid JSON object with this exact structure:
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
    
    Extract information from the conversation and create a professional CV.
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
            parts: [{ text: `Generate CV from: ${conversationSummary}` }]
          }
        ],
        generationConfig: {
          temperature: 1,
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

      throw new Error('Failed to generate CV');
    }

    const data = await response.json();
    let cvText = data.candidates[0].content.parts[0].text;
    
    cvText = cvText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('CV Response:', cvText);
    
    let cv;
    try {
      cv = JSON.parse(cvText);
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
            company: "Previous Company",
            period: "2020-Present",
            description: "Demonstrated expertise in various professional capacities"
          }
        ],
        skills: ["Communication", "Problem Solving", "Team Collaboration"]
      };
    }

    return new Response(
      JSON.stringify({ cv }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-cv function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
