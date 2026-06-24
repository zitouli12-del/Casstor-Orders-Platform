"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="
        px-4 py-2
        bg-cyan-600
        hover:bg-cyan-700
        rounded-lg
        font-medium
      "
    >
      Imprimer BL
    </button>
  );
}