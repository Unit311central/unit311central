/**
 * ABHI leave fixtures — server-safe (no window / localStorage).
 */
import type { HrLeaveRequest } from "@/lib/hr-leave-data";

function isoDaysFromNow(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Approved / pending leave used by EA and HR mock seed. */
export function buildAbhiLeaveRequests(): HrLeaveRequest[] {
  return [
    {
      id: "leave-abhi-1",
      employeeId: "abhi-emp-judith-mellis",
      employeeName: "Judith Mellis",
      department: "UK Market Affairs",
      location: "London",
      role: "Senior Manager, UK Market Affairs",
      managerName: "Peter Ellingworth",
      type: "annual",
      startDate: isoDaysFromNow(-2),
      endDate: isoDaysFromNow(3),
      days: 5,
      status: "approved",
      notes: "Summer leave",
      requestedAt: isoDaysFromNow(-21),
      decidedAt: isoDaysFromNow(-18),
    },
    {
      id: "leave-abhi-2",
      employeeId: "abhi-emp-owain-prescott",
      employeeName: "Owain Prescott",
      department: "Market Access",
      location: "London",
      role: "Market Access Executive",
      managerName: "Luella Trickett",
      type: "sick",
      startDate: isoDaysFromNow(-1),
      endDate: isoDaysFromNow(2),
      days: 3,
      status: "approved",
      notes: "Medical recovery",
      requestedAt: isoDaysFromNow(-1),
      decidedAt: isoDaysFromNow(-1),
    },
    {
      id: "leave-abhi-3",
      employeeId: "abhi-emp-charlotte-hart",
      employeeName: "Charlotte Hart",
      department: "Communications",
      location: "London",
      role: "Communications and Events Executive",
      managerName: "Jonathan Evans",
      type: "annual",
      startDate: isoDaysFromNow(5),
      endDate: isoDaysFromNow(9),
      days: 5,
      status: "approved",
      notes: "Family holiday",
      requestedAt: isoDaysFromNow(-10),
      decidedAt: isoDaysFromNow(-8),
    },
    {
      id: "leave-abhi-4",
      employeeId: "abhi-emp-addie-macgregor",
      employeeName: "Addie Macgregor",
      department: "Sustainability",
      location: "London",
      role: "Sustainability & Ethics Manager",
      managerName: "Jane Lewis",
      type: "annual",
      startDate: isoDaysFromNow(18),
      endDate: isoDaysFromNow(22),
      days: 5,
      status: "approved",
      notes: "Annual leave",
      requestedAt: isoDaysFromNow(-7),
      decidedAt: isoDaysFromNow(-5),
    },
    {
      id: "leave-abhi-5",
      employeeId: "abhi-emp-sophie-green",
      employeeName: "Sophie Green",
      department: "International",
      location: "London",
      role: "International Accelerator Manager",
      managerName: "Paul Benton",
      type: "training",
      startDate: isoDaysFromNow(12),
      endDate: isoDaysFromNow(13),
      days: 2,
      status: "pending",
      notes: "Market access workshop",
      requestedAt: isoDaysFromNow(-2),
      decidedAt: null,
    },
    {
      id: "leave-abhi-6",
      employeeId: "abhi-emp-rebecca-parkin",
      employeeName: "Rebecca Parkin",
      department: "Digital Health",
      location: "London",
      role: "Associate Director, Digital Health",
      managerName: "Andrew Davies",
      type: "annual",
      startDate: isoDaysFromNow(25),
      endDate: isoDaysFromNow(29),
      days: 5,
      status: "approved",
      notes: "Late August break",
      requestedAt: isoDaysFromNow(-4),
      decidedAt: isoDaysFromNow(-3),
    },
  ];
}
