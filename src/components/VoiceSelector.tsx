import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VoiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const voices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Natural Female' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Authoritative Male' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Professional Female' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Warm Female' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Friendly Male' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Clear Male' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', description: 'Conversational' },
];

export const VoiceSelector = ({ value, onChange }: VoiceSelectorProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-muted"
        >
          <Volume2 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-background/98 backdrop-blur-lg border-border/50">
        <div className="space-y-2">
          <h4 className="font-medium text-sm mb-3">Select Voice</h4>
          <div className="space-y-1">
            {voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => onChange(voice.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  value === voice.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{voice.name}</span>
                  <span className="text-xs text-muted-foreground">{voice.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
