import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPickerButton({ onEmojiSelect }: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" type="button">
          <Smile className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-0" align="start">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          autoFocusSearch={false}
          width={350}
          height={400}
        />
      </PopoverContent>
    </Popover>
  );
}
