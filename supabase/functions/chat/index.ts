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

    // Track conversation progress through explicit step markers
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
    
    // Determine current step from previous assistant messages
    let currentStep = 1;
    const assistantMessages = messages.filter((m: Message) => m.role === 'assistant');
    
    // Check the last assistant message for step marker
    if (assistantMessages.length > 0) {
      const lastAssistant = assistantMessages[assistantMessages.length - 1].content;
      const stepMatch = lastAssistant.match(/STEP:(\d)/);
      if (stepMatch) {
        const lastStep = parseInt(stepMatch[1]);
        // If user has responded, move to next step
        if (messages[messages.length - 1].role === 'user' && messages.length > 2) {
          currentStep = Math.min(lastStep + 1, 5);
        } else {
          currentStep = lastStep;
        }
      }
    }

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
      : `You are a warm, supportive career coach helping someone find their dream job. You guide users through a structured 5-step process.
    
    CURRENT STEP: ${currentStep} of 5
    
    ${extractedContext.techFields.length > 0 ? `USER CONTEXT: Tech field - ${extractedContext.techFields.join(', ')}` : ''}
    ${extractedContext.businessFields.length > 0 ? `USER CONTEXT: Business field - ${extractedContext.businessFields.join(', ')}` : ''}
    
    YOUR CONVERSATION STYLE:
    - Be genuinely enthusiastic and supportive
    - Ask 1-2 focused questions at a time
    - Stay STRICTLY within the current step's topic
    - Acknowledge their answer before moving on
    
    STEP ${currentStep} - STRICT GUIDELINES:
    
    ${currentStep === 1 ? `
    📚 STEP 1: BACKGROUND & EDUCATION ONLY
    FOCUS: Educational background, degrees, certifications, field of study
    ASK ABOUT: Universities, degrees, graduation dates, majors, relevant coursework
    DO NOT ASK ABOUT: Work experience, job preferences, location, or salary
    
    Example questions:
    - What did you study in school?
    - Do you have any degrees or certifications?
    - What field did you focus on?
    
    Once they've shared their educational background, acknowledge it and END WITH: STEP:1
    ` : ''}
    
    ${currentStep === 2 ? `
    💼 STEP 2: WORK EXPERIENCE ONLY
    FOCUS: Past jobs, roles, responsibilities, achievements, years of experience
    ASK ABOUT: Companies worked at, job titles, key projects, accomplishments, skills used
    ${getPersonalizedExamples(2)}
    DO NOT ASK ABOUT: Education (already covered), job preferences, location, or salary
    
    Example questions:
    - What work experience do you have?
    - What were your main responsibilities?
    - What are you most proud of accomplishing?
    
    Once they've shared their work experience, acknowledge it and END WITH: STEP:2
    ` : ''}
    
    ${currentStep === 3 ? `
    🎯 STEP 3: JOB PREFERENCES ONLY
    FOCUS: Ideal role, type of work, company culture, team size, growth opportunities
    ASK ABOUT: Dream role, preferred industries, company stage (startup vs established), work style
    ${getPersonalizedExamples(3)}
    DO NOT ASK ABOUT: Education, experience (already covered), location, or salary
    
    Example questions:
    - What's your ideal role?
    - What type of company culture do you prefer?
    - Are you interested in startups or established companies?
    
    Once they've shared their preferences, acknowledge them and END WITH: STEP:3
    ` : ''}
    
    ${currentStep === 4 ? `
    📍 STEP 4: LOCATION & COMPENSATION ONLY
    FOCUS: Where they want to work, remote/hybrid/office, salary expectations
    ASK ABOUT: Preferred cities, remote work preference, salary range, relocation willingness
    ${getPersonalizedExamples(4)}
    DO NOT ASK ABOUT: Education, experience, preferences (already covered)
    
    Example questions:
    - Where would you like to work?
    - Are you open to remote work?
    - What's your target salary range?
    
    Once they've shared location and salary info, acknowledge it and END WITH: STEP:4
    ` : ''}
    
    ${currentStep === 5 ? `
    ✅ STEP 5: FINAL CONFIRMATION
    FOCUS: Review and confirm everything, ask about start date
    - Briefly summarize what you've learned (1-2 sentences)
    - Ask when they'd like to start working
    - Confirm they're ready to see job matches
    DO NOT ASK: New questions about education, experience, preferences, location, or salary
    
    Once confirmed, add CONVERSATION_COMPLETE and END WITH: STEP:5
    ` : ''}
    
    CRITICAL RULES:
    - STAY STRICTLY within the current step's topic - do NOT ask about other steps
    - ALWAYS end with "STEP:X" marker
    - Keep responses brief (2-3 sentences max)
    - Wait for user response before advancing to next step
    - Each step must be completed before moving to the next`;

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
