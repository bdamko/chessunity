import { Link } from "@tanstack/react-router";
import { Moon, Sun, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthProvider";

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, profile, signOut } = useAuth();

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Crown className="h-5 w-5 text-primary" />
          <span>Chessunity</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent/20 transition-colors"
            activeProps={{ className: "px-3 py-1.5 text-sm rounded-md bg-accent/20 font-semibold" }}
            activeOptions={{ exact: true }}
          >
            Play
          </Link>
          <Link
            to="/feed"
            className="px-3 py-1.5 text-sm rounded-md hover:bg-accent/20 transition-colors"
            activeProps={{ className: "px-3 py-1.5 text-sm rounded-md bg-accent/20 font-semibold" }}
          >
            Community
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <div className="flex items-center gap-2 ml-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{(profile?.username ?? user.email ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">{profile?.username ?? user.email}</span>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
