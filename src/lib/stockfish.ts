// Lightweight Stockfish wrapper using a Web Worker.
let worker: Worker | null = null;

export type Difficulty = "easy" | "medium" | "hard";

function ensureWorker(): Worker {
  if (!worker) {
    worker = new Worker("/stockfish/stockfish.js");
  }
  return worker;
}

const settings: Record<Difficulty, { skill: number; depth: number; movetime: number }> = {
  easy: { skill: 0, depth: 2, movetime: 200 },
  medium: { skill: 8, depth: 8, movetime: 600 },
  hard: { skill: 20, depth: 16, movetime: 1500 },
};

export function getBestMove(fen: string, difficulty: Difficulty): Promise<string | null> {
  return new Promise((resolve) => {
    const w = ensureWorker();
    const cfg = settings[difficulty];
    const onMessage = (e: MessageEvent) => {
      const line: string = typeof e.data === "string" ? e.data : "";
      if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        w.removeEventListener("message", onMessage);
        resolve(move && move !== "(none)" ? move : null);
      }
    };
    w.addEventListener("message", onMessage);
    w.postMessage("uci");
    w.postMessage(`setoption name Skill Level value ${cfg.skill}`);
    w.postMessage("ucinewgame");
    w.postMessage(`position fen ${fen}`);
    w.postMessage(`go depth ${cfg.depth} movetime ${cfg.movetime}`);
  });
}

export function disposeStockfish() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
