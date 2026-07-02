import CompletionTrendChart from "@/components/dashboard/CompletionTrendChart";
import ProgressChart from "@/components/dashboard/ProgressChart";
import SchedulePerformanceChart from "@/components/dashboard/SchedulePerformanceChart";
import SectionHeader from "@/components/dashboard/SectionHeader";
import VolumeChart from "@/components/dashboard/VolumeChart";

export default function AnalyticsSection() {
  return (
    <section className="space-y-5">
      <SectionHeader
        title="Analytics"
        description="Drone data transformed into project intelligence"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
        <ProgressChart compact />
        <VolumeChart compact />
        <SchedulePerformanceChart />
        <CompletionTrendChart />
      </div>
    </section>
  );
}
