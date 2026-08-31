"use client";

export function TestRunsTab() {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-white">Test Runs</h3>
      <p className="text-sm text-white/60">
        Database schema supports measured test runs (latency, bandwidth, GPU, packet loss, scenario
        snapshot). Recording UI is prepared for BCN field measurements — use Assumptions register to
        track which reference values have been replaced with measured data.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-white/50">
        <li>Timestamp, scenario, pipeline version</li>
        <li>Video profile &amp; connectivity at time of test</li>
        <li>Measured latency, bandwidth, FPS, GPU, queue, packet loss</li>
        <li>Success/failure against criteria</li>
      </ul>
      <p className="text-xs text-amber-200/80">
        No fabricated test data is shown. Record real BCN field runs after deployment validation.
      </p>
    </div>
  );
}
