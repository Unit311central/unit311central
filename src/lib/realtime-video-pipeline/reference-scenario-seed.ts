import { RF_10KM_PROPAGATION_MS } from "@/lib/realtime-video-pipeline/constants";
import type {
  PathKind,
  PipelineMilestone,
  PipelineSection,
  ScenarioConfig,
  StageDetails,
} from "@/lib/realtime-video-pipeline/types";

export type ReferenceStageSeed = {
  pipelineSection: PipelineSection;
  component: string;
  whatHappens: string;
  detailedDescription: string;
  measurementStatus?: "TBD" | "Calculated";
  source?: string;
  sourceType?: "" | "Calculated";
  confidence?: "Unknown" | "High";
  pathKind?: PathKind;
  milestone?: PipelineMilestone;
  parallel?: boolean;
  branchGroup?: string;
  transmissionMs?: number | null;
  processingMs?: number | null;
  details?: StageDetails;
};

export const REFERENCE_SCENARIO_NAME = "Reference Drone-to-WOLF AI Pipeline";

export const REFERENCE_SCENARIO_DESCRIPTION =
  "Reference Scenario — Drone → HQ → London WOLF (eu-west-2) → HQ Browser. Engineering model for end-to-end latency; replace estimates with measurements.";

export const REFERENCE_SCENARIO_CONFIG: ScenarioConfig = {
  droneModel: "TBD",
  camera: "TBD",
  videoCodec: "TBD",
  resolution: "TBD",
  fps: null,
  bitrateMbps: null,
  droneDistanceKm: 10,
  hqLocation: "TBD",
  hqInternetUploadMbps: null,
  hqInternetDownloadMbps: null,
  cloudProvider: "TBD",
  cloudRegion: "eu-west-2",
  videoProvider: "TBD",
  aiProvider: "TBD",
  aiGpu: "TBD",
  aiModel: "TBD",
  browser: "Chrome",
};

const rfPropagationDetails: StageDetails = {
  dataType: "RF waveform",
  connectionType: "RF",
  distance: 10,
  distanceUnit: "km",
  propagationMedium: "Air",
  propagationTimeMs: RF_10KM_PROPAGATION_MS,
};

export const REFERENCE_PIPELINE_STAGES: ReferenceStageSeed[] = [
  {
    pipelineSection: "Drone",
    component: "Optical scene",
    whatHappens: "Real-world photons from the operational scene enter the camera optical path.",
    detailedDescription:
      "The scene imaged by the drone camera — terrain, vegetation, and animals — exists before any electronic processing. Latency modelling starts at effective exposure/capture (T0).",
    milestone: "capture",
    pathKind: "shared",
  },
  {
    pipelineSection: "Drone",
    component: "Camera lens",
    whatHappens: "Lens focuses incoming light onto the image sensor plane.",
    detailedDescription:
      "Optical elements (fixed or gimbal-stabilised) determine field of view and focus. Glass/plastic path adds negligible electronic latency but affects exposure time selection.",
    pathKind: "shared",
  },
  {
    pipelineSection: "Drone",
    component: "CMOS image sensor",
    whatHappens: "CMOS sensor integrates photons into per-pixel analogue values during exposure.",
    detailedDescription:
      "Rolling or global shutter readout converts the optical image into raw sensor data. Exposure time, gain, and readout mode affect frame period and capture-to-readout latency. Hardware not yet selected — values TBD.",
    details: { dataType: "Raw pixels", memoryType: "SRAM" },
    pathKind: "shared",
  },
  {
    pipelineSection: "Drone",
    component: "Sensor readout",
    whatHappens: "Pixel values are read from the sensor array into the camera ISP pipeline.",
    detailedDescription:
      "Serial or parallel readout from the CMOS array through MIPI or parallel bus. Readout duration depends on resolution, interface bandwidth, and sensor architecture.",
    details: { connectionType: "MIPI", dataType: "Raw pixels" },
    pathKind: "shared",
  },
  {
    pipelineSection: "Drone",
    component: "Camera ISP",
    whatHappens: "In-sensor or companion ISP applies demosaic, white balance, tone mapping, and noise reduction.",
    detailedDescription:
      "Image Signal Processing converts raw Bayer (or equivalent) data into YUV/RGB suitable for encoding. May run on dedicated ISP silicon or flight computer GPU — hardware TBD.",
    details: { dataType: "Processed pixels" },
    pathKind: "shared",
  },
  {
    pipelineSection: "Drone",
    component: "Camera-to-compute interface",
    whatHappens: "Processed frames move from camera module to flight computer over a high-speed link.",
    detailedDescription:
      "Typically MIPI CSI-2, USB3 Vision, or Ethernet depending on payload architecture. Buffering may occur at the receiver DMA.",
    details: { connectionType: "MIPI", streamingProtocol: "N/A" },
    pathKind: "shared",
  },
  {
    pipelineSection: "Drone",
    component: "Video encoder",
    whatHappens: "Flight computer encodes video frames into H.264/H.265 (or other) compressed bitstream.",
    detailedDescription:
      "Hardware or software encoder on the drone flight computer. Codec, resolution, GOP structure, and bitrate drive encoding latency and quality. Codec selection TBD.",
    details: { codec: "TBD", dataType: "Compressed video" },
    pathKind: "video",
  },
  {
    pipelineSection: "Drone",
    component: "Encoder buffer",
    whatHappens: "Encoded access units are queued before packetisation and RF transmission.",
    detailedDescription:
      "Encoder output buffer absorbs bitrate variability and radio scheduling. Buffer depth directly adds end-to-end latency if not tuned for low-latency operation.",
    details: { memoryType: "DRAM", persistentStorage: false },
    pathKind: "video",
  },
  {
    pipelineSection: "Drone",
    component: "Video packetisation",
    whatHappens: "Compressed video is split into transport packets with headers and sequence numbers.",
    detailedDescription:
      "May use RTP encapsulation, proprietary framing, or modem-specific PDU format prior to RF transmission.",
    details: { dataType: "Digital packets", transportProtocol: "TBD" },
    pathKind: "video",
  },
  {
    pipelineSection: "Drone",
    component: "Radio modem",
    whatHappens: "Modem prepares baseband waveforms for over-the-air transmission.",
    detailedDescription:
      "Modulation, FEC encoding, interleaving, and transmit scheduling. Protocol and latency depend on selected datalink (TBD).",
    details: { connectionType: "RF", dataType: "Digital packets" },
    pathKind: "video",
  },
  {
    pipelineSection: "Drone",
    component: "RF transmitter",
    whatHappens: "RF power amplifier drives the modulated signal to the drone antenna.",
    detailedDescription:
      "Analog RF chain including PA linearity, filtering, and transmit power control. Adds minimal digital latency relative to encoding and link scheduling.",
    details: { connectionType: "RF" },
    pathKind: "video",
  },
  {
    pipelineSection: "Drone",
    component: "Drone antenna",
    whatHappens: "Electromagnetic energy radiates from the drone toward the ground station.",
    detailedDescription:
      "Antenna pattern, polarisation, and mounting affect link budget. Propagation delay is modelled separately.",
    details: { connectionType: "RF", propagationMedium: "Air" },
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "RF propagation",
    whatHappens: "Electromagnetic wave travels through air from drone to HQ ground antenna.",
    detailedDescription:
      "Free-space propagation delay for 10 km at speed of light (c ≈ 299,792,458 m/s). This is propagation time only — not total RF link latency (modem, FEC, retransmission, etc.).",
    measurementStatus: "Calculated",
    source: "Distance / speed-of-light calculation (10 km)",
    sourceType: "Calculated",
    confidence: "High",
    transmissionMs: RF_10KM_PROPAGATION_MS,
    details: rfPropagationDetails,
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "Ground antenna",
    whatHappens: "HQ directional or omnidirectional antenna receives the RF signal.",
    detailedDescription:
      "Ground segment antenna subsystem including tracking if required. Hardware TBD.",
    details: { connectionType: "RF" },
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "RF receiver",
    whatHappens: "Low-noise amplifier and downconverter bring signal to baseband.",
    detailedDescription:
      "RF front-end sensitivity and AGC affect lock time and effective receive latency.",
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "RF front end",
    whatHappens: "Analog RF conditioning before digitisation.",
    detailedDescription:
      "Filtering, amplification, and mixing stages in the ground receiver chain.",
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "ADC",
    whatHappens: "Analog RF/baseband signal is sampled and converted to digital samples.",
    detailedDescription:
      "Analog-to-digital conversion for demodulation pipeline input.",
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "Demodulator",
    whatHappens: "Digital demodulation recovers symbols from the received waveform.",
    detailedDescription:
      "Demodulation, timing recovery, and carrier tracking. Latency depends on modem implementation (TBD).",
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "Error correction",
    whatHappens: "Forward error correction decodes protected payload bits.",
    detailedDescription:
      "FEC decoding may require block assembly before release to upper layers, adding buffering latency.",
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "Packet reconstruction",
    whatHappens: "Transport packets are reassembled in sequence order.",
    detailedDescription:
      "Handles out-of-order delivery and missing packets per link protocol. Retransmission (if any) adds latency — policy TBD.",
    details: { dataType: "Digital packets" },
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "Video stream reconstruction",
    whatHappens: "Compressed video access units are rebuilt from payload data.",
    detailedDescription:
      "NAL unit or frame assembly prior to decoder input. May wait for reference frames (GOP dependency).",
    details: { dataType: "H.265 bitstream", codec: "TBD" },
    pathKind: "video",
  },
  {
    pipelineSection: "RF Transmission",
    component: "Video decoder",
    whatHappens: "Ground station decodes compressed video to raw or semi-processed frames.",
    detailedDescription:
      "Hardware or software decoder at HQ ground segment. Output feeds ground-station video output and network ingress.",
    details: { codec: "TBD", dataType: "Processed pixels" },
    pathKind: "video",
  },
  {
    pipelineSection: "HQ Ground Station",
    component: "Ground-station video output",
    whatHappens: "Decoded video is available on the ground-station output interface.",
    detailedDescription:
      "Frame synchronisation and format conversion (e.g. to SDI, HDMI, or raw memory buffer) at HQ receiver.",
    pathKind: "video",
  },
  {
    pipelineSection: "HQ Ground Station",
    component: "Network interface",
    whatHappens: "Ground station attaches decoded or relayed stream to HQ LAN.",
    detailedDescription:
      "Ethernet NIC or equivalent connects receiver appliance to HQ network.",
    details: { connectionType: "Ethernet" },
    pathKind: "video",
  },
  {
    pipelineSection: "HQ Network",
    component: "Ethernet switch/router",
    whatHappens: "HQ LAN switching forwards video stream toward Internet uplink.",
    detailedDescription:
      "Local L2/L3 switching, VLANs, and QoS policies at HQ. Configuration TBD.",
    details: { connectionType: "Ethernet" },
    pathKind: "video",
  },
  {
    pipelineSection: "HQ Network",
    component: "HQ Internet uplink",
    whatHappens: "Video (or relayed stream) egresses HQ toward the public Internet or private link.",
    detailedDescription:
      "Upload bandwidth, routing, and last-mile technology (fibre, 5G, Starlink, etc.) TBD. Not assumed to be HTTPS — actual streaming protocol selected separately.",
    details: { connectionType: "TBD", uploadMbps: null },
    pathKind: "video",
  },
  {
    pipelineSection: "Internet",
    component: "Internet WAN Routing (Reserve → Cloud)",
    whatHappens: "IP packets traverse ISP, peering, and backbone networks toward the cloud region.",
    detailedDescription:
      "BGP routing, peering, and geographic path from reserve/HQ uplink to cloud region (eu-west-2 target). RTT, jitter, and packet loss TBD per field measurements.",
    details: {
      connectionType: "Public Internet",
      propagationMedium: "Fibre",
      location: "INTERNET / WAN",
      provider: "TBD",
      technology: "BGP-routed IP transport",
      architectureStatus: "Reference Architecture",
      inputDescription: "Video packets from park/reserve uplink",
      outputDescription: "Video packets at cloud region edge",
    },
    pathKind: "video",
  },
  {
    pipelineSection: "Cloud Video Ingest",
    component: "Cloud Video Ingestion Service",
    whatHappens: "Cloud network edge receives the inbound live video stream from the reserve uplink.",
    detailedDescription:
      "Regional cloud ingress endpoint (target eu-west-2). Provider and product not yet selected — separate from Vercel WOLF application hosting.",
    details: {
      provider: "TBD / Reference Architecture",
      region: "eu-west-2",
      managed: true,
      location: "CLOUD",
      technology: "Video streaming / ingestion service",
      architectureStatus: "Architecture Decision Required",
      inputDescription: "Live compressed video stream from Internet/WAN",
      outputDescription: "Authenticated media stream to cloud media plane",
      streamingProtocol: "TBD (SRT / RTSP / WebRTC / proprietary)",
    },
    pathKind: "video",
  },
  {
    pipelineSection: "Cloud Video Ingest",
    component: "Cloud Network Edge & Security Perimeter",
    whatHappens: "Traffic enters managed cloud network boundary and security controls.",
    detailedDescription:
      "Edge firewall, DDoS protection, and routing into video ingest VPC. Provider TBD.",
    details: {
      provider: "TBD / Reference Architecture",
      region: "eu-west-2",
      managed: true,
      location: "CLOUD",
      technology: "Edge firewall / DDoS / routing",
      architectureStatus: "Architecture Decision Required",
    },
    pathKind: "video",
  },
  {
    pipelineSection: "Cloud Video Ingest",
    component: "Ingest Load Balancer",
    whatHappens: "Distributes inbound stream connections to ingest receivers.",
    detailedDescription:
      "Layer-4/7 load balancing for SRT/WebRTC/RTSP ingest endpoints as selected.",
    details: {
      provider: "TBD / Reference Architecture",
      managed: true,
      location: "CLOUD",
      technology: "L4/L7 load balancer",
      architectureStatus: "Architecture Decision Required",
    },
    pathKind: "video",
  },
  {
    pipelineSection: "Cloud Video Ingest",
    component: "Live Stream Ingest Endpoint",
    whatHappens: "Managed service accepts the live video stream from the reserve uplink.",
    detailedDescription:
      "Authentication, stream handshake, and initial buffering at ingest. Protocol (SRT, RTSP, WebRTC, proprietary) TBD.",
    details: {
      streamingProtocol: "TBD",
      managedServiceName: "TBD",
      managed: true,
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Managed live ingest endpoint",
      architectureStatus: "Architecture Decision Required",
    },
    pathKind: "video",
  },
  {
    pipelineSection: "Cloud Video Ingest",
    component: "Ingest Stream Receiver & Jitter Buffer",
    whatHappens: "Ingest service buffers and validates incoming media packets.",
    detailedDescription:
      "Jitter buffer at ingest — significant latency contributor if tuned for resilience over latency.",
    details: {
      bufferTimeMs: null,
      managed: true,
      location: "CLOUD",
      technology: "Ingest receiver with jitter buffer",
      architectureStatus: "Reference Architecture",
    },
    pathKind: "video",
  },
  {
    pipelineSection: "Cloud Media Processing",
    component: "Stream Normalisation & Clock Sync",
    whatHappens: "Normalisation, timestamping, and routing of the live stream inside cloud media plane.",
    detailedDescription:
      "Demux, clock synchronisation, and fan-out to human viewing and AI branches.",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Media normalisation / timestamping",
      architectureStatus: "Reference Architecture",
    },
    pathKind: "shared",
  },
  {
    pipelineSection: "Cloud Media Processing",
    component: "Cloud Media Processing Service",
    whatHappens: "Cloud media pipeline processes stream for distribution and AI input.",
    detailedDescription:
      "May include transrating, keyframe alignment, or format normalisation. Processing latency TBD.",
    details: {
      managed: true,
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Live media processing / transrating",
      architectureStatus: "Reference Architecture",
    },
    pathKind: "shared",
  },
  {
    pipelineSection: "Cloud Media Processing",
    component: "Transcoding / repackaging",
    whatHappens: "Optional transcode or repackage for WebRTC/SFU consumers and AI input format.",
    detailedDescription:
      "Only applicable if ingest codec/format differs from downstream consumers. Skipped if not required.",
    details: { codec: "TBD", managed: true },
    pathKind: "video",
  },
  {
    pipelineSection: "Cloud Media Processing",
    component: "Live Media Distribution (SFU)",
    whatHappens: "SFU or media server distributes live video toward WebRTC and AI input router.",
    detailedDescription:
      "Branch point: human viewing path (WebRTC) and AI pipeline path run in parallel from here.",
    details: {
      streamingProtocol: "WebRTC",
      managed: true,
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Selective Forwarding Unit (WebRTC SFU)",
      architectureStatus: "Architecture Decision Required",
    },
    pathKind: "video",
    parallel: true,
    branchGroup: "post-ingest-fanout",
  },
  {
    pipelineSection: "Cloud Media Processing",
    component: "WebRTC gateway",
    whatHappens: "Managed WebRTC gateway prepares streams for browser subscribers.",
    detailedDescription:
      "Signalling, ICE, SRTP — human viewing path. Does not route through Vercel Next.js server.",
    details: { streamingProtocol: "WebRTC", managed: true },
    pathKind: "video",
    branchGroup: "human-viewing",
  },
  {
    pipelineSection: "AI Infrastructure",
    component: "AI input router",
    whatHappens: "Routes video frames or chunks to managed GPU inference endpoint.",
    detailedDescription:
      "Separate path from browser delivery. May sample frames or receive parallel stream from media distribution.",
    details: { dataType: "Compressed video", managed: true },
    pathKind: "ai",
    branchGroup: "ai-pipeline",
  },
  {
    pipelineSection: "AI Infrastructure",
    component: "GPU Inference Queue",
    whatHappens: "Frames wait in GPU inference queue when compute is saturated.",
    detailedDescription:
      "Queue depth and scheduling policy on managed GPU service. Provider TBD.",
    details: {
      queueDepth: null,
      managed: true,
      location: "CLOUD",
      technology: "GPU work queue / scheduler",
      architectureStatus: "Reference Architecture",
    },
    pathKind: "ai",
    branchGroup: "ai-pipeline",
  },
  {
    pipelineSection: "AI Infrastructure",
    component: "Managed GPU Inference Service",
    whatHappens: "Managed GPU executes vision models on incoming video frames.",
    detailedDescription:
      "GPU provider, model, and runtime TBD (managed GPU service — not hard-coded to a specific vendor).",
    details: {
      gpuProvider: "TBD / Reference Architecture",
      gpuModel: "TBD",
      aiRuntime: "TBD",
      managed: true,
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Managed GPU inference runtime",
      architectureStatus: "Architecture Decision Required",
    },
    pathKind: "ai",
    branchGroup: "ai-pipeline",
  },
  {
    pipelineSection: "AI Detection",
    component: "Animal detector",
    whatHappens: "Object detection model identifies animals in the video frame.",
    detailedDescription:
      "Bounding boxes, class labels, and confidence scores. Model name/version TBD.",
    details: { modelType: "Object Detection", aiModel: "TBD" },
    pathKind: "ai",
    milestone: "ai_detection",
    branchGroup: "ai-pipeline",
  },
  {
    pipelineSection: "AI Detection",
    component: "Animal tracker",
    whatHappens: "Multi-frame tracking associates detections across time.",
    detailedDescription:
      "Maintains track IDs for consistent overlay rendering. Algorithm TBD.",
    details: { modelType: "Object Tracking" },
    pathKind: "ai",
    branchGroup: "ai-pipeline",
  },
  {
    pipelineSection: "AI Identification",
    component: "Individual animal Re-ID",
    whatHappens: "Re-identification model assigns individual animal identity (e.g. Zebra #037).",
    detailedDescription:
      "Separate from detection latency category. Outputs identity label and confidence — e.g. Zebra #037 at 96.8% confidence.",
    details: { modelType: "Re-Identification", aiModel: "TBD" },
    pathKind: "ai",
    milestone: "ai_identification",
    branchGroup: "ai-pipeline",
  },
  {
    pipelineSection: "AI Identification",
    component: "Detection result processing",
    whatHappens: "AI pipeline normalises detection and identity results for downstream services.",
    detailedDescription:
      "Format conversion, filtering, and enrichment of AI outputs before API publish.",
    details: { dataType: "AI detection event" },
    pathKind: "ai",
  },
  {
    pipelineSection: "AI Identification",
    component: "AI event generation",
    whatHappens: "Structured AI events created with timestamps and metadata.",
    detailedDescription:
      "Events include bounding box coordinates, animal count, identity, confidence, and frame reference for sync.",
    details: { dataType: "AI identity event" },
    pathKind: "metadata",
  },
  {
    pipelineSection: "WOLF Backend",
    component: "WOLF Application API",
    whatHappens: "WOLF backend API receives AI results (not the full video stream).",
    detailedDescription:
      "Application/API layer — Vercel-hosted Next.js API routes for WOLF workspace. Carries metadata and control, not live video bytes.",
    details: {
      streamingProtocol: "HTTPS",
      connectionType: "Public Internet",
      location: "WOLF PLATFORM",
      provider: "Unit311 / Vercel (application hosting)",
      technology: "HTTPS REST / application API",
      architectureStatus: "Reference Architecture",
      inputDescription: "AI events and control/metadata",
      outputDescription: "Persisted records and realtime fan-out triggers",
    },
    pathKind: "metadata",
  },
  {
    pipelineSection: "WOLF Backend",
    component: "WOLF Realtime Event Service",
    whatHappens: "Real-time channel pushes AI overlay data to connected browsers.",
    detailedDescription:
      "WebSocket, WebRTC data channel, or SSE — protocol TBD. Separate from video SFU path.",
    details: {
      dataType: "JSON",
      streamingProtocol: "TBD",
      location: "WOLF PLATFORM",
      provider: "TBD / Reference Architecture",
      technology: "WebSocket / SSE / WebRTC data channel (TBD)",
      architectureStatus: "Architecture Decision Required",
    },
    pathKind: "overlay",
  },
  {
    pipelineSection: "Database",
    component: "Supabase persistence",
    whatHappens: "Optional persistence of detection records, mission metadata, and historical events.",
    detailedDescription:
      "Supabase stores configuration and event history — NOT the full live video stream. Represent as separate data-event latency.",
    details: { dataType: "JSON", persistentStorage: true, managed: true },
    pathKind: "metadata",
  },
  {
    pipelineSection: "Browser Delivery",
    component: "Browser video delivery",
    whatHappens: "WebRTC media path delivers live video directly to Chrome.",
    detailedDescription:
      "Video does not transit the Vercel Next.js application server. Browser receives media from managed SFU/WebRTC infrastructure.",
    details: { streamingProtocol: "WebRTC", dataType: "WebRTC media" },
    pathKind: "video",
    branchGroup: "human-viewing",
  },
  {
    pipelineSection: "Browser Delivery",
    component: "Browser AI event delivery",
    whatHappens: "AI overlay metadata delivered to WOLF web client via realtime channel.",
    detailedDescription:
      "Bounding boxes, counts, identities, and confidence values — separate from video RTP path.",
    details: { dataType: "AI identity event" },
    pathKind: "overlay",
  },
  {
    pipelineSection: "Browser",
    component: "Laptop Wi-Fi",
    whatHappens: "Operator laptop receives video and metadata over HQ Wi-Fi.",
    detailedDescription:
      "Local wireless hop at HQ operations room. Latency and jitter TBD.",
    details: { connectionType: "Wi-Fi" },
    pathKind: "shared",
  },
  {
    pipelineSection: "Browser",
    component: "Chrome network stack",
    whatHappens: "Browser OS network layer delivers WebRTC and websocket traffic.",
    detailedDescription:
      "UDP/TCP/QUIC handling, ICE connectivity, and local socket buffers.",
    pathKind: "shared",
  },
  {
    pipelineSection: "Browser",
    component: "WebRTC receiver",
    whatHappens: "Chrome WebRTC stack receives and jitter-buffers incoming media.",
    detailedDescription:
      "Jitter buffer is a major latency contributor — must be modelled explicitly, not folded into decode.",
    details: { streamingProtocol: "WebRTC", bufferTimeMs: null },
    pathKind: "video",
  },
  {
    pipelineSection: "Browser",
    component: "Video decoder",
    whatHappens: "Browser decodes video frames for compositor display.",
    detailedDescription:
      "Hardware or software decode in Chrome. Codec matches WebRTC negotiated format.",
    details: { codec: "TBD" },
    pathKind: "video",
    milestone: "raw_video_visible",
  },
  {
    pipelineSection: "Browser",
    component: "Video frame buffering",
    whatHappens: "Compositor may hold frames for smooth playback vs. low latency trade-off.",
    detailedDescription:
      "Playback buffer policy in browser and WOLF client — often dominant latency source.",
    details: { bufferTimeMs: null },
    pathKind: "video",
  },
  {
    pipelineSection: "Browser",
    component: "AI overlay renderer",
    whatHappens: "WOLF client draws green bounding boxes, count, and identity labels on video canvas.",
    detailedDescription:
      "Overlay path synchronises AI metadata timestamps with displayed video frame. Critical for measuring AI annotated latency.",
    pathKind: "overlay",
    milestone: "ai_annotated",
  },
  {
    pipelineSection: "Browser",
    component: "GPU/browser rendering",
    whatHappens: "Composited video + overlay submitted to GPU for display.",
    detailedDescription:
      "Browser render pipeline and vsync alignment add display latency.",
    pathKind: "overlay",
  },
  {
    pipelineSection: "Browser",
    component: "Display",
    whatHappens: "Operator sees live video with AI overlay on screen.",
    detailedDescription:
      "End of human-visible path (T15). Panel response time may add additional ms — hardware TBD.",
    milestone: "operator_visible",
    pathKind: "overlay",
  },
];
