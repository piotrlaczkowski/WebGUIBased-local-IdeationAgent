import type React from "react";

const ResultBlock: React.FC<{ error?: string; result?: unknown }> = ({
  error,
  result,
}) => (
  <div
    className={
      error
        ? "bg-red-900 border border-red-600 rounded p-3"
        : "bg-gray-700 border border-gray-600 rounded p-3"
    }
  >
    {error ? <p className="text-red-300 text-sm">Error: {error}</p> : null}
    <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto mt-2">
      {typeof result === "object" && result !== null ? JSON.stringify(result, null, 2) : String(result || '')}
    </pre>
  </div>
);

export default ResultBlock;
