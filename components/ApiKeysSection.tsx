"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteApiKey,
  generateApiKey,
  listApiKeys,
  type ApiKeyListItem,
} from "@/lib/actions/api-keys";
import { LockedFeaturePanel } from "@/components/LockedFeaturePanel";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";

const CURL_EXAMPLE = `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://tradeedgeapp.net/api/v1/trades`;

interface ApiKeysSectionProps {
  plan: Plan;
}

function formatLastUsed(lastUsedAt: string | null): string {
  if (!lastUsedAt) return "Never";
  return new Date(lastUsedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApiKeysSection({ plan }: ApiKeysSectionProps) {
  const [keys, setKeys] = useState<ApiKeyListItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);

  const refreshKeys = useCallback(async () => {
    const result = await listApiKeys();
    if (result.ok) setKeys(result.keys);
  }, []);

  useEffect(() => {
    if (plan === "elite") {
      void refreshKeys();
    }
  }, [plan, refreshKeys]);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    const result = await generateApiKey(newKeyName);
    setGenerating(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setRevealedKey(result.key);
    setNewKeyName("");
    await refreshKeys();
  }

  async function handleDelete(keyId: string) {
    setError(null);
    setDeleting(keyId);
    const result = await deleteApiKey(keyId);
    setDeleting(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await refreshKeys();
  }

  async function handleCopyKey() {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyCurl() {
    await navigator.clipboard.writeText(CURL_EXAMPLE);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17]">
      <div className="flex items-center justify-between border-b border-[#1c2235] bg-[#080a0f] px-5 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
          API KEYS
        </span>
        {plan === "elite" ? (
          <span className="rounded border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#f59e0b]">
            ★ ELITE
          </span>
        ) : null}
      </div>

      {plan !== "elite" ? (
        <div className="relative min-h-[280px]">
          <LockedFeaturePanel
            targetPlan="elite"
            featureName="API Access"
            featureDescription="Export your trade data to any tool using a personal API key. Build custom spreadsheets, connect TradingView, or integrate with any platform."
          />
        </div>
      ) : (
        <>
          <div className="px-5 py-4">
            {revealedKey ? (
              <div className="mb-4 rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/[0.04] px-4 py-4">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#00ff88]">
                  ⚠ COPY YOUR KEY NOW — IT WILL NOT BE SHOWN AGAIN
                </p>
                <div className="break-all rounded border border-[#1c2235] bg-[#080a0f] px-3 py-2 font-mono text-[12px] text-[#e8edf5]">
                  {revealedKey}
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="font-mono text-[11px] text-[#00ff88] transition-colors duration-150 hover:text-[#00ff88]/80"
                  >
                    {copied ? "COPIED ✓" : "COPY KEY"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevealedKey(null)}
                    className="font-mono text-[10px] text-[#4a5568] transition-colors duration-150 hover:text-[#8892a4]"
                  >
                    I have saved my key
                  </button>
                </div>
              </div>
            ) : null}

            {keys.length === 0 ? (
              <p className="py-6 text-center font-mono text-[11px] text-[#4a5568]">
                No API keys yet. Generate your first key below.
              </p>
            ) : (
              keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between border-b border-[#1c2235] py-3 last:border-0"
                >
                  <div>
                    <p className="font-body text-[13px] text-[#e8edf5]">
                      {key.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#4a5568]">
                      {key.key_prefix}
                    </p>
                    <p className="font-mono text-[10px] text-[#4a5568]">
                      Last used: {formatLastUsed(key.last_used_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(key.id)}
                    disabled={deleting === key.id}
                    className="text-[#4a5568] transition-colors duration-150 hover:text-[#ff3b5c] disabled:opacity-60"
                    aria-label={`Delete ${key.name}`}
                  >
                    {deleting === key.id ? (
                      <span className="font-mono text-[10px]">…</span>
                    ) : (
                      <TrashIcon />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[#1c2235] px-5 py-4">
            <input
              type="text"
              placeholder="e.g. TradingView Integration"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              disabled={keys.length >= 3}
              className="w-full rounded-lg border border-[#1c2235] bg-[#080a0f] px-4 py-3 font-mono text-[13px] text-[#e8edf5] placeholder:text-[#2a3350] outline-none transition-all duration-150 focus:border-[#2a3350] focus:shadow-[0_0_0_1px_rgba(0,255,136,0.08)] disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || keys.length >= 3}
              className={cn(
                "mt-3 w-full rounded-lg bg-[#00ff88] px-5 py-2.5",
                "font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#080a0f]",
                "transition-all duration-200 hover:bg-[#00ff88]/90",
                "disabled:opacity-60"
              )}
            >
              {generating ? "GENERATING…" : "GENERATE API KEY"}
            </button>
            {keys.length >= 3 ? (
              <p className="mt-2 font-mono text-[10px] text-[#4a5568]">
                Maximum of 3 API keys reached. Delete a key to generate a new
                one.
              </p>
            ) : null}
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-lg border border-[#1c2235] bg-[#080a0f] px-5 py-4">
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a5568]">
                HOW TO USE YOUR API KEY
              </p>
              <p className="font-mono text-[11px] text-[#e8edf5]">
                GET https://tradeedgeapp.net/api/v1/trades
              </p>
              <p className="mt-2 font-mono text-[11px] text-[#8892a4]">
                Authorization: Bearer YOUR_API_KEY
              </p>
              <div className="relative mt-3 rounded bg-[#0c0f17] px-3 py-3">
                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="absolute right-3 top-3 font-mono text-[10px] text-[#4a5568] transition-colors duration-150 hover:text-[#00ff88]"
                >
                  {curlCopied ? "COPIED ✓" : "COPY"}
                </button>
                <pre className="whitespace-pre-wrap pr-16 font-mono text-[10px] text-[#8892a4]">
                  {CURL_EXAMPLE}
                </pre>
              </div>
              <p className="mt-3 font-mono text-[10px] text-[#4a5568]">
                Optional: ?limit=100&amp;offset=0 (max 500 per request)
              </p>
            </div>
          </div>

          {error ? (
            <div
              className="mx-5 mb-5 rounded-lg border border-[#ff3b5c]/20 bg-[#ff3b5c]/10 px-4 py-3 font-mono text-[11px] text-[#ff3b5c]"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 14h10l1-14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
