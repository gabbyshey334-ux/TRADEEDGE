"use client";

import { useState } from "react";
import Image from "next/image";
import { VideoModal } from "@/components/VideoModal";
import { cn } from "@/lib/utils";

export interface VideoThumbnailProps {
  videoUrl: string;
  thumbnailUrl: string;
  label: string;
  className?: string;
  priority?: boolean;
}

export function VideoThumbnail({
  videoUrl,
  thumbnailUrl,
  label,
  className,
  priority = false,
}: VideoThumbnailProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={cn(
          "group block w-full cursor-pointer overflow-hidden rounded-xl border border-[#1c2235] bg-[#0c0f17] p-0 text-left",
          "transition-all duration-200",
          "hover:border-[#2a3350] hover:brightness-110 hover:scale-[1.01]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080a0f]",
          className
        )}
      >
        <span className="relative block aspect-video w-full">
          <Image
            src={thumbnailUrl}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px"
            className="object-cover"
            priority={priority}
          />
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-[#080a0f]/20 transition-colors duration-200 group-hover:bg-[#080a0f]/10"
            )}
            aria-hidden
          >
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16",
                "bg-[#080a0f]/70 shadow-[0_0_24px_rgba(0,0,0,0.45)]",
                "transition-transform duration-200 group-hover:scale-105"
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className="ml-0.5 h-6 w-6 sm:h-7 sm:w-7"
                fill="#00ff88"
                aria-hidden
              >
                <path d="M8 5.14v13.72L19 12 8 5.14z" />
              </svg>
            </span>
          </span>
        </span>
      </button>

      <VideoModal
        open={open}
        onClose={() => setOpen(false)}
        videoUrl={videoUrl}
        label={label}
      />
    </>
  );
}
