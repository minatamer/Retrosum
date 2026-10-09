"use client";
import { useState } from "react";
import { ComposerShell } from "../../components/ui/composer-shell";
import styles from "./landing.module.css";

const retroExamples = [
  {
    id: "summary",
    prompt: "Summarize this month",
    text: "A clear summary, with the numbers that matter and the documents behind them. Retro helps you connect income, costs, profit and cash.",
    label: "Summarize",
  },
  {
    id: "tour",
    prompt: "Show me around",
    text: "Follow a guided tour of your dashboard. Retro will scroll to the right section, highlight a figure, and explain what it means.",
    label: "Give me a tour",
  },
  {
    id: "invoice",
    prompt: "Create a $2,000 invoice, due November 30",
    text: "See an editable draft fill in front of you. Review the customer, amount and due date, then confirm. Your most recent change has an Undo button.",
    label: "Prepare an invoice",
  },
  {
    id: "expense",
    prompt: "Help me add an expense",
    text: "Create, update or remove a session record through a clear form. Retro prepares the details; you stay in control of the final change.",
    label: "Add an expense",
  },
] as const;
export function RetroPreview() {
  const [selected, setSelected] = useState<(typeof retroExamples)[number]>(retroExamples[0]);
  return (
    <div className={styles.retroPreview}>
      <span className={styles.previewTag}>Interaction preview</span>
      <ComposerShell
        value=""
        disabled
        footnote="Explore your workspace with Retro."
        shortcuts={retroExamples.map((example) => (
          <button
            type="button"
            key={example.id}
            aria-pressed={selected.id === example.id}
            onClick={() => setSelected(example)}
          >
            {example.label}
          </button>
        ))}
      >
        <div className="rs-chat-user" key={selected.id + "-user"}>
          {selected.prompt}
        </div>
        <div className="rs-chat-retro" key={selected.id}>
          <span className="rs-eyebrow">Retro</span>
          {selected.text}
        </div>
      </ComposerShell>
    </div>
  );
}
