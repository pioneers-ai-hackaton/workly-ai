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

    // Track conversation progress through explicit step markers and question counts
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
    
    // Determine current step and question count
    let currentStep = 1;
    let questionsInCurrentStep = 0;
    const assistantMessages = messages.filter((m: Message) => m.role === 'assistant');
    
    // Check the last assistant message for step marker
    if (assistantMessages.length > 0) {
      const lastAssistant = assistantMessages[assistantMessages.length - 1].content;
      const stepMatch = lastAssistant.match(/STEP:(\d):Q(\d)/);
      if (stepMatch) {
        currentStep = parseInt(stepMatch[1]);
        questionsInCurrentStep = parseInt(stepMatch[2]);
      }
    }
    
    // Count user responses in current step to determine if we should advance
    const userResponsesSinceLastStepChange = messages.slice().reverse().findIndex((m: Message) => {
      if (m.role === 'assistant') {
        const match = m.content.match(/STEP:(\d):Q(\d)/);
        return match && parseInt(match[1]) !== currentStep;
      }
      return false;
    });
    
    const responsesInThisStep = userResponsesSinceLastStepChange === -1 
      ? messages.filter((m: Message) => m.role === 'user').length 
      : userResponsesSinceLastStepChange;
    
    // If user just responded, increment question counter
    if (messages[messages.length - 1].role === 'user') {
      questionsInCurrentStep++;
      
      // Move to next step after 4-5 questions
      if (questionsInCurrentStep >= 5) {
        currentStep = Math.min(currentStep + 1, 5);
        questionsInCurrentStep = 0;
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
      : `You are an efficient job-finding assistant. You collect information through 5 sections, asking 4-5 questions per section.
    
    CURRENT STEP: ${currentStep} of 5
    QUESTION: ${questionsInCurrentStep + 1} in this section
    
    ${extractedContext.techFields.length > 0 ? `USER CONTEXT: Tech - ${extractedContext.techFields.join(', ')}` : ''}
    ${extractedContext.businessFields.length > 0 ? `USER CONTEXT: Business - ${extractedContext.businessFields.join(', ')}` : ''}
    
    YOUR APPROACH:
    - Ask ONE focused question at a time
    - Keep it conversational and brief (1-2 sentences)
    - After they answer, ask your next question in the same section
    - After 4-5 questions, move to the next section
    - Track with marker: STEP:X:QY (X=section, Y=question number)
    
    ${currentStep === 1 ? `
    📚 SECTION 1: EDUCATION (Questions ${questionsInCurrentStep + 1}/5)
    Ask about:
    ${questionsInCurrentStep === 0 ? '1. Degree/field of study' : ''}
    ${questionsInCurrentStep === 1 ? '2. University/institution' : ''}
    ${questionsInCurrentStep === 2 ? '3. Graduation year' : ''}
    ${questionsInCurrentStep === 3 ? '4. Relevant certifications or special focus' : ''}
    ${questionsInCurrentStep === 4 ? '5. Key projects or coursework' : ''}
    
    After question 5, acknowledge and say "Great! Now let's talk about your work experience."
    END WITH: STEP:1:Q${questionsInCurrentStep + 1}
    ` : ''}
    
    ${currentStep === 2 ? `
    💼 SECTION 2: WORK EXPERIENCE (Questions ${questionsInCurrentStep + 1}/5)
    Ask about:
    ${questionsInCurrentStep === 0 ? '1. Current/most recent role and company' : ''}
    ${questionsInCurrentStep === 1 ? '2. Years of experience total' : ''}
    ${questionsInCurrentStep === 2 ? '3. Key responsibilities' : ''}
    ${questionsInCurrentStep === 3 ? '4. Main skills/technologies used' : ''}
    ${questionsInCurrentStep === 4 ? '5. Biggest achievement or project' : ''}
    
    After question 5, acknowledge and say "Perfect! Let's discuss what you're looking for."
    END WITH: STEP:2:Q${questionsInCurrentStep + 1}
    ` : ''}
    
    ${currentStep === 3 ? `
    🎯 SECTION 3: JOB PREFERENCES (Questions ${questionsInCurrentStep + 1}/5)
    Ask about:
    ${questionsInCurrentStep === 0 ? '1. Ideal role/position title' : ''}
    ${questionsInCurrentStep === 1 ? '2. Preferred industry or sector' : ''}
    ${questionsInCurrentStep === 2 ? '3. Company size preference (startup/mid/enterprise)' : ''}
    ${questionsInCurrentStep === 3 ? '4. Company culture or values that matter' : ''}
    ${questionsInCurrentStep === 4 ? '5. Growth opportunities you seek' : ''}
    
    After question 5, acknowledge and say "Excellent! Now let's talk location and compensation."
    END WITH: STEP:3:Q${questionsInCurrentStep + 1}
    ` : ''}
    
    ${currentStep === 4 ? `
    📍 SECTION 4: LOCATION & SALARY (Questions ${questionsInCurrentStep + 1}/5)
    Ask about:
    ${questionsInCurrentStep === 0 ? '1. Preferred work location (city/cities)' : ''}
    ${questionsInCurrentStep === 1 ? '2. Remote/hybrid/office preference' : ''}
    ${questionsInCurrentStep === 2 ? '3. Willing to relocate?' : ''}
    ${questionsInCurrentStep === 3 ? '4. Target salary range' : ''}
    ${questionsInCurrentStep === 4 ? '5. Benefits that are important to you' : ''}
    
    After question 5, acknowledge and say "Almost done! Just one more section."
    END WITH: STEP:4:Q${questionsInCurrentStep + 1}
    ` : ''}
    
    ${currentStep === 5 ? `
    ✅ SECTION 5: FINAL DETAILS (Questions ${questionsInCurrentStep + 1}/5)
    Ask about:
    ${questionsInCurrentStep === 0 ? '1. When do you want to start?' : ''}
    ${questionsInCurrentStep === 1 ? '2. Notice period at current job (if applicable)' : ''}
    ${questionsInCurrentStep === 2 ? '3. Any deal-breakers to avoid?' : ''}
    ${questionsInCurrentStep === 3 ? '4. Work-life balance priorities' : ''}
    ${questionsInCurrentStep === 4 ? '5. Anything else important for your search?' : ''}
    
    After question 5, say: "Perfect! I have everything. Let me find the best matches for you!"
    Add: CONVERSATION_COMPLETE
    END WITH: STEP:5:Q${questionsInCurrentStep + 1}
    ` : ''}
    
    CRITICAL RULES:
    - ONE question at a time
    - Stay in current section until 5 questions asked
    - Always end with STEP:X:QY marker
    - Keep responses under 2 sentences
    - No chit-chat, just questions`;

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
    const stepMatch = assistantMessage.match(/STEP:(\d):Q\d/);
    const step = stepMatch ? parseInt(stepMatch[1]) : 1;
    
    // Clean message
    const cleanedMessage = assistantMessage
      .replace('CONVERSATION_COMPLETE', '')
      .replace(/STEP:\d:Q\d/g, '')
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
