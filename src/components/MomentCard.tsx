import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaticBoard } from "./StaticBoard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";

export type Moment = {
  id: string;
  user_id: string;
  fen: string;
  caption: string | null;
  likes_count: number;
  created_at: string;
  profile?: { username: string | null; avatar_url: string | null } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: { username: string | null; avatar_url: string | null } | null;
};

export function MomentCard({ moment }: { moment: Moment }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(moment.likes_count);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (!user) { setLiked(false); return; }
    supabase.from("likes").select("id").eq("moment_id", moment.id).eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, moment.id]);

  const toggleLike = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    if (liked) {
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
      const { error } = await supabase.from("likes").delete().eq("moment_id", moment.id).eq("user_id", user.id);
      if (error) { setLiked(true); setLikes((n) => n + 1); }
    } else {
      setLiked(true); setLikes((n) => n + 1);
      const { error } = await supabase.from("likes").insert({ moment_id: moment.id, user_id: user.id });
      if (error) { setLiked(false); setLikes((n) => Math.max(0, n - 1)); }
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .eq("moment_id", moment.id)
      .order("created_at", { ascending: true });
    const list = (data ?? []) as Comment[];
    const ids = Array.from(new Set(list.map((c) => c.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach((c) => { c.profile = map.get(c.user_id) ?? null; });
    }
    setComments(list);
    setLoadingComments(false);
  };

  const openComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) loadComments();
  };

  const addComment = async () => {
    if (!user) { toast.error("Sign in to comment"); return; }
    const content = newComment.trim();
    if (!content) return;
    const { error } = await supabase.from("comments").insert({
      moment_id: moment.id,
      user_id: user.id,
      content,
    });
    if (error) { toast.error(error.message); return; }
    setNewComment("");
    loadComments();
  };

  const username = moment.profile?.username ?? "Anonymous";

  return (
    <article className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={moment.profile?.avatar_url ?? undefined} />
          <AvatarFallback>{username.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{username}</div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(moment.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <StaticBoard fen={moment.fen} size={320} />
      </div>

      {moment.caption && <p className="text-sm">{moment.caption}</p>}

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={toggleLike}>
          <Heart className={`h-4 w-4 ${liked ? "fill-current text-red-500" : ""}`} /> {likes}
        </Button>
        <Button variant="ghost" size="sm" onClick={openComments}>
          <MessageCircle className="h-4 w-4" /> {showComments ? "Hide" : "Comments"}
        </Button>
      </div>

      {showComments && (
        <div className="space-y-3 border-t border-border pt-3">
          {loadingComments && <p className="text-xs text-muted-foreground">Loading…</p>}
          {!loadingComments && comments.length === 0 && (
            <p className="text-xs text-muted-foreground">No comments yet. Be the first.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <Avatar className="h-7 w-7">
                <AvatarImage src={c.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{(c.profile?.username ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className="font-medium mr-2">{c.profile?.username ?? "Anonymous"}</span>
                <span>{c.content}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder={user ? "Add a comment…" : "Sign in to comment"}
              value={newComment}
              disabled={!user}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addComment(); }}
            />
            <Button onClick={addComment} disabled={!user || !newComment.trim()}>Post</Button>
          </div>
        </div>
      )}
    </article>
  );
}
