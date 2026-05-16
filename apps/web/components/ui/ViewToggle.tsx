"use client"

import { LayoutGrid, List } from "lucide-react"

type View = "grid" | "list"

export default function ViewToggle({ view, onChange }: {
  view: View
  onChange: (v: View) => void
}) {
  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--color-border)" }}
    >
      {(["grid", "list"] as View[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="w-8 h-8 flex items-center justify-center transition-colors"
          style={{
            background: view === v ? "#F5EDE6" : "#fff",
            color: view === v ? "#C2622A" : "var(--color-text-muted)"
          }}
        >
          {v === "grid" ? <LayoutGrid size={15} /> : <List size={15} />}
        </button>
      ))}
    </div>
  )
}