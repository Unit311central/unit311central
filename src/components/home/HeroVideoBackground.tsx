"use client";

import { useEffect, useRef, useState } from "react";

const HERO_VIDEO = "/images/video.mp4";
const HERO_POSTER = "/images/homepage-mockup-reference.png";
const PLAYBACK_RATE = 0.8;
const LOOP_LEAD_IN_SECONDS = 0.05;
const LOOP_TRIM_SECONDS = 0.12;

export default function HeroVideoBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [usePosterFallback, setUsePosterFallback] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(media.matches);

    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || usePosterFallback) return;

    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const primePlayback = () => {
      video.muted = true;
      video.volume = 0;
      video.playbackRate = PLAYBACK_RATE;
      void video.play().catch(() => {
        setUsePosterFallback(true);
      });
    };

    const handleLoadedMetadata = () => {
      video.playbackRate = PLAYBACK_RATE;
    };

    const handleTimeUpdate = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;

      if (video.currentTime >= video.duration - LOOP_TRIM_SECONDS) {
        video.currentTime = LOOP_LEAD_IN_SECONDS;
      }
    };

    const handleError = () => {
      setUsePosterFallback(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("error", handleError);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          primePlayback();
        } else {
          video.pause();
        }
      },
      { threshold: 0.05 },
    );

    observer.observe(container);
    primePlayback();

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("error", handleError);
      observer.disconnect();
    };
  }, [prefersReducedMotion, usePosterFallback]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {prefersReducedMotion || usePosterFallback ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={HERO_POSTER}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[50%_22%] sm:object-[50%_38%] md:object-[50%_42%]"
        />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-[50%_22%] sm:object-[50%_38%] md:object-[50%_42%]"
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          controls={false}
          preload="auto"
          poster={HERO_POSTER}
          aria-hidden
          tabIndex={-1}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
