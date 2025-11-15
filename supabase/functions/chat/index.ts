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
    const { messages, conversationComplete, currentStep = 1 } = await req.json();
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
    
    // Step is now passed from frontend - no need to infer it

    // Build personalized examples based on user's context
    const getPersonalizedExamples = (step: number) => {
      const isTech = extractedContext.techFields.length > 0;
      const isBusiness = extractedContext.businessFields.length > 0;
      
      switch (step) {
        case 2: // Experience
          if (isTech && extractedContext.techFields.includes('software development')) {
            return "What frameworks or languages have you worked with? (e.g., React, Python, Node.js) What types of projects have you built?";
          }
          if (isTech && extractedContext.techFields.includes('data science')) {
            return "What ML frameworks do you use? (e.g., TensorFlow, PyTorch, Scikit-learn) What data problems have you solved?";
          }
          if (isBusiness && extractedContext.businessFields.includes('marketing')) {
            return "What marketing channels are you experienced with? (e.g., SEO, paid ads, social media) What campaigns have you led?";
          }
          return "What specific skills and tools do you excel at? What are your key achievements?";
        
        case 3: // Preferences
          if (isTech && extractedContext.techFields.includes('software development')) {
            return "Are you interested in frontend, backend, or full-stack roles? Do you prefer startups or established companies?";
          }
          if (isTech && extractedContext.techFields.includes('data science')) {
            return "Are you looking for ML engineering, data analysis, or research roles? What type of data problems excite you?";
          }
          if (isBusiness && extractedContext.businessFields.includes('marketing')) {
            return "Do you prefer digital marketing, growth, or brand strategy? Agency or in-house?";
          }
          return "What's your ideal role? What type of company culture appeals to you?";
        
        case 4: // Location
          if (isTech) {
            return "Are you open to remote work? Tech hubs like SF, NYC, Austin? What's your salary range?";
          }
          return "Where do you want to work? Remote, hybrid, or in-office? What's your target salary?";
        
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
    - Be genuinely enthusiastic and supportive
    - Ask 1-2 focused questions at a time (not overwhelming!)
    - Personalize questions based on what they've told you
    - Use their specific context to give relevant examples
    - Celebrate their achievements when they share experience
    - Make them feel heard and understood
    
    ⚠️ CRITICAL: ONLY ask questions relevant to the CURRENT STEP. Do NOT ask about topics from other steps!
    
    STEP ${currentStep} GUIDANCE:
    
    ${currentStep === 1 ? `
    📚 BACKGROUND & EDUCATION (STEP 1)
    - ONLY ask about education: degrees, universities, field of study, graduation year
    - DO NOT ask about work experience, job preferences, location, or salary
    - If they mention a specific field, show interest and ask relevant follow-ups about their studies
    - Examples should feel natural, not templated
    - END WITH: STEP:1
    ` : ''}
    
    ${currentStep === 2 ? `
    💼 WORK EXPERIENCE (STEP 2)
    - ONLY ask about work experience: companies, roles, responsibilities, achievements, years of experience
    - DO NOT ask about education, job preferences, location, or salary
    - Acknowledge their education briefly, then focus on work experience
    - ${getPersonalizedExamples(2)}
    - Be specific to their field - ask about relevant tools, frameworks, or methodologies
    - Show genuine interest in their accomplishments
    - END WITH: STEP:2
    ` : ''}
    
    ${currentStep === 3 ? `
    🎯 JOB PREFERENCES (STEP 3)
    - ONLY ask about job preferences: ideal role, company type, team size, culture, growth opportunities
    - DO NOT ask about education, work experience, location, or salary
    - ${getPersonalizedExamples(3)}
    - Ask about company size, team dynamics, growth opportunities
    - Help them envision their ideal role
    - END WITH: STEP:3
    ` : ''}
    
    ${currentStep === 4 ? `
    📍 LOCATION & COMPENSATION (STEP 4)
    - ONLY ask about location and compensation: preferred cities, remote work, salary expectations, benefits
    - DO NOT ask about education, work experience, or job preferences
    - Almost there! Let's talk logistics
    - ${getPersonalizedExamples(4)}
    - Be realistic but encouraging about salary
    - Ask about work-life balance preferences
    - END WITH: STEP:4
    ` : ''}
    
    ${currentStep === 5 ? `
    ✅ FINAL DETAILS (STEP 5)
    - ONLY review and confirm: summarize their profile, ask start date, final confirmations
    - DO NOT ask new questions about education, experience, preferences, or location
    - Review what you've learned in a brief, positive way
    - Ask when they'd like to start
    - Confirm they're happy with everything discussed
    - Once confirmed, add: CONVERSATION_COMPLETE
    - END WITH: STEP:5
    ` : ''}
    
    CRITICAL RULES:
    - ALWAYS end with "STEP:X" marker
    - Keep responses conversational and encouraging (3-4 sentences max)
    - Personalize based on their field - NEVER give generic examples if you know their domain
    - Make them feel excited about their job search!`;

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
