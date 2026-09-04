export const WOLF_BCN_QUESTIONS_WORK_PACKAGE = {
  packageCode: "WP2",
  name: "WP2 – Questions for BCN",
  description:
    "Structured questionnaire for BCN video handling, streaming, and ground-control integration.",
} as const;

export const WOLF_BCN_VIDEO_HANDLING_QUESTIONS = [
  "Does BCN Base decode compressed video?",
  "Does the station pass the compressed video stream through without decoding it?",
  "Does station re-encode video into another codec, bitrate or stream format?",
  "Does base make video available as an IP/Network video stream on the BCN Ethernet network?",
  "Other?",
  "Can WOLF obtain a simultaneous low-latency copy of the video received by the BCN Base station without interfering with the BCN control system?",
  "What protocol does the BCN base station use to make the video available to BCN Laptops?",
  "Can your Windows ground-control software provide the live video received from the base station to a third-party application or network destination simultaneously with displaying it to the operator? If so, how?",
  "Frame rate / quality?",
] as const;

export const WOLF_BCN_VIDEO_HANDLING_CATEGORY = "VIDEO HANDLING";
