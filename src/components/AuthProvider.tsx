import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = { id: string; username: string | null; avatar_url: string | null };

const AuthContext = createContext<{
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}>({ user: null, session: null, profile: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProfile = async (id: string) => {
    const { data } = await supabase.from("profiles").select("id, username, avatar_url").eq("id", id).maybeSingle();
    setProfile(data as Profile | null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
