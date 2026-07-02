import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "docs");
const outputFile = path.join(outputDir, "Matrice-4T-D-RTK3-Data-Architecture.docx");

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: [new TextRun({ text, size: 22 })],
  });
}

function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function linkPara(label, url) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new ExternalHyperlink({
        link: url,
        children: [new TextRun({ text: label, style: "Hyperlink", size: 22 })],
      }),
    ],
  });
}

function table(headers, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (text) =>
        new TableCell({
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
        }),
    ),
  });

  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (text) =>
            new TableCell({
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

const doc = new Document({
  creator: "Drone Catalyst",
  title: "Matrice 4T + D-RTK 3 Data Architecture",
  description:
    "Inventory of telemetry, positioning, sensor, and media data available from DJI Matrice 4T with D-RTK 3 base station.",
  sections: [
    {
      properties: {},
      children: [
        heading("Matrice 4T + D-RTK 3 — Data & Architecture Reference"),
        para(
          "Prepared for Drone Catalyst · Survey Operations / FlightHub integration planning · June 2026",
        ),
        para(
          "This document inventories the data types available from a DJI Matrice 4T aircraft with a D-RTK 3 multifunctional base station, as delivered through DJI Pilot 2, FlightHub 2, and the DJI Cloud API. It contrasts this real-world stack with the current Drone Catalyst /testflighthub sandbox API.",
        ),

        heading("1. How data reaches your platform", HeadingLevel.HEADING_2),
        table(
          ["Channel", "Protocol", "Rate", "Typical use"],
          [
            ["OSD telemetry", "MQTT thing/product/{device_sn}/osd", "~0.5 Hz (every 2s)", "Live position, battery, cameras, RTK state"],
            ["State events", "MQTT thing/product/{device_sn}/state", "Event-driven", "Mode changes, errors, config updates"],
            ["FlightHub 2 REST API", "HTTPS OpenAPI", "On demand", "Device list, commands, media, HMS, RTK calibration"],
            ["Live video", "RTMP / WebRTC / GB28181", "Continuous", "Pilot view (not raw sensor pixels)"],
            ["Media files", "Cloud upload / SD export", "Per capture", "Photos, R-JPEG thermal, MP4, flight logs"],
            ["D-RTK 3 corrections", "Radio RTCM to aircraft", "Continuous", "Centimeter positioning"],
            ["D-RTK 3 raw logs", "USB export .DAT", "Logged locally", "PPK in DJI Terra / RINEX conversion"],
          ],
        ),
        para("Setup path: DJI Pilot 2 → Cloud Services → your platform URL + MQTT broker."),

        heading("2. Position, navigation & flight path (aircraft OSD)", HeadingLevel.HEADING_2),
        para(
          "These fields build a flight path when stored as a time series. Flight path = ordered (latitude, longitude, timestamp) points.",
        ),
        table(
          ["Field", "Description"],
          [
            ["latitude / longitude", "WGS84 coordinates"],
            ["height", "Height above takeoff point (m)"],
            ["elevation", "Ellipsoid / AMSL-related elevation"],
            ["horizontal_speed / vertical_speed", "Ground and vertical velocity"],
            ["attitude_head / pitch / roll", "Aircraft orientation (°)"],
            ["home_latitude / home_longitude / home_distance", "Home point and distance to home"],
            ["track_id", "Current flight/track identifier"],
            ["total_flight_distance / time / sorties", "Lifetime flight statistics"],
          ],
        ),

        heading("3. RTK / GNSS state (D-RTK 3 effect on aircraft)", HeadingLevel.HEADING_2),
        para(
          "The D-RTK 3 base broadcasts RTCM corrections. The Matrice 4T reports fix quality via position_state in OSD.",
        ),
        table(
          ["Field", "Description"],
          [
            ["position_state.gps_number", "GPS satellites tracked"],
            ["position_state.rtk_number", "RTK satellites used"],
            ["position_state.is_fixed", "not_started / fixing / fixing_successful / fixing_failed"],
            ["position_state.quality", "gear_1 … gear_5 or rtk_fixed"],
            ["mode_code", "Includes airborne_rtk_fixing_mode"],
          ],
        ),
        heading("D-RTK 3 base station data products", HeadingLevel.HEADING_3),
        table(
          ["Mode", "Data product", "Typical accuracy"],
          [
            ["Base station (broadcast)", "RTCM 3.x corrections to multiple aircraft", "Relative cm-level to base"],
            ["Uncalibrated base", "Single-point positioning", "~1.5 m H / 3.0 m V RMS"],
            ["Satellite differential", "After ~20 min convergence", "~30 cm H / 40 cm V RMS"],
            ["Network RTK calibrated", "NTRIP or surveyed coordinates", "~1 cm H / 3 cm V + 1 ppm"],
            ["Raw observation log", "RTCM 3.2 .DAT files", "PPK in DJI Terra"],
            ["Rover mode", "Survey points", "JSON mark file / CSV checkpoints"],
            ["Relay mode", "O4 Enterprise radio relay", "Link reliability (not positioning)"],
          ],
        ),

        heading("4. Flight status & safety", HeadingLevel.HEADING_2),
        bullet("mode_code — standby, manual flight, wayline, RTH, landing, tracking, POI, etc."),
        bullet("mode_code_reason — low battery, RC lost, obstacle on RTH, hardware fault, etc."),
        bullet("gear, locked, rc_lost_action, rth_altitude, rth_mode, current_rth_mode"),
        bullet("commander_flight_mode / height / lost_action"),
        bullet("distance_limit_status — max distance, near-limit flag, enabled state"),
        bullet("height_limit, is_near_height_limit, is_near_area_limit, geo_caging_status"),
        bullet("obstacle_avoidance — horizon / upside / downside sensing on/off"),
        bullet("night_lights_state, wind_speed, wind_direction"),
        bullet("low_battery_warning_threshold, serious_low_battery_warning_threshold"),

        heading("5. Battery & power", HeadingLevel.HEADING_2),
        table(
          ["Field", "Description"],
          [
            ["battery.capacity_percent", "Total remaining %"],
            ["battery.remain_flight_time", "Estimated seconds left"],
            ["battery.return_home_power", "RTH trigger %"],
            ["battery.landing_power", "Forced landing %"],
            ["battery.batteries[]", "Per-battery: index, sn, capacity_percent, voltage (mV), temperature (°C), loop_times, firmware_version, high_voltage_storage_days"],
          ],
        ),

        heading("6. Device identity, storage & maintenance", HeadingLevel.HEADING_2),
        bullet("activation_time, firmware_version, firmware_upgrade_status, compatible_status"),
        bullet("control_source — RC / app / cloud control owner"),
        bullet("storage.total / storage.used — onboard storage (KB)"),
        bullet("maintain_status.maintain_status_array[] — maintenance history and due state"),
        bullet("offline_map_enable"),

        heading("7. Payload & gimbal", HeadingLevel.HEADING_2),
        table(
          ["Field", "Description"],
          [
            ["payloads[]", "payload_index, sn, firmware_version, control_source"],
            ["type_subtype_gimbalindex", "gimbal_pitch, gimbal_roll, gimbal_yaw, zoom_factor"],
          ],
        ),

        heading("8. Matrice 4T camera / sensor telemetry (cameras[])", HeadingLevel.HEADING_2),
        para(
          "The M4T integrates wide + medium tele + telephoto + thermal + laser rangefinder. OSD provides status and settings, not full pixel streams.",
        ),
        heading("Common per-camera fields", HeadingLevel.HEADING_3),
        bullet("camera_mode, photo_state, recording_state, record_time"),
        bullet("remain_photo_num, remain_record_duration, liveview_world_region, screen_split_enable"),

        heading("Wide-angle camera", HeadingLevel.HEADING_3),
        bullet("wide_exposure_mode, wide_exposure_value, wide_iso, wide_shutter_speed"),

        heading("Zoom / telephoto camera", HeadingLevel.HEADING_3),
        bullet("zoom_factor, zoom_exposure_mode, zoom_exposure_value, zoom_iso, zoom_shutter_speed"),
        bullet("zoom_focus_mode, zoom_focus_state, zoom_focus_value, zoom_calibrate_*"),

        heading("Thermal (M4T-specific)", HeadingLevel.HEADING_3),
        table(
          ["Field", "Description"],
          [
            ["ir_zoom_factor", "Thermal zoom ratio"],
            ["ir_metering_mode", "Off / spot / area temperature measurement"],
            ["ir_metering_point", "x, y (0–1), temperature (°C)"],
            ["ir_metering_area", "ROI bounds, aver_temperature, min/max temperature points"],
          ],
        ),
        para(
          "Hardware thermal specs: 640×512 VOx, high gain −20°C to 150°C, low gain 0°C to 550°C, ±2°C or ±2% accuracy, R-JPEG radiometric photos.",
        ),

        heading("Laser rangefinder (M4T hardware)", HeadingLevel.HEADING_3),
        para(
          "Hardware: range up to 1800 m, accuracy ±(0.2 + 0.0015×D) m. Not a dedicated continuous OSD field in the Matrice 4 Series schema; target distance/GPS coordinates appear in capture metadata and Pilot UI.",
        ),

        heading("9. Connectivity & accessories", HeadingLevel.HEADING_2),
        bullet("dongle_infos[] — IMEI, EID, SIM/eSIM state, carrier, ICCID"),
        bullet("camera_watermark_settings — datetime, SN, GPS, custom text overlay toggles and layout"),

        heading("10. Other data types (full stack)", HeadingLevel.HEADING_2),
        table(
          ["Type", "Examples"],
          [
            ["HMS health messages", "Motor, compass, IMU, RTK, battery warnings"],
            ["Live video metadata", "Stream ID, quality, error status (live_status[])"],
            ["Media files", "Wide/tele JPG, R-JPEG thermal, MP4, SRT sidecars"],
            ["Flight logs", "DJI flight records from aircraft storage"],
            ["Wayline / mission", "KMZ/WPMZ missions, progress events"],
            ["PPK / RTK post-process", "D-RTK .DAT → Terra → refined image positions"],
            ["Survey outputs (D-RTK rover)", "GCP mark JSON, checkpoint CSV"],
          ],
        ),

        heading("11. What Matrice 4T does NOT provide", HeadingLevel.HEADING_2),
        bullet("LiDAR point clouds — no Zenmuse L2/L3; fixed payload only"),
        bullet("Interchangeable H30T payload — H30T is for M350/M400, not M4T"),
        bullet("Full thermal frame over MQTT — only spot/area temps + files on capture"),
        bullet("Raw RTCM stream in FlightHub OSD — corrections are radio-side; aircraft reports fix state"),
        bullet("Continuous laser range in standard OSD schema"),

        heading("12. Comparison: Drone Catalyst sandbox vs real stack", HeadingLevel.HEADING_2),
        para("Current /testflighthub API persists 10 fields per telemetry tick:"),
        bullet("drone_id, timestamp, latitude, longitude, altitude, speed, battery, status"),
        bullet("Plus DB metadata: id, created_at"),
        para(
          "A real Matrice 4T + D-RTK 3 + FlightHub 2 integration exposes 100+ distinct telemetry properties across OSD/state, plus separate media and log channels — including RTK quality, dual batteries, thermal spot temps, gimbal attitude, wind, obstacle sensing, and mode/reason codes.",
        ),

        heading("13. References", HeadingLevel.HEADING_2),
        linkPara("DJI Matrice 4 Series specs", "https://enterprise.dji.com/matrice-4-series/specs"),
        linkPara("DJI D-RTK 3 specs", "https://enterprise.dji.com/d-rtk-3/specs"),
        linkPara(
          "FlightHub 2 — Matrice 4 Series OpenAPI schema",
          "https://fh2-api-en.apifox.cn/schema-148437428",
        ),
        linkPara(
          "DJI Cloud API — device properties & telemetry",
          "https://deepwiki.com/dji-sdk/Cloud-API-Doc/4.2-device-properties-and-telemetry",
        ),
        linkPara("Drone Catalyst test environment", "https://dronecatalyst.com/testflighthub"),
      ],
    },
  ],
});

fs.mkdirSync(outputDir, { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outputFile, buffer);
console.log(`Created: ${outputFile}`);
