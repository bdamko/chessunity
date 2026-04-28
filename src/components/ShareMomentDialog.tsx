import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StaticBoard } from "./StaticBoard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";

export function ShareMomentDialog({
  open,
  onOpenChange,
  fen,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fen: string;
}) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!user) {
      toast.error("Please sign in to share moments");
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("moments").insert({
      user_id: user.id,
      fen,
      caption: caption.trim() || null,
    });
    setPosting(false);
    if (error) {
      toast.error("Failed to post: " + error.message);
      return;
    }
    toast.success("Posted to community!");
    setCaption("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share this moment</DialogTitle>
          <DialogDescription>Save this position to the community feed.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <StaticBoard fen={fen} size={260} />
        </div>
        <Textarea
          placeholder="Add a caption…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={280}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={post} disabled={posting}>
            {posting ? "Posting…" : "Post to Community"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
