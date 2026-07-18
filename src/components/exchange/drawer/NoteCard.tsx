"use client";

import { FileText } from "lucide-react";

import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";

interface NoteCardProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NoteCard({
  value,
  onChange,
}: NoteCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8">
      <div className="mb-8 flex items-center gap-3">
        <FileText
          size={20}
          className="text-orange-500"
        />

        <h3 className="text-lg font-semibold uppercase tracking-wider text-gray-700">
          Note
        </h3>
      </div>

      <div>
        <Label>Note interne</Label>

        <Textarea
          rows={6}
          className="mt-2 resize-none"
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder="Ajoutez une note concernant cet échange..."
        />
      </div>
    </div>
  );
}