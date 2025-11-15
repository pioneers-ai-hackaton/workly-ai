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
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    // Analyze conversation to extract context and determine step
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const allMessages = messages.map((m: Message) => m.content).join(' ').toLowerCase();
    
    // Extract user's field/domain for personalization
    const extractedContext: Record<string, string[]> = {
      techFields: [],
      businessFields: [],
      skills: [],
      industries: []
    };
    
    // Tech-related keywords
    if (allMessages.match(/\b(computer science|cs|software|programming|coding|developer|engineer)\b/)) {
      extractedContext.techFields.push('software development');
    }
    if (allMessages.match(/\b(data science|machine learning|ml|ai|analytics)\b/)) {
      extractedContext.techFields.push('data science');
    }
    if (allMessages.match(/\b(design|ui|ux|figma|sketch)\b/)) {
      extractedContext.techFields.push('design');
    }
    
    // Business-related keywords
    if (allMessages.match(/\b(marketing|seo|social media|advertising)\b/)) {
      extractedContext.businessFields.push('marketing');
    }
    if (allMessages.match(/\b(finance|accounting|investment|banking)\b/)) {
      extractedContext.businessFields.push('finance');
    }
    if (allMessages.match(/\b(sales|business development|account)\b/)) {
      extractedContext.businessFields.push('sales');
    }
    
    // Determine current step by looking at the last assistant message's step marker
    let currentStep = 1;
    
    // Find the last step marker from assistant messages
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        const stepMatch = messages[i].content.match(/STEP:(\d)/);
        if (stepMatch) {
          currentStep = Math.min(parseInt(stepMatch[1]) + 1, 5); // Move to next step
          break;
        }
      }
    }
    
    // If this is the very first message, start at step 1
    if (messages.length === 1) {
      currentStep = 1;
    }

    // Simplified questioning - get key info quickly
    const getQuestionGuidance = (step: number) => {
      const isTech = extractedContext.techFields.length > 0;
      
      switch (step) {
        case 1: // Education
          return `Ask about education background briefly:
          - Degree/major and university?
          - Any standout coursework or projects?
          Move to next step after 1-2 exchanges.`;
        
        case 2: // Experience
          return `Get work experience overview:
          - What have you built or worked on?
          - Key technologies/tools used?
          - Notable achievements?
          Move to next step after 1-2 exchanges.`;
        
        case 3: // Skills
          return `Quick skills rundown:
          ${isTech ? '- Main programming languages/frameworks?' : '- Core skills and tools?'}
          - What are you best at?
          Move to next step after 1 exchange.`;
        
        case 4: // Preferences
          return `Get job preferences:
          - What kind of role/position?
          - Industry or company type preference?
          Move to next step after 1 exchange.`;
        
        case 5: // Location & Logistics
          return `Final logistics:
          - Location preferences?
          - Salary expectations?
          Once answered, say "Perfect! I have everything I need to find your ideal job matches!" then add CONVERSATION_COMPLETE`;
        
        default:
          return "";
      }
    };

    // System prompt for the job-finding assistant
    const systemPrompt = conversationComplete
      ? `You are an enthusiastic job-finding assistant. The user has shared all their information! 
         Give them an exciting, brief summary of what you've learned about them.
         Tell them you're generating personalized job matches right now and they'll see them on the map in a moment.
         Be warm and encouraging - make them feel confident about their job search!`
      : `You are a warm, supportive career coach helping someone find their dream job. You're excited to get to know them!
    
    CURRENT STEP: ${currentStep} of 5
    
    ${extractedContext.techFields.length > 0 ? `USER CONTEXT: Tech field - ${extractedContext.techFields.join(', ')}` : ''}
    ${extractedContext.businessFields.length > 0 ? `USER CONTEXT: Business field - ${extractedContext.businessFields.join(', ')}` : ''}
    
    YOUR CONVERSATION STYLE:
    - Be warm and encouraging but EFFICIENT
    - Keep questions SHORT and get to the point
    - Don't ask too many follow-ups - get core info and move on
    - Each step should take 1-2 exchanges maximum
    - NO STEP NUMBERS in your responses - they're added automatically
    
    QUESTIONING STRATEGY:
    ${getQuestionGuidance(currentStep)}
    
    STEP ${currentStep} GUIDANCE:
    
    ${currentStep === 1 ? `
    📚 EDUCATION
    - Ask about their degree/major and university
    - ONE follow-up if needed, then move to STEP:2
    - Keep it brief and conversational
    - DO NOT include "STEP:1" in your message text
    ` : ''}
    
    ${currentStep === 2 ? `
    💼 EXPERIENCE
    - Acknowledge their background briefly
    - Ask what they've built/worked on and key technologies
    - After 1-2 exchanges, move to STEP:3
    - DO NOT include "STEP:2" in your message text
    ` : ''}
    
    ${currentStep === 3 ? `
    🔧 SKILLS
    - Quick rundown of their main skills
    - After 1 exchange, move to STEP:4
    - DO NOT include "STEP:3" in your message text
    ` : ''}
    
    ${currentStep === 4 ? `
    🎯 PREFERENCES
    - Ask what kind of role they want
    - After 1 exchange, move to STEP:5
    - DO NOT include "STEP:4" in your message text
    ` : ''}
    
    ${currentStep === 5 ? `
    📍 LOCATION & SALARY
    - Quick question: where and salary expectations?
    - After answer, say "Perfect! I have everything to find your ideal matches!"
    - Then add CONVERSATION_COMPLETE on new line
    - DO NOT include "STEP:5" in your message text
    ` : ''}
    
    CRITICAL RULES:
    - ALWAYS end your system processing with "STEP:X" marker (this is INTERNAL, not shown to user)
    - NEVER include "STEP:X" in the actual message text the user sees
    - Keep questions SHORT - 1-2 sentences maximum
    - Move through steps quickly - don't over-question
    - Be efficient and friendly!`;

    // Convert messages to Gemini format
    const contents = messages.map((msg: Message) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    // Prepend system prompt as first user message
    contents.unshift({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
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

      throw new Error('Failed to get response from AI');
    }

    const data = await response.json();
    const assistantMessage = data.candidates[0].content.parts[0].text;
    
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
