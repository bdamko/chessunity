import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MomentCard, type Moment } from "@/components/MomentCard";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Community — Chessunity" },
      { name: "description", content: "Browse chess moments shared by the Chessunity community." },
      { property: "og:title", content: "Chessunity Community" },
      { property: "og:description", content: "Browse chess moments shared by the community." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("moments")
        .select("id, user_id, fen, caption, likes_count, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      const list = (data ?? []) as Moment[];
      const ids = Array.from(new Set(list.map((m) => m.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((m) => { m.profile = map.get(m.user_id) ?? null; });
      }
      setMoments(list);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold">Community Feed</h1>
      {loading && <p className="text-muted-foreground">Loading moments…</p>}
      {!loading && moments.length === 0 && (
        <p className="text-muted-foreground">No moments yet — be the first to share one from the Play page.</p>
      )}
      {moments.map((m) => <MomentCard key={m.id} moment={m} />)}
    </div>
  );
}