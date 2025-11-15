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

    // Determine current step from conversation history
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const allMessages = messages.map((m: Message) => m.content).join(' ');
    
    let currentStep = 1;
    const hasEducation = allMessages.toLowerCase().includes('degree') || 
                        allMessages.toLowerCase().includes('university') || 
                        allMessages.toLowerCase().includes('college') ||
                        allMessages.toLowerCase().includes('study') ||
                        allMessages.toLowerCase().includes('graduated');
    const hasExperience = allMessages.toLowerCase().includes('work') || 
                         allMessages.toLowerCase().includes('experience') || 
                         allMessages.toLowerCase().includes('job') ||
                         allMessages.toLowerCase().includes('company') ||
                         allMessages.toLowerCase().includes('position');
    const hasPreferences = allMessages.toLowerCase().includes('looking for') || 
                          allMessages.toLowerCase().includes('prefer') || 
                          allMessages.toLowerCase().includes('interested in');
    const hasLocation = allMessages.toLowerCase().includes('location') || 
                       allMessages.toLowerCase().includes('city') || 
                       allMessages.toLowerCase().includes('remote') ||
                       allMessages.toLowerCase().includes('salary') ||
                       allMessages.toLowerCase().includes('compensation');
    
    if (hasEducation && !hasExperience) currentStep = 2;
    else if (hasExperience && !hasPreferences) currentStep = 3;
    else if (hasPreferences && !hasLocation) currentStep = 4;
    else if (hasLocation) currentStep = 5;

    // System prompt for the job-finding assistant
    const systemPrompt = conversationComplete
      ? `You are a helpful job-finding assistant. The user has provided all their information. 
         Summarize what you've learned and let them know you'll now generate job matches for them.
         Be encouraging and professional.`
      : `You are a friendly, supportive job search assistant helping users find their perfect job.
    
    You are currently on STEP ${currentStep} of 5. Follow this progression strictly:
    
    STEP 1 - Background & Education:
    - Ask about their educational background (degrees, majors, certifications)
    - Suggest examples: "For example: Bachelor's in Computer Science, MBA, Self-taught developer"
    - Ask about graduation year and institution if relevant
    - ALWAYS end with: STEP:1
    
    STEP 2 - Work Experience:
    - Ask about previous roles and companies
    - Inquire about key skills and achievements
    - Suggest examples: "For instance: Software Engineer at Google for 3 years, Startup founder, Career changer from marketing"
    - ALWAYS end with: STEP:2
    
    STEP 3 - Job Preferences:
    - Ask what type of role/position they're seeking
    - Inquire about industry preferences
    - Suggest examples: "Such as: Senior developer role, Product management, Remote-first startup"
    - ALWAYS end with: STEP:3
    
    STEP 4 - Location & Compensation:
    - Ask about location preferences (city, remote, hybrid)
    - Inquire about salary expectations or range
    - Suggest examples: "Like: San Francisco Bay Area, Fully remote, $120k-150k range"
    - ALWAYS end with: STEP:4
    
    STEP 5 - Final Details:
    - Gather contact information (email, phone)
    - Ask about start date availability
    - Confirm all previous information is correct
    - Once satisfied, add: CONVERSATION_COMPLETE
    - ALWAYS end with: STEP:5
    
    CRITICAL RULES:
    - ALWAYS include "STEP:X" at the very end of every response
    - Ask 2-3 specific questions per step
    - Always provide 2-3 concrete examples or suggestions
    - Keep tone encouraging and conversational
    - Never skip steps - complete each one fully before moving to the next
    - If user provides info for the current step, acknowledge it then move to next step`;

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
    
    // Check if conversation is complete and extract step
    const ready = assistantMessage.includes('CONVERSATION_COMPLETE');
    const stepMatch = assistantMessage.match(/STEP:(\d)/);
    const step = stepMatch ? parseInt(stepMatch[1]) : 1;
    
    // Clean message
    const cleanedMessage = assistantMessage
      .replace('CONVERSATION_COMPLETE', '')
      .replace(/STEP:\d/g, '')
      .trim();

    return new Response(
      JSON.stringify({ 
        message: cleanedMessage,
        ready,
        step
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
