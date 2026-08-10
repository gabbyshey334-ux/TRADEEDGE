"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  label: string;
}

export function VideoModal({ open, onClose, videoUrl, label }: VideoModalProps) {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (video) {
        video.pause();
      }
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const video = videoRef.current;
    if (!video) return;

    void video.play().catch(() => {
      // Autoplay may still be blocked in some browsers; controls remain available.
    });
  }, [open, videoUrl]);

  function handleClose() {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    onClose();
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="Close video"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm sm:bg-black/75"
        onClick={handleClose}
      />

      <div
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden bg-[#0c0f17]",
          "h-auto max-h-[100dvh] sm:max-h-[min(90vh,720px)] sm:max-w-[900px]",
          "border-[#1c2235] sm:rounded-2xl sm:border",
          "shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:shadow-[0_32px_64px_rgba(0,0,0,0.55)]",
          "animate-fadeInSoft",
          "mx-auto my-auto px-4 py-4 sm:p-0",
          "pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3 sm:mb-0 sm:border-b sm:border-[#1c2235] sm:bg-[#080a0f] sm:px-5 sm:py-3">
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.14em] text-[#8892a4]">
            {label}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg",
              "font-mono text-[11px] uppercase tracking-[0.12em] text-[#8892a4]",
              "transition-colors hover:text-[#e8edf5] active:bg-[#111520]"
            )}
            aria-label="Close video"
          >
            ✕
          </button>
        </div>

        <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-video sm:rounded-none sm:rounded-b-2xl">
          {/* src is only set while open so the video file is not fetched on page load */}
          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            controls
            playsInline
            autoPlay
            preload="metadata"
            className="h-full w-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>,
    document.body
  );
}
