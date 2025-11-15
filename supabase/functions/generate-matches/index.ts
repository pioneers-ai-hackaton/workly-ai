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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Extract user information from conversation
    const conversationSummary = messages
      .filter((m: Message) => m.role === 'user')
      .map((m: Message) => m.content)
      .join(' ');

    const systemPrompt = `Based on the user's profile from this conversation, generate 6 realistic job matches.
    Return ONLY a valid JSON array of companies with this exact structure:
    [
      {
        "name": "Company Name",
        "position": "Job Title",
        "location": "City, Country",
        "description": "Brief description of the role and why it matches (2-3 sentences)",
        "coordinates": [longitude, latitude]
      }
    ]
    
    IMPORTANT: Include realistic GPS coordinates for each location. For example:
    - San Francisco, USA: [-122.4194, 37.7749]
    - New York, USA: [-74.006, 40.7128]
    - London, UK: [-0.1276, 51.5074]
    - Paris, France: [2.3522, 48.8566]
    
    Make the matches relevant to their skills, experience, and location preferences.
    Use realistic company names, job titles, and accurate coordinates that match their profile.
    Do not include any markdown formatting or additional text.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User profile: ${conversationSummary}` }
        ],
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

      throw new Error('Failed to generate matches');
    }

    const data = await response.json();
    let companiesText = data.choices[0].message.content;
    
    // Clean up the response - remove markdown code blocks if present
    companiesText = companiesText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('AI Response:', companiesText);
    
    let companies;
    try {
      companies = JSON.parse(companiesText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', companiesText);
      
      // Fallback companies if parsing fails
      companies = [
        {
          name: "Tech Solutions Inc",
          position: "Software Developer",
          location: "San Francisco, USA",
          description: "Looking for talented developers to join our innovative team. Great benefits and growth opportunities.",
          coordinates: [-122.4194, 37.7749]
        },
        {
          name: "Digital Marketing Pro",
          position: "Marketing Specialist",
          location: "New York, USA",
          description: "Join our creative marketing team. Work on exciting campaigns for leading brands.",
          coordinates: [-74.006, 40.7128]
        },
        {
          name: "Finance Corp",
          position: "Financial Analyst",
          location: "London, UK",
          description: "Prestigious financial firm seeking analytical minds. Competitive compensation package.",
          coordinates: [-0.1276, 51.5074]
        }
      ];
    }

    return new Response(
      JSON.stringify({ companies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-matches function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
