"use client";

import { useEffect, useRef, useState } from "react";

type CopyIbanButtonProps = {
  iban: string;
  className?: string;
};

export default function CopyIbanButton({ iban, className = "" }: CopyIbanButtonProps) {
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    const copied = await copyText(iban);

    setMessage(
      copied
        ? "Rekeningnummer gekopieerd."
        : "Kopiëren lukt niet. Selecteer het rekeningnummer handmatig."
    );

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => setMessage(""), 2500);
  }

  return (
    <div className={className}>
      <button
        type="button"
        className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 sm:w-auto"
        onClick={handleCopy}
      >
        Rekeningnummer kopiëren
      </button>
      <p className="mt-2 min-h-5 text-sm font-semibold text-emerald-900" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopyText(text);
    }
  }

  return fallbackCopyText(text);
}

function fallbackCopyText(text: string): boolean {
  const textArea = document.createElement("textarea");

  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}
