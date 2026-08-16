"use client";

import { useEffect, useRef, useState } from "react";

import {
  UNIT311_CENTRAL_HOMEPAGE_HERO_POSTER_SRC,
  UNIT311_CENTRAL_HOMEPAGE_HERO_VIDEO_SRC,
} from "@/lib/unit311-central-homepage-video";

const HERO_VIDEO = UNIT311_CENTRAL_HOMEPAGE_HERO_VIDEO_SRC;
const HERO_POSTER = UNIT311_CENTRAL_HOMEPAGE_HERO_POSTER_SRC;
const PLAYBACK_RATE = 0.8;
const LOOP_LEAD_IN_SECONDS = 0.05;
const LOOP_TRIM_SECONDS = 0.12;

const HERO_GRADIENT =
  "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(37, 99, 235, 0.22), transparent 70%), #020617";

export default function HeroVideoBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(media.matches);

    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const primePlayback = () => {
      video.muted = true;
      video.volume = 0;
      video.playbackRate = PLAYBACK_RATE;
      void video.play().catch(() => {});
    };

    const markReady = () => {
      setVideoReady(true);
      setVideoFailed(false);
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
      setVideoFailed(true);
      setVideoReady(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", markReady);
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
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("error", handleError);
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  const showPoster = prefersReducedMotion || videoFailed;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#020617]"
      aria-hidden
    >
      <div className="absolute inset-0" style={{ background: HERO_GRADIENT }} />

      {/* Poster stays visible until video frames are ready — avoids a blank dark hero. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_POSTER}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover object-[50%_42%] transition-opacity duration-500 ${
          showPoster || !videoReady ? "opacity-100" : "opacity-0"
        }`}
        fetchPriority="high"
      />

      {!prefersReducedMotion && !videoFailed ? (
        <video
          ref={videoRef}
          src={HERO_VIDEO}
          poster={HERO_POSTER}
          className={`absolute inset-0 h-full w-full object-cover object-[50%_42%] transition-opacity duration-500 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          controls={false}
          preload="auto"
          // @ts-expect-error fetchPriority is valid on video in modern browsers
          fetchPriority="high"
          aria-hidden
          tabIndex={-1}
        />
      ) : null}
    </div>
  );
}
