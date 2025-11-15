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
    const { text, voiceId } = await req.json();
    const GOOGLE_TTS_API_KEY = Deno.env.get('GOOGLE_TTS_API_KEY');

    if (!GOOGLE_TTS_API_KEY) {
      throw new Error('GOOGLE_TTS_API_KEY is not configured');
    }

    if (!text) {
      throw new Error('No text provided');
    }

    // Map voice IDs to Google Cloud voice names
    // Default to en-US-Neural2-C (female) if not specified
    const voiceMap: Record<string, string> = {
      'female': 'en-US-Neural2-C',
      'male': 'en-US-Neural2-D',
      'aria': 'en-US-Neural2-F',
      'default': 'en-US-Neural2-C'
    };
    
    const voiceName = voiceMap[voiceId?.toLowerCase()] || voiceMap['default'];

    console.log(`Generating speech with Google Cloud TTS voice: ${voiceName}`);

    // Call Google Cloud Text-to-Speech API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: voiceName,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 1.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Cloud TTS API error:', response.status, errorText);
      throw new Error('Failed to generate speech');
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error('No audio content in response');
    }

    console.log('Speech generated successfully');

    return new Response(
      JSON.stringify({ audio: data.audioContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
