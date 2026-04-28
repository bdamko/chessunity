import { createFileRoute } from "@tanstack/react-router";
import { ChessGame } from "@/components/ChessGame";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="px-4 py-6">
      <ChessGame />
    </div>
  );
}
