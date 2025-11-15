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
    const { audio } = await req.json();
    const GOOGLE_SPEECH_API_KEY = Deno.env.get('GOOGLE_SPEECH_API_KEY');

    if (!GOOGLE_SPEECH_API_KEY) {
      throw new Error('GOOGLE_SPEECH_API_KEY is not configured');
    }

    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Transcribing audio...');

    // Call Google Cloud Speech-to-Text API
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_SPEECH_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audio,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Speech API error:', response.status, errorText);
      throw new Error('Failed to transcribe audio');
    }

    const data = await response.json();
    console.log('Transcription result:', data);

    const transcript = data.results?.[0]?.alternatives?.[0]?.transcript || '';

    return new Response(
      JSON.stringify({ text: transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in speech-to-text function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
