import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VoiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const voices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria (Female, Natural)' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Male, Authoritative)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Female, Professional)' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Female, Warm)' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Male, Friendly)' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (Male, Clear)' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River (Warm, Conversational)' },
];

export const VoiceSelector = ({ value, onChange }: VoiceSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Voice:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              {voice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
