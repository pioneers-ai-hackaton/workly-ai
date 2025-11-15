import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MapPin, ArrowLeft, Mic, MicOff, Keyboard, Upload } from "lucide-react";
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
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      
      try {
        await audio.play();
        console.log('Audio playback started');
      } catch (playError: any) {
        console.error('Audio playback error:', playError);
        // If autoplay is blocked, show a toast
        if (playError.name === 'NotAllowedError') {
          toast.error('Audio autoplay blocked. Please click to enable audio.');
        } else {
          throw playError;
        }
      }
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

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCV(true);
    
    try {
      console.log('Reading file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Read file as text (works for .txt files and sometimes PDF text content)
      const text = await file.text();
      console.log('Extracted text length:', text.length);
      console.log('Text preview:', text.substring(0, 200));
      
      // Parse CV using edge function
      const { data: cvData, error: cvError } = await supabase.functions.invoke('parse-cv', {
        body: { cvText: text }
      });

      if (cvError) throw cvError;

      console.log('Received CV data:', cvData);

      // Check if CV data is valid
      if (!cvData?.cv || !cvData.cv.name || cvData.cv.name === "Professional Candidate") {
        toast.error("Could not extract information from CV. Please use a text-based PDF or .txt file.");
        return;
      }

      // Create summary message from CV for job matching
      const cvSummary = `Name: ${cvData.cv.name || 'N/A'}
Location: ${cvData.cv.location || 'N/A'}
Summary: ${cvData.cv.summary || 'N/A'}
Skills: ${cvData.cv.skills?.join(', ') || 'N/A'}
Experience: ${cvData.cv.experience?.map((exp: any) => `${exp.title} at ${exp.company}`).join(', ') || 'N/A'}
Education: ${cvData.cv.education?.map((edu: any) => `${edu.degree} from ${edu.institution}`).join(', ') || 'N/A'}`;

      console.log('Generated CV summary:', cvSummary);

      // Generate job matches based on CV
      const { data: matchesData, error: matchesError } = await supabase.functions.invoke('generate-matches', {
        body: { messages: [{ role: 'user', content: cvSummary }] }
      });

      if (matchesError) throw matchesError;

      console.log('Generated matches:', matchesData);

      // Navigate to map with CV data and matches
      navigate("/map", { 
        state: { 
          messages: [{ role: 'user', content: cvSummary }],
          cvData: cvData.cv,
          companies: matchesData.companies
        } 
      });
      
      toast.success("CV imported successfully!");
    } catch (error) {
      console.error('CV upload error:', error);
      toast.error("Failed to process CV. Please try again with a text-based PDF or .txt file.");
    } finally {
      setIsUploadingCV(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleCVUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingCV}
              title="Upload your CV as a .txt file"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploadingCV ? "Processing..." : "Import CV (.txt)"}
            </Button>
          </div>
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
              <ChatMessage 
                key={index} 
                message={message}
                onPlayAudio={generateSpeech}
              />
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
          
          <div className="flex gap-2 items-center">
            <VoiceSelector value={selectedVoice} onChange={setSelectedVoice} />
            <Switch
              id="voice-mode"
              checked={voiceMode}
              onCheckedChange={setVoiceMode}
              className="data-[state=checked]:bg-primary"
            />
            {voiceMode ? (
              <Button
                onClick={handleVoiceInput}
                disabled={isLoading || conversationComplete}
                className={`flex-1 h-10 font-medium transition-all duration-300 ${
                  isRecording 
                    ? 'bg-destructive hover:bg-destructive/90 animate-pulse' 
                    : 'bg-primary hover:bg-primary/90 hover:scale-[1.02]'
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
            ) : (
              <>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
