/** Seeded from spreadsheet.xlsx — ABHI public events calendar. */

export type AbhiCalendarEventCategory =
  | "ABHI Event"
  | "Exhibition"
  | "External Event"
  | "Member Group Meeting"
  | "Trade Mission";

export type AbhiCalendarEvent = {
  id: string;
  title: string;
  dateLabel: string;
  dateIso: string;
  year: number;
  description: string;
  contactEmail: string;
  category: AbhiCalendarEventCategory | string;
  url: string;
};

export const ABHI_CALENDAR_EVENT_CATEGORIES = [
  "ABHI Event",
  "Exhibition",
  "External Event",
  "Member Group Meeting",
  "Trade Mission",
] as const;

export const ABHI_CALENDAR_EVENTS_SEED: AbhiCalendarEvent[] = [
  {
    "id": "abhi-cal-001",
    "title": "ABHI Legal Issues Group (Member Only)",
    "dateLabel": "01 Sept 2026",
    "dateIso": "2026-09-01",
    "year": 2026,
    "description": "To join the meeting, contact phil.brown@abhi.org.uk",
    "contactEmail": "phil.brown@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-legal-issues-group-13/"
  },
  {
    "id": "abhi-cal-002",
    "title": "ABHI Value & Access Group (ABHI Members Only)",
    "dateLabel": "08 Sept 2026",
    "dateIso": "2026-09-08",
    "year": 2026,
    "description": "To join the meeting, contact judith.mellis@abhi.org.uk",
    "contactEmail": "judith.mellis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-value-access-group-7-8/"
  },
  {
    "id": "abhi-cal-003",
    "title": "ABHI SME Group (ABHI Members Only)",
    "dateLabel": "09 Sept 2026",
    "dateIso": "2026-09-09",
    "year": 2026,
    "description": "To join the meeting, contact jane.lewis@abhi.org.uk",
    "contactEmail": "jane.lewis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-sme-group-2/"
  },
  {
    "id": "abhi-cal-004",
    "title": "ABHI Diagnostics Group (Member Only)",
    "dateLabel": "10 Sept 2026",
    "dateIso": "2026-09-10",
    "year": 2026,
    "description": "To join the meeting, contact ravi.chana@abhi.org.uk",
    "contactEmail": "ravi.chana@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-diagnostics-group-2-6/"
  },
  {
    "id": "abhi-cal-005",
    "title": "ABHI Scotland (ABHI Members Only)",
    "dateLabel": "14 Sept 2026",
    "dateIso": "2026-09-14",
    "year": 2026,
    "description": "To join the meeting, contact suzie.ali-hassan@abhi.org.uk",
    "contactEmail": "suzie.ali-hassan@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-scotland-1-6/"
  },
  {
    "id": "abhi-cal-006",
    "title": "ABHI Robotic Assisted Surgery Group (Member Only)",
    "dateLabel": "15 Sept 2026",
    "dateIso": "2026-09-15",
    "year": 2026,
    "description": "To join the meeting, contact andrew.davies@abhi.org.uk",
    "contactEmail": "andrew.davies@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-robotic-assisted-surgery-group-13/"
  },
  {
    "id": "abhi-cal-007",
    "title": "ABHI MD Regulatory Group (ABHI Members Only)",
    "dateLabel": "15 Sept 2026",
    "dateIso": "2026-09-15",
    "year": 2026,
    "description": "To join the meeting, contact phil.brown@abhi.org.uk",
    "contactEmail": "phil.brown@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-md-regulatory-group-8/"
  },
  {
    "id": "abhi-cal-008",
    "title": "ABHI International (ABHI Members Only)",
    "dateLabel": "15 Sept 2026",
    "dateIso": "2026-09-15",
    "year": 2026,
    "description": "To join the meeting, contact lauren.hayes@abhi.org.uk",
    "contactEmail": "lauren.hayes@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-international-6/"
  },
  {
    "id": "abhi-cal-009",
    "title": "Agentic AI for Leaders Summit",
    "dateLabel": "17 Sept 2026",
    "dateIso": "2026-09-17",
    "year": 2026,
    "description": "This event is brought to you by City and Financial Global ABHI is delighted to support City and F...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/agentic-ai-for-leaders-summit/"
  },
  {
    "id": "abhi-cal-010",
    "title": "ABHI Cardiovascular Group (Member Only)",
    "dateLabel": "17 Sept 2026",
    "dateIso": "2026-09-17",
    "year": 2026,
    "description": "To join the meeting, contact Addie.MacGregor@abhi.org.uk",
    "contactEmail": "Addie.MacGregor@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-cardiovascular-group-13/"
  },
  {
    "id": "abhi-cal-011",
    "title": "ABHI Patient Safety Group (ABHI members only)",
    "dateLabel": "17 Sept 2026",
    "dateIso": "2026-09-17",
    "year": 2026,
    "description": "To join the meeting, contact judith.mellis@abhi.org.uk",
    "contactEmail": "judith.mellis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-patient-safety-group-10/"
  },
  {
    "id": "abhi-cal-012",
    "title": "DHSC Briefing: Delivering the Women's Health Strategy",
    "dateLabel": "17 Sept 2026",
    "dateIso": "2026-09-17",
    "year": 2026,
    "description": "Earlier this year, the Department of Health and Social Care published the refreshed Women's Healt...",
    "contactEmail": "",
    "category": "ABHI Event",
    "url": "https://www.abhi.org.uk/events/abhi-events/dhsc-briefing-delivering-the-womens-health-strategy/"
  },
  {
    "id": "abhi-cal-013",
    "title": "ABHI HR Group (ABHI Members Only)",
    "dateLabel": "23 Sept 2026",
    "dateIso": "2026-09-23",
    "year": 2026,
    "description": "To join this meeting, please contact jane.lewis@abhi.org.uk",
    "contactEmail": "jane.lewis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-hr-group-7-8/"
  },
  {
    "id": "abhi-cal-014",
    "title": "ABHI Digital Health Group (ABHI Members Only)",
    "dateLabel": "23 Sept 2026",
    "dateIso": "2026-09-23",
    "year": 2026,
    "description": "To join the meeting, contact andrew.davies@abhi.org.uk",
    "contactEmail": "andrew.davies@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-digital-health-group-18/"
  },
  {
    "id": "abhi-cal-015",
    "title": "HPE Europe 2026",
    "dateLabel": "24 Sept 2026",
    "dateIso": "2026-09-24",
    "year": 2026,
    "description": "This event is brought to you by ABHI member, McDermott Will & Schulte UK LLP Taking place on...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/hpe-europe-2026/"
  },
  {
    "id": "abhi-cal-016",
    "title": "ABHI IVD Regulatory Group (ABHI Members Only)",
    "dateLabel": "24 Sept 2026",
    "dateIso": "2026-09-24",
    "year": 2026,
    "description": "To join the meeting, contact stephen.lee@abhi.org.uk",
    "contactEmail": "stephen.lee@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-ivd-regulatory-group-14/"
  },
  {
    "id": "abhi-cal-017",
    "title": "US Accelerator East Coast Mission",
    "dateLabel": "28 Sept 2026",
    "dateIso": "2026-09-28",
    "year": 2026,
    "description": "This visit is part of ABHI's 2026 US Accelerator. Click here for more information on the pr...",
    "contactEmail": "",
    "category": "Trade Mission",
    "url": "https://www.abhi.org.uk/events/trade-missions/us-accelerator-east-coast-mission/"
  },
  {
    "id": "abhi-cal-018",
    "title": "What MDSAP Membership Means for UK HealthTech",
    "dateLabel": "28 Sept 2026",
    "dateIso": "2026-09-28",
    "year": 2026,
    "description": "REGISTER HERE. The MHRA has announced its intention to move towards full membership of the Medica...",
    "contactEmail": "",
    "category": "ABHI Event",
    "url": "https://www.abhi.org.uk/events/abhi-events/what-mdsap-membership-means-for-uk-healthtech/"
  },
  {
    "id": "abhi-cal-019",
    "title": "HETT Show 2026",
    "dateLabel": "29 Sept 2026",
    "dateIso": "2026-09-29",
    "year": 2026,
    "description": "HETT Show is the UK\u2019s leading event for the healthcare technology ecosystem, bringing together NH...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/hett-show-2026/"
  },
  {
    "id": "abhi-cal-020",
    "title": "ABHI Wound Care Group (ABHI Members Only)",
    "dateLabel": "29 Sept 2026",
    "dateIso": "2026-09-29",
    "year": 2026,
    "description": "To join this meeting, contact judith.mellis@abhi.org.uk",
    "contactEmail": "judith.mellis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-wound-care-group-14/"
  },
  {
    "id": "abhi-cal-021",
    "title": "ABHI Sustainability Conference 2026",
    "dateLabel": "30 Sept 2026",
    "dateIso": "2026-09-30",
    "year": 2026,
    "description": "The HealthTech industry has an important role to play in supporting more sustainable healthcare s...",
    "contactEmail": "",
    "category": "ABHI Event",
    "url": "https://www.abhi.org.uk/events/abhi-events/abhi-sustainability-conference-2026-1/"
  },
  {
    "id": "abhi-cal-022",
    "title": "The 4th Annual AI Regulation Summit",
    "dateLabel": "01 Oct 2026",
    "dateIso": "2026-10-01",
    "year": 2026,
    "description": "This event is brought to you by City and Financial Global ABHI is pleased to support City and Fin...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/the-4th-annual-ai-regulation-summit/"
  },
  {
    "id": "abhi-cal-023",
    "title": "WHX Johannesburg 2026 (Formerly Africa Health)",
    "dateLabel": "06 Oct 2026",
    "dateIso": "2026-10-06",
    "year": 2026,
    "description": "For all bookings and enquiries, contact nicola.hudson@abhi.org.uk. Find out more.",
    "contactEmail": "nicola.hudson@abhi.org.uk",
    "category": "Exhibition",
    "url": "https://www.abhi.org.uk/events/exhibitions/whx-johannesburg-2026-formerly-africa-health/"
  },
  {
    "id": "abhi-cal-024",
    "title": "Innovation in MedTech and Diagnostics Conference \u2013 London 2026",
    "dateLabel": "06 Oct 2026",
    "dateIso": "2026-10-06",
    "year": 2026,
    "description": "This event is brought to you by ABHI member CPI Returning for a second year in 2026, the Innovati...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/innovation-in-medtech-and-diagnostics-conference-london-2026/"
  },
  {
    "id": "abhi-cal-025",
    "title": "Women's Health Week Europe 2026",
    "dateLabel": "06 Oct 2026",
    "dateIso": "2026-10-06",
    "year": 2026,
    "description": "The event is brought to you by the W Group. Women\u2019s Health Week Europe brings together th...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/womens-health-week-europe-2026/"
  },
  {
    "id": "abhi-cal-026",
    "title": "ABHI Digital Health Conference 2026",
    "dateLabel": "07 Oct 2026",
    "dateIso": "2026-10-07",
    "year": 2026,
    "description": "From Policy to Practice: Scaling Digital in the NHS Join ABHI and leading voices from acros...",
    "contactEmail": "",
    "category": "ABHI Event",
    "url": "https://www.abhi.org.uk/events/abhi-events/abhi-digital-health-conference-2026/"
  },
  {
    "id": "abhi-cal-027",
    "title": "ABHI Diabetes Group (ABHI Members Only)",
    "dateLabel": "08 Oct 2026",
    "dateIso": "2026-10-08",
    "year": 2026,
    "description": "To join the meeting, contact judith.mellis@abhi.org.uk",
    "contactEmail": "judith.mellis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-diabetes-group-11/"
  },
  {
    "id": "abhi-cal-028",
    "title": "Life sciences and the NHS: delivering the next generation of health innovation",
    "dateLabel": "13 Oct 2026",
    "dateIso": "2026-10-13",
    "year": 2026,
    "description": "This event is brought to you by The King's Fund REGISTER HERE. 'Big bets' are being placed on lif...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/life-sciences-and-the-nhs-delivering-the-next-generation-of-health-innovation/"
  },
  {
    "id": "abhi-cal-029",
    "title": "CVD & Women's Health \u2013 What Can We Practically Do to Shift the Dial?",
    "dateLabel": "13 Oct 2026",
    "dateIso": "2026-10-13",
    "year": 2026,
    "description": "Earlier this year, ABHI and the Faculty of Pharmaceutical Medicine (FPM) partnered to deliver a w...",
    "contactEmail": "",
    "category": "ABHI Event",
    "url": "https://www.abhi.org.uk/events/abhi-events/cvd-womens-health-what-can-we-practically-do-to-shift-the-dial/"
  },
  {
    "id": "abhi-cal-030",
    "title": "ABHI Government Affairs Group (ABHI Members Only)",
    "dateLabel": "14 Oct 2026",
    "dateIso": "2026-10-14",
    "year": 2026,
    "description": "To join the meeting, contact enquiries@abhi.org.uk",
    "contactEmail": "enquiries@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-government-affairs-group-4/"
  },
  {
    "id": "abhi-cal-031",
    "title": "TOPRA Annual Symposium",
    "dateLabel": "19 Oct 2026",
    "dateIso": "2026-10-19",
    "year": 2026,
    "description": "This event is brought to you by TOPRA. Join the global regulatory community in Utrecht this year...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/topra-annual-symposium/"
  },
  {
    "id": "abhi-cal-032",
    "title": "US Accelerator Texas Mission",
    "dateLabel": "28 Oct 2026",
    "dateIso": "2026-10-28",
    "year": 2026,
    "description": "This visit is part of ABHI's 2026 US Accelerator. Click here for more information on the pr...",
    "contactEmail": "",
    "category": "Trade Mission",
    "url": "https://www.abhi.org.uk/events/trade-missions/us-accelerator-texas-mission/"
  },
  {
    "id": "abhi-cal-033",
    "title": "3rd Annual Future of Health Europe",
    "dateLabel": "03 Nov 2026",
    "dateIso": "2026-11-03",
    "year": 2026,
    "description": "This event is brought to you by Economist Enterprise Empowering healthcare leaders with the...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/3rd-annual-future-of-health-europe/"
  },
  {
    "id": "abhi-cal-034",
    "title": "AI in Health Summit",
    "dateLabel": "03 Nov 2026",
    "dateIso": "2026-11-03",
    "year": 2026,
    "description": "This event is brought to you by Economist Enterprise AI is ready. How can health systems tu...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/ai-in-health-summit/"
  },
  {
    "id": "abhi-cal-035",
    "title": "Cardiovascular Health Summit",
    "dateLabel": "03 Nov 2026",
    "dateIso": "2026-11-03",
    "year": 2026,
    "description": "This event is brought to you by Economist Enterprise Shaping the future of cardiovascular h...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/cardiovascular-health-summit/"
  },
  {
    "id": "abhi-cal-036",
    "title": "Annual DACH Region MedTech Forum",
    "dateLabel": "05 Nov 2026",
    "dateIso": "2026-11-05",
    "year": 2026,
    "description": "Exploring MedTech Opportunities in Germany, Austria and Switzerland \u200bJoin the third annual&n...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/annual-dach-region-medtech-forum/"
  },
  {
    "id": "abhi-cal-037",
    "title": "The ABHI UK HealthTech Conference 2026",
    "dateLabel": "09 Nov 2026",
    "dateIso": "2026-11-09",
    "year": 2026,
    "description": "REGISTER HERE. The ABHI UK HealthTech Conference returns in 2026, bringing together lea...",
    "contactEmail": "",
    "category": "ABHI Event",
    "url": "https://www.abhi.org.uk/events/abhi-events/the-abhi-uk-healthtech-conference-2026/"
  },
  {
    "id": "abhi-cal-038",
    "title": "ABHI Scotland (ABHI Members Only)",
    "dateLabel": "17 Nov 2026",
    "dateIso": "2026-11-17",
    "year": 2026,
    "description": "To join the meeting, contact suzie.ali-hassan@abhi.org.uk",
    "contactEmail": "suzie.ali-hassan@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-scotland-1-7/"
  },
  {
    "id": "abhi-cal-039",
    "title": "ABHI Sustainability Group (ABHI Members Only)",
    "dateLabel": "24 Nov 2026",
    "dateIso": "2026-11-24",
    "year": 2026,
    "description": "To join the meeting, contact addie.macgregor@abhi.org.uk",
    "contactEmail": "addie.macgregor@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-sustainability-group-7-9/"
  },
  {
    "id": "abhi-cal-040",
    "title": "ABHI Robotic Assisted Surgery Group (Member Only)",
    "dateLabel": "30 Nov 2026",
    "dateIso": "2026-11-30",
    "year": 2026,
    "description": "To join the meeting, contact andrew.davies@abhi.org.uk",
    "contactEmail": "andrew.davies@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-robotic-assisted-surgery-group-14/"
  },
  {
    "id": "abhi-cal-041",
    "title": "ABHI Cardiovascular Group (Member Only)",
    "dateLabel": "01 Dec 2026",
    "dateIso": "2026-12-01",
    "year": 2026,
    "description": "To join the meeting, contact Addie.MacGregor@abhi.org.uk",
    "contactEmail": "Addie.MacGregor@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-cardiovascular-group-14/"
  },
  {
    "id": "abhi-cal-042",
    "title": "ABHI MD Regulatory Group (ABHI Members Only)",
    "dateLabel": "01 Dec 2026",
    "dateIso": "2026-12-01",
    "year": 2026,
    "description": "To join the meeting, contact phil.brown@abhi.org.uk",
    "contactEmail": "phil.brown@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-md-regulatory-group-9/"
  },
  {
    "id": "abhi-cal-043",
    "title": "ABHI Value & Access Group (ABHI Members Only)",
    "dateLabel": "02 Dec 2026",
    "dateIso": "2026-12-02",
    "year": 2026,
    "description": "To join the meeting, contact judith.mellis@abhi.org.uk",
    "contactEmail": "judith.mellis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-value-access-group-7-9/"
  },
  {
    "id": "abhi-cal-044",
    "title": "ABHI SME Group (ABHI Members Only)",
    "dateLabel": "03 Dec 2026",
    "dateIso": "2026-12-03",
    "year": 2026,
    "description": "To join the meeting, contact jane.lewis@abhi.org.uk",
    "contactEmail": "jane.lewis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-sme-group-3/"
  },
  {
    "id": "abhi-cal-045",
    "title": "ABHI International (ABHI Members Only)",
    "dateLabel": "03 Dec 2026",
    "dateIso": "2026-12-03",
    "year": 2026,
    "description": "To join the meeting, contact lauren.hayes@abhi.org.uk",
    "contactEmail": "lauren.hayes@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-international-7/"
  },
  {
    "id": "abhi-cal-046",
    "title": "ABHI IVD Regulatory Group (ABHI Members Only)",
    "dateLabel": "03 Dec 2026",
    "dateIso": "2026-12-03",
    "year": 2026,
    "description": "To join the meeting, contact stephen.lee@abhi.org.uk",
    "contactEmail": "stephen.lee@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-ivd-regulatory-group-15/"
  },
  {
    "id": "abhi-cal-047",
    "title": "GIANT Health",
    "dateLabel": "07 Dec 2026",
    "dateIso": "2026-12-07",
    "year": 2026,
    "description": "GIANT Health is the UK\u2019s leading and rapidly expanding community of over 345,000 NHS leaders, cli...",
    "contactEmail": "",
    "category": "External Event",
    "url": "https://www.abhi.org.uk/events/external-events/giant-health/"
  },
  {
    "id": "abhi-cal-048",
    "title": "ABHI Diagnostics Group (Member Only)",
    "dateLabel": "07 Dec 2026",
    "dateIso": "2026-12-07",
    "year": 2026,
    "description": "To join the meeting, contact ravi.chana@abhi.org.uk",
    "contactEmail": "ravi.chana@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-diagnostics-group-2-7/"
  },
  {
    "id": "abhi-cal-049",
    "title": "ABHI HR Group (ABHI Members Only)",
    "dateLabel": "08 Dec 2026",
    "dateIso": "2026-12-08",
    "year": 2026,
    "description": "To join this meeting, please contact jane.lewis@abhi.org.uk",
    "contactEmail": "jane.lewis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-hr-group-7-9/"
  },
  {
    "id": "abhi-cal-050",
    "title": "ABHI Digital Health Group (ABHI Members Only)",
    "dateLabel": "08 Dec 2026",
    "dateIso": "2026-12-08",
    "year": 2026,
    "description": "To join the meeting, contact andrew.davies@abhi.org.uk",
    "contactEmail": "andrew.davies@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-digital-health-group-19/"
  },
  {
    "id": "abhi-cal-051",
    "title": "ABHI Wound Care Group (ABHI Members Only)",
    "dateLabel": "09 Dec 2026",
    "dateIso": "2026-12-09",
    "year": 2026,
    "description": "To join this meeting, contact judith.mellis@abhi.org.uk",
    "contactEmail": "judith.mellis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-wound-care-group-15/"
  },
  {
    "id": "abhi-cal-052",
    "title": "ABHI Diabetes Group (ABHI Members Only)",
    "dateLabel": "10 Dec 2026",
    "dateIso": "2026-12-10",
    "year": 2026,
    "description": "To join the meeting, contact judith.mellis@abhi.org.uk",
    "contactEmail": "judith.mellis@abhi.org.uk",
    "category": "Member Group Meeting",
    "url": "https://www.abhi.org.uk/events/abhi-member-group-meetings/abhi-diabetes-group-12/"
  },
  {
    "id": "abhi-cal-053",
    "title": "WHX Dubai 2027 (formerly known as Arab Health)",
    "dateLabel": "25 Jan 2027",
    "dateIso": "2027-01-25",
    "year": 2027,
    "description": "For all bookings and enquiries, contact michelle.michelucci@abhi.org.uk Click here for...",
    "contactEmail": "michelle.michelucci@abhi.org.uk",
    "category": "Exhibition",
    "url": "https://www.abhi.org.uk/events/exhibitions/whx-dubai-2027-formerly-known-as-arab-health/"
  },
  {
    "id": "abhi-cal-054",
    "title": "WHX Tech 2027",
    "dateLabel": "27 Jan 2027",
    "dateIso": "2027-01-27",
    "year": 2027,
    "description": "For all bookings and enquiries, contact michelle.michelucci@abhi.org.uk. Find out more.",
    "contactEmail": "michelle.michelucci@abhi.org.uk",
    "category": "Exhibition",
    "url": "https://www.abhi.org.uk/events/exhibitions/whx-tech-2027/"
  },
  {
    "id": "abhi-cal-055",
    "title": "Hospitalar 2027",
    "dateLabel": "18 May 2027",
    "dateIso": "2027-05-18",
    "year": 2027,
    "description": "For all bookings and enquiries, contact michelle.michelucci@abhi.org.uk Click here for more...",
    "contactEmail": "michelle.michelucci@abhi.org.uk",
    "category": "Exhibition",
    "url": "https://www.abhi.org.uk/events/exhibitions/hospitalar-2027/"
  }
];
