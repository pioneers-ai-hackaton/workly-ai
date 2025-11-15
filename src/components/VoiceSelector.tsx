import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface VoiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const voices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Natural Female', emoji: '👩' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Authoritative Male', emoji: '👨‍💼' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Professional Female', emoji: '👩‍💼' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Warm Female', emoji: '🌸' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Friendly Male', emoji: '😊' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Clear Male', emoji: '🎙️' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', description: 'Conversational', emoji: '🌊' },
];

export const VoiceSelector = ({ value, onChange }: VoiceSelectorProps) => {
  const selectedVoice = voices.find(v => v.id === value);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted/50 transition-colors"
          title={`Voice: ${selectedVoice?.name}`}
        >
          <Volume2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 bg-background/98 backdrop-blur-lg border-border/50" align="start">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">Select Voice</p>
          {voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => onChange(voice.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                voice.id === value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted/50'
              }`}
            >
              <span className="text-xl">{voice.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{voice.name}</div>
                <div className="text-xs opacity-80">{voice.description}</div>
              </div>
              {voice.id === value && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
