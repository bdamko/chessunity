import { Chessboard } from "react-chessboard";

export function StaticBoard({ fen, size = 280 }: { fen: string; size?: number }) {
  return (
    <div style={{ width: size, maxWidth: "100%" }}>
      <Chessboard
        position={fen}
        arePiecesDraggable={false}
        boardWidth={size}
        customBoardStyle={{ borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
        customDarkSquareStyle={{ backgroundColor: "#b58863" }}
        customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
      />
    </div>
  );
}
