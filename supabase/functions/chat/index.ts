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
    const { messages, conversationComplete } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // System prompt for the job-finding assistant
    const systemPrompt = conversationComplete
      ? `You are a helpful job-finding assistant. The user has provided all their information. 
         Summarize what you've learned and let them know you'll now generate job matches for them.
         Be encouraging and professional.`
      : `You are a helpful job-finding assistant. Your goal is to gather information about the user's:
         1. Education and qualifications
         2. Work experience and skills
         3. Desired job type and industry
         4. Preferred work location (city, country, or region)
         5. Any specific requirements (salary expectations, work environment, etc.)
         
         Ask questions naturally and conversationally. Once you have enough information to create a comprehensive profile, 
         end your message with "[READY]" to signal the conversation is complete.
         Be friendly, professional, and encouraging.`;

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
          ...messages
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

      throw new Error('Failed to get response from AI');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    
    // Check if the assistant thinks we're ready to generate matches
    const ready = assistantMessage.includes('[READY]');
    const cleanedMessage = assistantMessage.replace('[READY]', '').trim();

    return new Response(
      JSON.stringify({ 
        message: cleanedMessage,
        ready 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
