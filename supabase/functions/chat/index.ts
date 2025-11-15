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

    // Build detailed questioning paths based on context
    const getDetailedQuestions = (step: number) => {
      const isTech = extractedContext.techFields.length > 0;
      const isBusiness = extractedContext.businessFields.length > 0;
      
      switch (step) {
        case 1: // Education - dig deeper
          if (isTech && extractedContext.techFields.includes('software development')) {
            return `Ask ONE specific question at a time:
            - What programming languages did you learn? (Python, Java, JavaScript, C++?)
            - Which frameworks or libraries have you used? (React, Angular, Node.js, Django?)
            - Any relevant coursework? (Data Structures, Algorithms, Web Development?)
            - University clubs or hackathons you participated in?`;
          }
          if (isTech && extractedContext.techFields.includes('data science')) {
            return `Ask ONE question at a time:
            - Which data analysis tools have you used? (Python, R, SQL, Tableau?)
            - ML/AI coursework or projects? (Machine Learning, Deep Learning, NLP?)
            - Any research experience or publications?
            - Statistics or mathematics background?`;
          }
          return `Dig into education details ONE question at a time:
          - Specific major/concentration?
          - Relevant coursework that stands out?
          - Academic clubs, societies, or leadership roles?
          - Projects or research?`;
        
        case 2: // Experience - be very specific
          if (isTech && extractedContext.techFields.includes('software development')) {
            return `Get concrete details ONE at a time:
            - Tech stack used? (Frontend: React/Vue/Angular? Backend: Node/Python/Java?)
            - What did you build specifically? (Web apps, mobile apps, APIs, microservices?)
            - Team size and your role? (Solo, small team, large team?)
            - Specific achievements or metrics? (Performance improvements, features shipped, users impacted?)`;
          }
          if (isTech && extractedContext.techFields.includes('data science')) {
            return `Get specific experience ONE question at a time:
            - ML frameworks and libraries? (TensorFlow, PyTorch, Scikit-learn, Pandas?)
            - Types of models built? (Classification, regression, NLP, computer vision?)
            - Data pipeline tools? (Spark, Airflow, SQL databases?)
            - Impact of your work? (Accuracy improvements, business value, insights generated?)`;
          }
          if (isBusiness && extractedContext.businessFields.includes('marketing')) {
            return `Get marketing experience details ONE at a time:
            - Channels managed? (SEO, SEM, social media, email, content?)
            - Campaign results? (CTR, conversions, ROI improvements?)
            - Tools used? (Google Analytics, HubSpot, Salesforce, SEMrush?)
            - Audience size or budget managed?`;
          }
          return `Get work experience details ONE at a time:
          - Specific responsibilities and daily tasks?
          - Tools and technologies used?
          - Measurable achievements or impact?
          - Team collaboration and leadership roles?`;
        
        case 3: // Skills - comprehensive list
          if (isTech) {
            return `Build comprehensive skills list by asking ONE at a time:
            - Programming languages (rate proficiency: beginner/intermediate/advanced)?
            - Frameworks and libraries you're confident with?
            - Development tools? (Git, Docker, CI/CD, testing frameworks?)
            - Soft skills? (Team collaboration, communication, problem-solving?)
            - Certifications or online courses completed?`;
          }
          return `Map out all skills ONE category at a time:
          - Core technical skills and tools?
          - Software proficiency? (Microsoft Office, CRM systems, analytics tools?)
          - Communication and leadership experience?
          - Certifications or specialized training?`;
        
        case 4: // Preferences - be specific
          if (isTech) {
            return `Narrow down preferences ONE at a time:
            - Role type? (Frontend, backend, full-stack, DevOps, data engineering?)
            - Company stage? (Startup, scale-up, established company, enterprise?)
            - Industry interest? (Fintech, healthcare, e-commerce, SaaS, gaming?)
            - Team size preference? (Small agile team vs large organization?)
            - Work style? (Remote, hybrid, in-office?)`;
          }
          return `Define ideal role ONE aspect at a time:
          - Specific position or job titles you're targeting?
          - Industry or sector preference?
          - Company culture and values important to you?
          - Work arrangement? (Remote, hybrid, office?)`;
        
        case 5: // Location & Logistics
          return `Get practical details ONE at a time:
          - Preferred cities or willingness to relocate?
          - Remote work expectations?
          - Salary expectations or range?
          - Start date availability?
          - Any visa or relocation considerations?`;
        
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
    - Be warm and encouraging but FOCUSED
    - Ask ONE specific question at a time (short, digestible messages!)
    - ALWAYS include concrete examples in parentheses to jog their memory
    - Questions should be specific enough to guide but open enough for stories
    - Celebrate what they share and dig deeper with follow-ups
    - Each question should help build a 90% complete CV
    
    QUESTIONING STRATEGY:
    ${getDetailedQuestions(currentStep)}
    
    STEP ${currentStep} GUIDANCE:
    
    ${currentStep === 1 ? `
    📚 EDUCATION DEEP DIVE
    - Start with degree and university
    - Then ask ONE targeted question from the list above
    - Include example answers in parentheses to help them remember
    - If CS student: dig into programming languages, frameworks, coursework, clubs
    - If business: ask about concentrations, relevant coursework, leadership roles
    - Wait for their answer before asking the next question
    - END WITH: STEP:1
    ` : ''}
    
    ${currentStep === 2 ? `
    💼 EXPERIENCE DETAILS
    - Acknowledge their education with enthusiasm!
    - Ask ONE specific question from the experience guidance above
    - For tech: get exact tech stack, project types, achievements with metrics
    - For non-tech: get tools used, responsibilities, measurable impact
    - ALWAYS include example tools/technologies in parentheses
    - Wait for details before moving to next aspect
    - END WITH: STEP:2
    ` : ''}
    
    ${currentStep === 3 ? `
    🔧 COMPREHENSIVE SKILLS
    - This is where we build the complete skills section!
    - Ask about ONE skill category at a time from the guidance
    - For tech: programming languages (with proficiency), frameworks, tools
    - Include examples to remind them of what they might know
    - Don't skip certifications or online courses!
    - END WITH: STEP:3
    ` : ''}
    
    ${currentStep === 4 ? `
    🎯 ROLE PREFERENCES
    - Now define their ideal job clearly
    - Ask ONE preference question at a time
    - Get specific: role type, company stage, industry, team size
    - Help them visualize their perfect position
    - Include examples of role types or companies
    - END WITH: STEP:4
    ` : ''}
    
    ${currentStep === 5 ? `
    📍 LOGISTICS & FINAL DETAILS
    - Get practical details ONE at a time
    - Location preferences, remote willingness, salary range
    - Once all details collected, say something exciting like "Perfect! I have everything I need to find your ideal job matches!"
    - Then add: CONVERSATION_COMPLETE
    - END WITH: STEP:5
    ` : ''}
    
    CRITICAL RULES:
    - ALWAYS end with "STEP:X" marker
    - Ask ONE focused question at a time (2-3 sentences max per message)
    - ALWAYS include concrete examples in parentheses (tools, frameworks, languages, etc.)
    - Questions should be specific enough to guide answers but leave room for storytelling
    - Every question should extract CV-worthy information
    - Make them excited to share their experiences!
    - Keep messages short and digestible - NO giant text blocks!`;

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
