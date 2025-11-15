import { cn } from "@/lib/utils";
import { Bot, User, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: {
    role: "user" | "assistant";
    content: string;
  };
  onPlayAudio?: (text: string) => void;
}

const ChatMessage = ({ message, onPlayAudio }: ChatMessageProps) => {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-soft",
            isAssistant
              ? "bg-card text-card-foreground"
              : "bg-gradient-primary text-primary-foreground"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {isAssistant && onPlayAudio && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlayAudio(message.content)}
            className="self-start h-8 px-2"
          >
            <Volume2 className="h-4 w-4 mr-1" />
            <span className="text-xs">Play audio</span>
          </Button>
        )}
      </div>
      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
