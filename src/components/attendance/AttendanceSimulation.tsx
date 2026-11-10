"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { ATTENDANCE_CAST } from "@/lib/attendance/cast";
import type { AttendanceDashboardRow } from "@/lib/attendance/service";
import {
  SIMULATION_DAY_MINUTES,
  SIMULATION_DAY_MS,
  SIMULATION_SCENARIOS,
  simulationBeatClock,
  simulationBeatKey,
  simulationBeatLabel,
  simulationBeatsForWeekday,
  type SimulationBeat,
} from "@/lib/attendance/simulation-script";
import { formatLondonDate, formatLondonTime, londonWallTimeToUtc, londonWeekDays } from "@/lib/attendance/time";
import { StatusPill } from "@/components/attendance/AttendanceDashboard";

type Phase = "idle" | "approach" | "present" | "register" | "success";

type LogEntry = {
  id: string;
  text: string;
  time: string;
  scenario: string;
};

type MiniDashboard = {
  kpis: {
    onSite: number;
    clockIns: number;
    missingClockOuts: number;
    lateArrivals: number;
    earlyDepartures: number;
  };
  rows: AttendanceDashboardRow[];
};

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SPEEDS = [1, 2, 5] as const;

export default function AttendanceSimulation() {
  const week = useMemo(() => londonWeekDays(new Date()), []);
  const [dayIndex, setDayIndex] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [playing, setPlaying] = useState(false);
  const [minutes, setMinutes] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [beat, setBeat] = useState<SimulationBeat | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [dashboard, setDashboard] = useState<MiniDashboard | null>(null);
  const [error, setError] = useState("");
  const [simulationId, setSimulationId] = useState("");

  const playingRef = useRef(false);
  const speedRef = useRef(speed);
  const dayRef = useRef(dayIndex);
  const minutesRef = useRef(0);
  const simRef = useRef(simulationId);
  const firedRef = useRef(new Set<string>());
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const postingRef = useRef(false);

  useEffect(() => {
    const id = crypto.randomUUID();
    simRef.current = id;
    setSimulationId(id);
  }, []);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    dayRef.current = dayIndex;
  }, [dayIndex]);
  useEffect(() => {
    simRef.current = simulationId;
  }, [simulationId]);

  const date = week[dayIndex] ?? week[0];
  const clock = simulationBeatClock({ employeeNumber: "", eventType: "IN", minute: Math.min(minutes, SIMULATION_DAY_MINUTES), scenario: "" });
  const member = beat ? ATTENDANCE_CAST.find((item) => item.employeeNumber === beat.employeeNumber) : null;

  async function refreshDashboard(atMinutes: number, isoDate: string) {
    const asOf = londonWallTimeToUtc(isoDate, simulationBeatClock({
      employeeNumber: "",
      eventType: "IN",
      minute: Math.min(atMinutes, SIMULATION_DAY_MINUTES),
      scenario: "",
    })).toISOString();
    const params = new URLSearchParams({ date: isoDate, asOf });
    const response = await fetch(`/api/attendance/dashboard?${params.toString()}`, { cache: "no-store" });
    const body = (await response.json()) as MiniDashboard & { error?: string };
    if (!response.ok) throw new Error(body.error || "Dashboard refresh failed.");
    setDashboard(body);
  }

  async function playBeat(next: SimulationBeat, isoDate: string) {
    const pace = Math.max(0.35, 1 / speedRef.current);
    setBeat(next);
    setPhase("approach");
    await wait(780 * pace);
    setPhase("present");
    await wait(560 * pace);
    setPhase("register");
    const timestamp = londonWallTimeToUtc(isoDate, simulationBeatClock(next)).toISOString();
    const response = await fetch("/api/attendance/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeNumber: next.employeeNumber,
        eventType: next.eventType,
        eventTimestamp: timestamp,
        source: "SIMULATED",
        simulationId: simRef.current,
      }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(body.error || "Unable to record the simulated event.");
    setPhase("success");
    setLog((current) => [
      {
        id: simulationBeatKey(next, isoDate),
        text: simulationBeatLabel(next),
        time: simulationBeatClock(next),
        scenario: next.scenario,
      },
      ...current,
    ].slice(0, 12));
    await refreshDashboard(next.minute, isoDate);
    await wait(700 * pace);
    setPhase("idle");
  }

  function stopLoop() {
    playingRef.current = false;
    setPlaying(false);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function startLoop() {
    if (playingRef.current || !simRef.current) return;
    playingRef.current = true;
    setPlaying(true);
    lastRef.current = performance.now();
    const tick = (now: number) => {
      if (!playingRef.current) return;
      const delta = now - lastRef.current;
      lastRef.current = now;
      const advance = delta * (SIMULATION_DAY_MINUTES / SIMULATION_DAY_MS) * speedRef.current;
      let nextMinutes = minutesRef.current + advance;
      let nextDay = dayRef.current;
      if (nextMinutes >= SIMULATION_DAY_MINUTES) {
        if (nextDay < 4) {
          nextMinutes = 0;
          nextDay += 1;
          dayRef.current = nextDay;
          setDayIndex(nextDay);
        } else {
          nextMinutes = SIMULATION_DAY_MINUTES;
          minutesRef.current = nextMinutes;
          setMinutes(nextMinutes);
          stopLoop();
          return;
        }
      }
      minutesRef.current = nextMinutes;
      setMinutes(nextMinutes);
      const isoDate = week[nextDay];
      const weekday = nextDay + 1;
      const due = simulationBeatsForWeekday(weekday).filter((item) => {
        const key = simulationBeatKey(item, isoDate);
        return item.minute <= nextMinutes && !firedRef.current.has(key);
      });
      if (due.length && !postingRef.current) {
        const next = due[0];
        const beatKey = simulationBeatKey(next, isoDate);
        firedRef.current.add(beatKey);
        postingRef.current = true;
        void playBeat(next, isoDate)
          .catch((reason: unknown) => {
            firedRef.current.delete(beatKey);
            setError(reason instanceof Error ? reason.message : "Simulation write failed.");
            stopLoop();
          })
          .finally(() => {
            postingRef.current = false;
          });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function restart() {
    stopLoop();
    setError("");
    const previous = simRef.current;
    const response = await fetch("/api/attendance/simulation/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulationId: previous }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error || "Unable to reset this simulation.");
      return;
    }
    const nextId = crypto.randomUUID();
    simRef.current = nextId;
    setSimulationId(nextId);
    firedRef.current = new Set();
    minutesRef.current = 0;
    dayRef.current = 0;
    setMinutes(0);
    setDayIndex(0);
    setBeat(null);
    setPhase("idle");
    setLog([]);
    setDashboard(null);
  }

  useEffect(() => () => stopLoop(), []);

  const progress = Math.min(100, (minutes / SIMULATION_DAY_MINUTES) * 100);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-sky-200/80">Attendance demonstration</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Monday to Friday entrance simulation</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/55">
              Five employees present NFC badges at the door. Each event is written to PostgreSQL as a simulated
              record and the attendance figures update from those same rows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Control label={playing ? "Pause" : "Play"} onClick={() => (playing ? stopLoop() : startLoop())} primary />
            <Control label="Restart" onClick={() => void restart()} />
            {SPEEDS.map((value) => (
              <Control key={value} label={`${value}×`} active={speed === value} onClick={() => setSpeed(value)} />
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (playingRef.current) return;
                dayRef.current = index;
                minutesRef.current = 0;
                setDayIndex(index);
                setMinutes(0);
              }}
              className={`rounded-full px-3 py-1 text-xs ${
                dayIndex === index ? "bg-sky-500 text-white" : "bg-white/10 text-white/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-white/50">
            <span>{formatLondonDate(date)}</span>
            <span className="font-mono text-sm text-white">{clock}</span>
            <span>18:00</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.08em] text-white/35">
            <span>08:00</span>
            <span>Working day</span>
            <span>18:00</span>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="relative min-h-[420px] overflow-hidden rounded-2xl border border-sky-300/20 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_42%),linear-gradient(180deg,#07111f,#0b1728)] p-6">
          <div className="absolute inset-x-8 bottom-16 h-px bg-white/15" />
          <div className="absolute right-10 top-16 h-52 w-28 rounded-t-[28px] border border-white/20 bg-white/[0.04] shadow-[0_0_40px_rgba(56,189,248,0.12)]">
            <div className="mx-auto mt-8 h-16 w-10 rounded-md border border-white/20 bg-black/30" />
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.16em] text-white/40">Entrance</p>
          </div>
          <Reader phase={phase} uid={member?.nfcUid} />
          <Person phase={phase} name={member ? `${member.firstName} ${member.lastName}` : "Waiting"} department={member?.department ?? "Demo roster"} />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-white/40">{phaseLabel(phase, beat)}</p>
              <p className="text-lg font-semibold text-white">
                {member ? `${member.firstName} ${member.lastName}` : "Entrance clear"}
              </p>
              <p className="text-sm text-white/55">
                {beat ? `${beat.scenario} · ${simulationBeatClock(beat)}` : "Press play to run the working week."}
              </p>
            </div>
            {phase === "success" && beat ? (
              <div className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-100">
                {beat.eventType === "IN" ? "Clocked in" : "Clocked out"}
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-semibold text-white">Activity</h3>
            <ul className="mt-3 space-y-2">
              {log.length === 0 ? <li className="text-sm text-white/40">No events in this run yet.</li> : null}
              {log.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-white/85">
                    {entry.text}
                    <span className="mt-0.5 block text-xs text-white/40">{entry.scenario}</span>
                  </span>
                  <span className="font-mono text-xs text-sky-100">{entry.time}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-semibold text-white">Dashboard from stored events</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <MiniStat label="On site" value={dashboard?.kpis.onSite ?? 0} />
              <MiniStat label="Clock-ins" value={dashboard?.kpis.clockIns ?? 0} />
              <MiniStat label="Missing out" value={dashboard?.kpis.missingClockOuts ?? 0} />
              <MiniStat label="Late" value={dashboard?.kpis.lateArrivals ?? 0} />
              <MiniStat label="Early" value={dashboard?.kpis.earlyDepartures ?? 0} />
            </div>
            <ul className="mt-3 space-y-2">
              {(dashboard?.rows ?? []).map((row) => (
                <li key={row.employeeId} className="flex items-center justify-between gap-2 text-xs text-white/75">
                  <span>
                    {row.employeeNumber} {row.employeeName}
                  </span>
                  <StatusPill status={row.status} />
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/50">
            <p>Scenarios in this week: {SIMULATION_SCENARIOS.join(" · ")}.</p>
            <p className="mt-2 font-mono">Simulation {simulationId}</p>
            <p className="mt-1">Restart deletes only simulated events for this simulation id.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Reader({ phase, uid }: { phase: Phase; uid?: string }) {
  const hot = phase === "register" || phase === "success";
  return (
    <div className="absolute left-1/2 top-16 w-44 -translate-x-1/2 rounded-2xl border border-white/15 bg-black/40 p-4 text-center">
      <div className={`mx-auto h-3 w-3 rounded-full ${hot ? "bg-emerald-300 shadow-[0_0_16px_#6ee7b7]" : "bg-white/25"}`} />
      <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-white/45">NFC reader</p>
      <p className="mt-1 font-mono text-xs text-white">{phase === "present" || hot ? uid ?? "Reading…" : "Ready"}</p>
    </div>
  );
}

function Person({ phase, name, department }: { phase: Phase; name: string; department: string }) {
  const x = phase === "idle" ? -180 : phase === "approach" ? -40 : 70;
  return (
    <motion.div
      animate={{ x, opacity: phase === "idle" ? 0.35 : 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="absolute bottom-24 left-16 w-40 rounded-2xl border border-white/15 bg-white/[0.06] p-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-400/20 text-sm font-semibold text-white">
          {name.slice(0, 1)}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-[11px] text-white/45">{department}</p>
        </div>
      </div>
      <motion.div
        animate={{ y: phase === "present" || phase === "register" ? -28 : 0, opacity: phase === "idle" ? 0 : 1 }}
        className="mt-3 rounded-lg border border-sky-200/30 bg-sky-400/10 px-2 py-1 text-center text-[10px] uppercase tracking-[0.14em] text-sky-100"
      >
        NFC badge
      </motion.div>
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.08em] text-white/40">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Control({
  label,
  onClick,
  primary = false,
  active = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm ${
        primary || active ? "bg-sky-500 text-white" : "border border-white/15 text-white/80"
      }`}
    >
      {label}
    </button>
  );
}

function phaseLabel(phase: Phase, beat: SimulationBeat | null): string {
  if (!beat || phase === "idle") return "Entrance";
  if (phase === "approach") return "Approaching";
  if (phase === "present") return "Presenting badge";
  if (phase === "register") return "Reader registering";
  return beat.eventType === "IN" ? "Clock-in recorded" : "Clock-out recorded";
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
