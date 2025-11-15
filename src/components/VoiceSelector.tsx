import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const selectedVoice = voices.find(v => v.id === value);
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-background/95 backdrop-blur-sm border-border/50 hover:border-border transition-colors">
        <SelectValue>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{selectedVoice?.name}</span>
            <span className="text-xs text-muted-foreground">{selectedVoice?.description}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background/98 backdrop-blur-lg border-border/50">
        {voices.map((voice) => (
          <SelectItem 
            key={voice.id} 
            value={voice.id}
            className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
          >
            <div className="flex flex-col">
              <span className="font-medium">{voice.name}</span>
              <span className="text-xs text-muted-foreground">{voice.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
