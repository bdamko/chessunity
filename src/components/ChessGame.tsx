import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareMomentDialog } from "./ShareMomentDialog";
import { getBestMove, type Difficulty, disposeStockfish } from "@/lib/stockfish";
import { Undo2, RotateCw, Sparkles, Share2 } from "lucide-react";
import { toast } from "sonner";

type Mode = "pvp" | "ai";

export function ChessGame() {
  const gameRef = useRef(new Chess());
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);
  const [mode, setMode] = useState<Mode>("pvp");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [shareOpen, setShareOpen] = useState(false);
  const [thinking, setThinking] = useState(false);

  const game = gameRef.current;
  const fen = game.fen();
  const history = game.history({ verbose: false });

  const movePairs = useMemo(() => {
    const pairs: Array<{ n: number; w?: string; b?: string }> = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({ n: i / 2 + 1, w: history[i], b: history[i + 1] });
    }
    return pairs;
  }, [history]);

  useEffect(() => () => disposeStockfish(), []);

  const checkEnd = () => {
    if (game.isCheckmate()) toast.success(`Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins.`);
    else if (game.isStalemate()) toast("Stalemate — draw.");
    else if (game.isDraw()) toast("Draw.");
    else if (game.inCheck()) toast.warning("Check!");
  };

  const aiTurn = async () => {
    if (game.isGameOver()) return;
    setThinking(true);
    const best = await getBestMove(game.fen(), difficulty);
    setThinking(false);
    if (!best) return;
    const from = best.slice(0, 2) as Square;
    const to = best.slice(2, 4) as Square;
    const promotion = best.length === 5 ? best[4] : undefined;
    try {
      game.move({ from, to, promotion: promotion as any });
      rerender();
      checkEnd();
    } catch {
      // ignore
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string): boolean => {
    if (thinking) return false;
    if (mode === "ai") {
      const playerColor = orientation === "white" ? "w" : "b";
      if (game.turn() !== playerColor) return false;
    }
    try {
      const move = game.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: "q",
      });
      if (!move) return false;
    } catch {
      return false;
    }
    rerender();
    checkEnd();
    if (mode === "ai" && !game.isGameOver()) {
      setTimeout(aiTurn, 250);
    }
    return true;
  };

  const undo = () => {
    game.undo();
    if (mode === "ai") game.undo(); // also undo AI move
    rerender();
  };

  const newGame = () => {
    gameRef.current = new Chess();
    rerender();
  };

  const flip = () => setOrientation((o) => (o === "white" ? "black" : "white"));

  const isOver = game.isGameOver();

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 max-w-6xl mx-auto">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={mode} onValueChange={(v) => { setMode(v as Mode); newGame(); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pvp">Pass &amp; Play</SelectItem>
              <SelectItem value="ai">Vs Computer</SelectItem>
            </SelectContent>
          </Select>
          {mode === "ai" && (
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={undo} disabled={history.length === 0}>
            <Undo2 className="h-4 w-4" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={flip}>
            <RotateCw className="h-4 w-4" /> Flip
          </Button>
          <Button variant="outline" size="sm" onClick={newGame}>
            <Sparkles className="h-4 w-4" /> New Game
          </Button>
          <Button size="sm" className="ml-auto" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" /> Share Moment
          </Button>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex justify-center">
          <div className="w-full max-w-[560px]">
            <Chessboard
              position={fen}
              onPieceDrop={onDrop}
              boardOrientation={orientation}
              customBoardStyle={{ borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
              customDarkSquareStyle={{ backgroundColor: "var(--board-dark, #b58863)" }}
              customLightSquareStyle={{ backgroundColor: "var(--board-light, #f0d9b5)" }}
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          {thinking
            ? "Computer is thinking…"
            : isOver
            ? "Game over"
            : `${game.turn() === "w" ? "White" : "Black"} to move`}
        </div>
        {isOver && (
          <div className="flex justify-center">
            <Button onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> Share this moment
            </Button>
          </div>
        )}
      </div>

      <aside className="bg-card border border-border rounded-xl p-4 h-fit">
        <h3 className="font-semibold mb-3">Move history</h3>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm font-mono">
            <thead className="text-muted-foreground text-xs">
              <tr><th className="text-left w-8">#</th><th className="text-left">White</th><th className="text-left">Black</th></tr>
            </thead>
            <tbody>
              {movePairs.length === 0 && (
                <tr><td colSpan={3} className="text-center text-muted-foreground py-4">No moves yet</td></tr>
              )}
              {movePairs.map((p) => (
                <tr key={p.n} className="border-t border-border/50">
                  <td className="py-1 text-muted-foreground">{p.n}.</td>
                  <td>{p.w}</td>
                  <td>{p.b ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>

      <ShareMomentDialog open={shareOpen} onOpenChange={setShareOpen} fen={fen} />
    </div>
  );
}
