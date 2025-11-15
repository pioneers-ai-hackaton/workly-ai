import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MapPin, ArrowLeft, Mic, MicOff, Keyboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatMessage from "@/components/ChatMessage";
import { Progress } from "@/components/ui/progress";
import { VoiceSelector } from "@/components/VoiceSelector";
import { AudioRecorder } from "@/utils/audioRecorder";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm here to help you find your perfect job. Tell me about yourself - what's your background, education, and what kind of work are you looking for?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(5);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('9BWtsMINqrJLrRacOk9x');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const navigate = useNavigate();

  const stepLabels = [
    "Background & Education",
    "Work Experience",
    "Job Preferences",
    "Location & Salary",
    "Final Details"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    audioRecorderRef.current = new AudioRecorder();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { 
          messages: [...messages, { role: "user", content: userMessage }],
          conversationComplete 
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast.error("Too many requests. Please wait a moment and try again.");
        } else if (error.message?.includes("402")) {
          toast.error("Service limit reached. Please contact support.");
        } else {
          throw error;
        }
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      if (data.step && data.step <= totalSteps) {
        setCurrentStep(data.step);
      }

      if (data.ready) {
        setConversationComplete(true);
      }

      // If voice mode is enabled, generate speech for the response
      if (voiceMode) {
        await generateSpeech(data.message);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSpeech = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voiceId: selectedVoice }
      });

      if (error) throw error;

      // Play the audio
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      audio.play();
    } catch (error: any) {
      console.error('Error generating speech:', error);
      toast.error('Failed to generate speech');
    }
  };

  const handleVoiceInput = async () => {
    if (!audioRecorderRef.current) return;

    if (isRecording) {
      try {
        const audioData = await audioRecorderRef.current.stop();
        setIsRecording(false);

        setIsLoading(true);

        // Transcribe audio
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke(
          'speech-to-text',
          { body: { audio: audioData } }
        );

        if (transcriptError) throw transcriptError;

        const transcript = transcriptData.text;
        if (!transcript) {
          toast.error('No speech detected');
          setIsLoading(false);
          return;
        }

        // Add the transcribed text as a user message
        setMessages((prev) => [...prev, { role: "user", content: transcript }]);

        // Send to chat API
        const { data, error } = await supabase.functions.invoke("chat", {
          body: { 
            messages: [...messages, { role: "user", content: transcript }],
            conversationComplete 
          },
        });

        if (error) {
          if (error.message?.includes("429")) {
            toast.error("Too many requests. Please wait a moment and try again.");
          } else if (error.message?.includes("402")) {
            toast.error("Service limit reached. Please contact support.");
          } else {
            throw error;
          }
          setIsLoading(false);
          return;
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);

        if (data.step && data.step <= totalSteps) {
          setCurrentStep(data.step);
        }

        if (data.ready) {
          setConversationComplete(true);
        }

        // Generate speech for the response
        if (voiceMode) {
          await generateSpeech(data.message);
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error('Error processing voice input:', error);
        toast.error('Failed to process voice input');
        setIsLoading(false);
      }
    } else {
      try {
        await audioRecorderRef.current.start();
        setIsRecording(true);
        toast.success('Recording started - speak now');
      } catch (error: any) {
        console.error('Error starting recording:', error);
        toast.error('Failed to start recording. Please allow microphone access.');
      }
    }
  };

  const handleViewMatches = () => {
    navigate("/map", { state: { messages } });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Job Finder Chat</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Progress Steps */}
          {!conversationComplete && (
            <div className="mb-8 bg-card/80 backdrop-blur-sm p-6 rounded-lg border border-border">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Step {currentStep} of {totalSteps}</span>
                  <span className="text-muted-foreground">{stepLabels[currentStep - 1]}</span>
                </div>
                <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <ChatMessage
                message={{ role: "assistant", content: "Thinking..." }}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          {conversationComplete && (
            <Button
              onClick={handleViewMatches}
              className="w-full mb-4 bg-gradient-primary hover:opacity-90"
            >
              <MapPin className="mr-2 h-4 w-4" />
              View Job Matches on Map
            </Button>
          )}

          {voiceMode ? (
            <div className="flex items-center gap-2">
              <VoiceSelector value={selectedVoice} onChange={setSelectedVoice} />
              <Button
                onClick={handleVoiceInput}
                disabled={isLoading || conversationComplete}
                className={`flex-1 h-11 font-medium transition-all duration-300 ${
                  isRecording 
                    ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                    : 'bg-primary hover:bg-primary/90 hover:scale-[1.01]'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-5 w-5 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 mr-2" />
                    {isLoading ? 'Processing...' : 'Start Recording'}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <VoiceSelector value={selectedVoice} onChange={setSelectedVoice} />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Switch
                id="voice-toggle"
                checked={voiceMode}
                onCheckedChange={setVoiceMode}
                className="data-[state=checked]:bg-primary self-center"
                title={voiceMode ? "Switch to text mode" : "Switch to voice mode"}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
