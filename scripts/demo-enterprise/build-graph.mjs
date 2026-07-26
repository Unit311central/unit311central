/**
 * Build in-memory Meridian Atlas enterprise graph (Demo only).
 */

import {
  COMPANY,
  OFFICES,
  DEPARTMENTS,
  FIRST_NAMES,
  LAST_NAMES,
  CLIENT_INDUSTRIES,
  CLIENT_PREFIXES,
  CLIENT_SUFFIXES,
  SUPPLIERS,
  DEMO_ENTERPRISE_TAG,
  GL_ACCOUNTS,
} from "./company.mjs";
import { addDays, createRng, daysAgo, monthsAgo, sqlUuid } from "./rng.mjs";

const ROLE_BANDS = [
  { dept: "Executive", roles: ["Chief Executive Officer", "Chief Operating Officer", "Chief Financial Officer", "Chief Technology Officer", "Chief People Officer"], level: "executive", count: 5 },
  { dept: "Engineering", roles: ["Engineering Director", "Engineering Manager", "Senior Software Engineer", "Software Engineer", "Graduate Engineer"], level: "ic", count: 14 },
  { dept: "Cloud", roles: ["Cloud Director", "Cloud Architect", "Cloud Engineer", "DevOps Engineer"], level: "ic", count: 10 },
  { dept: "Security", roles: ["Security Director", "Security Engineer", "SOC Analyst"], level: "ic", count: 6 },
  { dept: "Consulting", roles: ["Consulting Director", "Principal Consultant", "Senior Consultant", "Consultant"], level: "ic", count: 12 },
  { dept: "Project Management", roles: ["PMO Director", "Senior Project Manager", "Project Manager"], level: "ic", count: 8 },
  { dept: "Business Analysis", roles: ["Lead Business Analyst", "Business Analyst"], level: "ic", count: 6 },
  { dept: "Customer Success", roles: ["CS Director", "Customer Success Manager", "Onboarding Specialist"], level: "ic", count: 7 },
  { dept: "Sales", roles: ["VP Sales", "Enterprise Account Executive", "Account Executive", "Sales Development Rep"], level: "ic", count: 8 },
  { dept: "Marketing", roles: ["Marketing Director", "Product Marketing Manager", "Content Manager"], level: "ic", count: 5 },
  { dept: "Finance", roles: ["Finance Director", "Financial Controller", "Management Accountant", "Accounts Payable Specialist"], level: "ic", count: 6 },
  { dept: "HR", roles: ["HR Director", "HR Business Partner", "People Operations Specialist", "Recruiter"], level: "ic", count: 5 },
  { dept: "Operations", roles: ["Operations Director", "Operations Manager", "Facilities Coordinator"], level: "ic", count: 4 },
  { dept: "Procurement", roles: ["Procurement Manager", "Buyer"], level: "ic", count: 3 },
  { dept: "Support", roles: ["Support Manager", "Support Engineer", "Support Analyst"], level: "ic", count: 6 },
  { dept: "Administration", roles: ["Executive Assistant", "Office Administrator", "Intern"], level: "ic", count: 4 },
];

function salaryFor(role, rng) {
  const r = role.toLowerCase();
  if (r.includes("chief") || r.includes("vp ")) return rng.money(140000, 220000, 0);
  if (r.includes("director")) return rng.money(110000, 150000, 0);
  if (r.includes("principal") || r.includes("architect") || r.includes("controller")) return rng.money(95000, 125000, 0);
  if (r.includes("senior") || r.includes("manager") || r.includes("lead")) return rng.money(75000, 105000, 0);
  if (r.includes("graduate") || r.includes("intern") || r.includes("sdr")) return rng.money(32000, 48000, 0);
  return rng.money(52000, 82000, 0);
}

export function buildEnterpriseGraph(options = {}) {
  const rng = createRng(options.seed ?? 3112025);
  const employeeTarget = options.employees ?? 100;
  const clientTarget = options.clients ?? 100;

  const employees = [];
  let empIdx = 0;
  for (const band of ROLE_BANDS) {
    for (let i = 0; i < band.count && empIdx < employeeTarget; i += 1) {
      empIdx += 1;
      const first = rng.pick(FIRST_NAMES);
      const last = rng.pick(LAST_NAMES);
      const role = band.roles[Math.min(i, band.roles.length - 1)];
      const office = OFFICES[empIdx % OFFICES.length];
      const id = `dme-emp-${String(empIdx).padStart(3, "0")}`;
      const email = `${first}.${last}.${empIdx}@${COMPANY.domain}`.toLowerCase().replace(/[^a-z0-9.@+-]/g, "");
      employees.push({
        id,
        fullName: `${first} ${last}`,
        preferredName: first,
        email,
        phone: `+44 7700 ${String(100000 + empIdx).slice(-6)}`,
        department: band.dept,
        role,
        officeId: office.id,
        location: `${office.city}, ${office.country}`,
        salary: salaryFor(role, rng),
        dateJoined: daysAgo(rng.int(30, 360)),
        employmentType: role.toLowerCase().includes("intern")
          ? "Intern"
          : role.toLowerCase().includes("graduate")
            ? "Graduate"
            : "Permanent",
        skills: rng.shuffle(["Cloud", "Leadership", "Delivery", "Security", "SQL", "React", "Python", "Stakeholder Mgmt"]).slice(0, 3),
        certifications: rng.bool(0.4) ? [rng.pick(["AWS SA", "Azure Admin", "PMP", "CISSP", "ITIL"])] : [],
      });
    }
  }
  while (employees.length < employeeTarget) {
    empIdx += 1;
    const first = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const office = OFFICES[empIdx % OFFICES.length];
    const dept = rng.pick(DEPARTMENTS.filter((d) => d !== "Executive"));
    const id = `dme-emp-${String(empIdx).padStart(3, "0")}`;
    employees.push({
      id,
      fullName: `${first} ${last}`,
      preferredName: first,
      email: `${first}.${last}.${empIdx}@${COMPANY.domain}`.toLowerCase().replace(/[^a-z0-9.@+-]/g, ""),
      phone: `+44 7700 ${String(100000 + empIdx).slice(-6)}`,
      department: dept,
      role: `${dept} Specialist`,
      officeId: office.id,
      location: `${office.city}, ${office.country}`,
      salary: rng.money(45000, 85000, 0),
      dateJoined: daysAgo(rng.int(40, 340)),
      employmentType: "Permanent",
      skills: ["Delivery"],
      certifications: [],
    });
  }

  // Managers: executives manage directors; directors manage rest by dept
  const byDept = Object.fromEntries(DEPARTMENTS.map((d) => [d, []]));
  for (const e of employees) byDept[e.department]?.push(e);
  for (const e of employees) {
    if (e.role.includes("Chief")) {
      e.manager = "Board";
      continue;
    }
    const leaders = (byDept[e.department] || []).filter(
      (x) => x.id !== e.id && (x.role.includes("Director") || x.role.includes("VP") || x.role.includes("Chief")),
    );
    e.manager = leaders[0]?.fullName ?? employees.find((x) => x.role.includes("Chief Operating"))?.fullName ?? "Leadership";
  }

  const clients = [];
  const usedNames = new Set();
  for (let i = 1; i <= clientTarget; i += 1) {
    let companyName;
    do {
      companyName = `${rng.pick(CLIENT_PREFIXES)} ${rng.pick(CLIENT_SUFFIXES)} ${rng.pick(["Ltd", "Inc", "GmbH", "Pte Ltd", "PLC"])}`;
    } while (usedNames.has(companyName));
    usedNames.add(companyName);
    const industry = CLIENT_INDUSTRIES[i % CLIENT_INDUSTRIES.length];
    const office = OFFICES[i % OFFICES.length];
    const contactFirst = rng.pick(FIRST_NAMES);
    const contactLast = rng.pick(LAST_NAMES);
    const statusRoll = rng.next();
    const accountStatus =
      statusRoll > 0.92 ? "Archived" : statusRoll > 0.84 ? "Dormant" : statusRoll > 0.74 ? "Onboarding" : "Active";
    const id = `dme-cli-${String(i).padStart(3, "0")}`;
    clients.push({
      id,
      companyName,
      industry,
      region: office.country,
      city: office.city,
      country: office.country,
      postcode: String(10000 + i),
      accountStatus,
      contractType: rng.pick(["Subscription", "Statement of Work", "Framework Agreement", "Retainer"]),
      contactFirst,
      contactLast,
      email: `${contactFirst}.${contactLast}@${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`.slice(0, 80),
      phone: `+1 555 ${String(1000000 + i).slice(-7)}`,
      taxId: `TAX-DME-${i}`,
      address: `${10 + (i % 80)} Commerce Street, ${office.city}`,
      notes: `${DEMO_ENTERPRISE_TAG} Active Meridian Atlas customer.`,
      subscriptionStatus: accountStatus === "Active" ? "active" : accountStatus === "Onboarding" ? "pending_payment" : "inactive",
      billingFrequency: rng.pick(["monthly", "quarterly", "annual"]),
      renewalDate: daysAgo(-rng.int(20, 180)),
      createdDaysAgo: rng.int(20, 350),
    });
  }

  const activeClients = clients.filter((c) => c.accountStatus === "Active");

  const leads = [];
  for (let i = 1; i <= 100; i += 1) {
    const status = rng.pick(["Cold", "Warm", "Qualified", "Proposal", "Won", "Lost"]);
    leads.push({
      id: sqlUuid(`dme-lead-${i}`),
      companyName: `${rng.pick(CLIENT_PREFIXES)} ${rng.pick(["Ventures", "Digital", "Mutual", "Borough", "County"])} ${i}`,
      contactName: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
      status,
      email: `lead${i}@prospect.example`,
      value: rng.money(25000, 480000, 0),
      createdDaysAgo: rng.int(5, 360),
    });
  }

  const projects = [];
  const phases = ["Discovery", "Delivery", "UAT", "Hypercare", "Completed", "On Hold", "Cancelled"];
  const appPhaseFor = (phase) => {
    if (phase === "Delivery" || phase === "UAT" || phase === "Hypercare") return "live";
    if (phase === "Completed" || phase === "Cancelled") return "completed";
    return "upcoming";
  };
  for (let i = 1; i <= 55; i += 1) {
    const client = activeClients[i % activeClients.length];
    const phase = phases[i % phases.length];
    const progress =
      phase === "Completed" ? 100 : phase === "Cancelled" ? rng.int(10, 40) : rng.int(15, 92);
    const id = sqlUuid(`dme-prj-${i}`);
    const pm = rng.pick(employees.filter((e) => e.department === "Project Management"));
    projects.push({
      id,
      name: `${client.companyName.split(" ")[0]} ${rng.pick(["Modernisation", "Cloud Migration", "Platform Build", "Security Uplift", "Data Platform", "ERP Advisory"])}`,
      clientId: client.id,
      clientName: client.companyName,
      phase: appPhaseFor(phase),
      progressPct: progress,
      budget: rng.money(80000, 1200000, 0),
      owner: pm?.fullName ?? "PMO",
      startDaysAgo: rng.int(30, 340),
      tasks: Array.from({ length: rng.int(4, 8) }, (_, t) => ({
        id: sqlUuid(`dme-task-${i}-${t}`),
        name: rng.pick(["Kick-off", "Architecture", "Build sprint", "UAT", "Go-live", "Knowledge transfer", "Steering pack"]),
        milestone: t === 0 || t === 3,
        progress: phase === "Completed" ? 100 : rng.int(0, 100),
        startOffset: t * 12,
        dueOffset: t * 12 + 10,
        resource: rng.pick(employees).fullName,
      })),
    });
  }

  const tickets = [];
  for (let i = 1; i <= 80; i += 1) {
    const client = rng.pick(activeClients);
    tickets.push({
      id: `dme-tkt-${String(i).padStart(3, "0")}`,
      name: rng.pick(["Access request", "Billing query", "Performance issue", "Integration error", "User onboarding", "Report fix"]),
      organisation: client.companyName,
      clientId: client.id,
      priority: rng.pick(["low", "medium", "high", "urgent"]),
      description: `${DEMO_ENTERPRISE_TAG} Support case for ${client.companyName}.`,
      closed: rng.bool(0.55),
      createdDaysAgo: rng.int(1, 300),
    });
  }

  const invoices = [];
  let invSeq = 0;
  const todayIso = daysAgo(0);
  for (let m = 11; m >= 0; m -= 1) {
    const monthClients = rng.shuffle(activeClients).slice(0, rng.int(8, 14));
    for (const client of monthClients) {
      invSeq += 1;
      const amount = rng.money(12000, 180000, 2);
      const issue = monthsAgo(m, rng.int(3, 20));
      const netDays = rng.pick([14, 30, 45]);
      const due = addDays(issue, netDays);
      const statusRoll = rng.next();
      let status = "paid";
      if (m <= 1 && statusRoll > 0.55 && due < todayIso) status = "overdue";
      else if (m <= 1 && statusRoll > 0.7) status = "issued";
      if (statusRoll > 0.97) status = "cancelled";
      invoices.push({
        id: sqlUuid(`dme-inv-${invSeq}`),
        invoiceNumber: `MAG-DME-${String(invSeq).padStart(5, "0")}`,
        paymentReference: `MAGPAY${String(invSeq).padStart(6, "0")}`,
        clientId: client.id,
        amount,
        currency: rng.pick(["GBP", "USD", "EUR"]),
        status,
        issueDate: issue,
        dueDate: due,
        monthIndex: m,
      });
    }
  }

  const expenses = [];
  let expSeq = 0;
  for (let m = 11; m >= 0; m -= 1) {
    for (let k = 0; k < 14; k += 1) {
      expSeq += 1;
      const supplier = rng.pick(SUPPLIERS);
      const emp = rng.pick(employees);
      expenses.push({
        id: sqlUuid(`dme-exp-${expSeq}`),
        submitterUserId: emp.id,
        submitterName: emp.fullName,
        purpose: `${supplier.category}: ${supplier.name}`,
        supplier: supplier.name,
        amount: rng.money(120, 18000, 2),
        currency: "GBP",
        dateSubmitted: monthsAgo(m, rng.int(2, 27)),
        paid: m > 0 || rng.bool(0.6),
        categoryCode: rng.pick(["5010", "5030", "5040", "5050", "5060"]),
      });
    }
  }

  const calendar = [];
  for (let i = 1; i <= 90; i += 1) {
    const startDays = rng.int(0, 60);
    const hour = rng.int(9, 16);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + (rng.bool(0.55) ? -startDays : startDays));
    start.setUTCHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    calendar.push({
      id: sqlUuid(`dme-cal-${i}`),
      title: rng.pick([
        "Steering committee",
        "Client discovery",
        "Sprint review",
        "Board prep",
        "Architecture workshop",
        "QBR",
        "Recruitment interview",
      ]),
      eventType: rng.pick(["meeting", "onsite", "internal", "deadline"]),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    });
  }

  const actions = [];
  for (let i = 1; i <= 24; i += 1) {
    actions.push({
      id: sqlUuid(`dme-act-${i}`),
      priority: rng.pick(["High", "Medium", "Low"]),
      task: rng.pick([
        "Approve Q3 forecast pack",
        "Close overdue invoices follow-up",
        "Security review for Cloud Migration",
        "Hire senior cloud engineer",
        "Renew AWS enterprise agreement",
        "Prepare board cashflow slide",
      ]),
      assignedTo: rng.pick(employees).fullName,
      dueLabel: rng.pick(["Today", "This week", "Next week", "This month"]),
    });
  }

  const software = [
    { name: "Atlassian Cloud", vendor: "Atlassian", category: "Collaboration", monthly: 4200 },
    { name: "Microsoft 365 E5", vendor: "Microsoft", category: "Productivity", monthly: 9800 },
    { name: "Salesforce Enterprise", vendor: "Salesforce", category: "CRM", monthly: 7600 },
    { name: "Datadog", vendor: "Datadog", category: "Observability", monthly: 3100 },
    { name: "Okta Workforce", vendor: "Okta", category: "Identity", monthly: 2400 },
    { name: "GitHub Enterprise", vendor: "GitHub", category: "DevTools", monthly: 2900 },
    { name: "Notion Enterprise", vendor: "Notion", category: "Knowledge", monthly: 1100 },
    { name: "Figma Organization", vendor: "Figma", category: "Design", monthly: 1600 },
  ].map((s, i) => ({
    id: sqlUuid(`dme-sw-${i}`),
    ...s,
    annual: s.monthly * 12,
    licences: 100 + i * 5,
  }));

  // Monthly GL revenue/expense summaries for journals
  const monthlyFinance = [];
  for (let m = 11; m >= 0; m -= 1) {
    const monthInvoices = invoices.filter((inv) => inv.monthIndex === m && inv.status !== "cancelled");
    const revenue = monthInvoices.reduce((s, inv) => s + inv.amount, 0);
    const monthExpenses = expenses.filter((e) => e.dateSubmitted.startsWith(monthsAgo(m, 1).slice(0, 7)));
    const opex = monthExpenses.reduce((s, e) => s + e.amount, 0) + rng.money(180000, 260000, 2);
    monthlyFinance.push({
      month: monthsAgo(m, 1).slice(0, 7),
      journalDate: monthsAgo(m, 28),
      revenue: Number(revenue.toFixed(2)),
      opex: Number(opex.toFixed(2)),
    });
  }

  const wiseBalances = {
    GBP: 428500.42,
    USD: 312480.18,
    EUR: 198220.55,
  };
  const wiseTransactions = [];
  let tx = 0;
  for (const inv of invoices.filter((i) => i.status === "paid").slice(0, 60)) {
    tx += 1;
    wiseTransactions.push({
      id: `dme-wise-in-${tx}`,
      direction: "in",
      amount: inv.amount,
      currency: inv.currency,
      reference: inv.paymentReference,
      status: "completed",
      date: inv.issueDate,
      description: `Customer payment ${inv.invoiceNumber}`,
      invoiceId: inv.id,
    });
  }
  for (const exp of expenses.filter((e) => e.paid).slice(0, 40)) {
    tx += 1;
    wiseTransactions.push({
      id: `dme-wise-out-${tx}`,
      direction: "out",
      amount: exp.amount,
      currency: exp.currency,
      reference: `SUP-${exp.id.slice(0, 8)}`,
      status: rng.pick(["completed", "completed", "pending", "failed"]),
      date: exp.dateSubmitted,
      description: exp.purpose,
    });
  }
  // Payroll outs
  for (let m = 11; m >= 0; m -= 1) {
    tx += 1;
    wiseTransactions.push({
      id: `dme-wise-pay-${m}`,
      direction: "out",
      amount: rng.money(420000, 510000, 2),
      currency: "GBP",
      reference: `PAYROLL-${monthsAgo(m, 1).slice(0, 7)}`,
      status: "completed",
      date: monthsAgo(m, 28),
      description: "Monthly payroll",
    });
  }

  return {
    company: COMPANY,
    offices: OFFICES,
    employees,
    clients,
    leads,
    projects,
    tickets,
    invoices,
    expenses,
    calendar,
    actions,
    software,
    suppliers: SUPPLIERS,
    glAccounts: GL_ACCOUNTS,
    monthlyFinance,
    wiseBalances,
    wiseTransactions,
    tag: DEMO_ENTERPRISE_TAG,
  };
}
