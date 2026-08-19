/**
 * Demo seed data — fictional client names only, safe to run against a demo
 * Supabase project. See /docs/setup.md "Seeding demo data".
 *
 * Deliberately does NOT create any Membership rows: the first real person
 * to sign up becomes Managing Partner automatically (src/lib/auth/session.ts).
 * Seeding a fake membership here would break that bootstrap.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type {
  ServiceBucket,
  ClientLifecycleStage,
  ClientHealthStatus,
  RecurrenceType,
  TaskStatus,
} from "../src/generated/prisma/enums";
import { computePeriodEnd, computeTaskDueDate } from "../src/lib/workflow/period";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DIRECT_URL (or DATABASE_URL) before seeding — see .env.example");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const ORG_SLUG = "cfoip";

type SeedClient = {
  name: string;
  country: string;
  currency: string;
  serviceBucket: ServiceBucket;
  lifecycleStage: ClientLifecycleStage;
  healthScore: number | null;
  healthStatus: ClientHealthStatus | null;
  contact: { name: string; email: string; role: string };
};

const CLIENTS: SeedClient[] = [
  { name: "Amboseli Fresh Foods Ltd", country: "Kenya", currency: "KES", serviceBucket: "MONTHLY_CFO", lifecycleStage: "ACTIVE", healthScore: 88, healthStatus: "HEALTHY", contact: { name: "Wanjiru Kamau", email: "wanjiru@amboselifresh.example", role: "Finance Manager" } },
  { name: "Baraka Logistics Group", country: "Kenya", currency: "KES", serviceBucket: "MONTHLY_CFO", lifecycleStage: "ACTIVE", healthScore: 74, healthStatus: "WATCH", contact: { name: "David Otieno", email: "david@barakalogistics.example", role: "CEO" } },
  { name: "Cascade Consumer Brands", country: "Kenya", currency: "KES", serviceBucket: "BOOKKEEPING_OVERSIGHT", lifecycleStage: "ACTIVE", healthScore: 91, healthStatus: "HEALTHY", contact: { name: "Grace Mutiso", email: "grace@cascadebrands.example", role: "Operations Lead" } },
  { name: "Dawa Health Distributors", country: "Kenya", currency: "KES", serviceBucket: "BOOKKEEPING_OVERSIGHT", lifecycleStage: "ONBOARDING", healthScore: null, healthStatus: null, contact: { name: "Peter Njoroge", email: "peter@dawahealth.example", role: "Founder" } },
  { name: "Equator Agritech", country: "Kenya", currency: "USD", serviceBucket: "CASH_FLOW_ADVISORY", lifecycleStage: "ACTIVE", healthScore: 65, healthStatus: "WATCH", contact: { name: "Amina Yusuf", email: "amina@equatoragritech.example", role: "COO" } },
  { name: "Falcon Freight Solutions", country: "Tanzania", currency: "USD", serviceBucket: "CASH_FLOW_ADVISORY", lifecycleStage: "AT_RISK", healthScore: 41, healthStatus: "AT_RISK", contact: { name: "Joseph Mwangi", email: "joseph@falconfreight.example", role: "Finance Director" } },
  { name: "Green Valley Dairy Co-op", country: "Kenya", currency: "KES", serviceBucket: "CASH_FLOW_ADVISORY", lifecycleStage: "RENEWING", healthScore: 82, healthStatus: "HEALTHY", contact: { name: "Susan Achieng", email: "susan@greenvalleydairy.example", role: "General Manager" } },
  { name: "Highland Coffee Traders", country: "Kenya", currency: "USD", serviceBucket: "INVESTOR_READINESS", lifecycleStage: "ACTIVE", healthScore: 77, healthStatus: "WATCH", contact: { name: "Michael Kiptoo", email: "michael@highlandcoffee.example", role: "CFO" } },
  { name: "Ilara Fintech", country: "Nigeria", currency: "USD", serviceBucket: "INVESTOR_READINESS", lifecycleStage: "ONBOARDING", healthScore: null, healthStatus: null, contact: { name: "Ngozi Chukwu", email: "ngozi@ilarafintech.example", role: "Co-founder" } },
  { name: "Jenga Construction Partners", country: "Kenya", currency: "KES", serviceBucket: "AD_HOC_PROJECTS", lifecycleStage: "ACTIVE", healthScore: 69, healthStatus: "WATCH", contact: { name: "Samuel Kimani", email: "samuel@jengaconstruction.example", role: "MD" } },
  { name: "Kito Renewable Energy", country: "Rwanda", currency: "USD", serviceBucket: "AD_HOC_PROJECTS", lifecycleStage: "PAUSED", healthScore: 55, healthStatus: "WATCH", contact: { name: "Aline Uwase", email: "aline@kitoenergy.example", role: "Finance Lead" } },
  { name: "Lulu Marketplace Kenya", country: "Kenya", currency: "KES", serviceBucket: "MONTHLY_CFO", lifecycleStage: "PROSPECT", healthScore: null, healthStatus: null, contact: { name: "Faith Wambui", email: "faith@lulumarketplace.example", role: "Founder" } },
];

type SeedTaskTemplate = { title: string; order: number; relativeDueDays: number };
type SeedTemplate = {
  name: string;
  description: string;
  serviceBucket: ServiceBucket;
  recurrence: RecurrenceType;
  tasks: SeedTaskTemplate[];
};

const TEMPLATES: SeedTemplate[] = [
  {
    name: "Monthly Management Accounts",
    description: "Close the books, prepare management accounts and deliver the pack.",
    serviceBucket: "MONTHLY_CFO",
    recurrence: "MONTHLY",
    tasks: [
      { title: "Request source data from client", order: 0, relativeDueDays: 1 },
      { title: "Confirm bookkeeping close", order: 1, relativeDueDays: 5 },
      { title: "Prepare management accounts", order: 2, relativeDueDays: 10 },
      { title: "Internal quality review", order: 3, relativeDueDays: 12 },
      { title: "Release pack to client", order: 4, relativeDueDays: 15 },
    ],
  },
  {
    name: "Quarterly Board Pack",
    description: "Prepare and deliver the quarterly board reporting pack.",
    serviceBucket: "INVESTOR_READINESS",
    recurrence: "QUARTERLY",
    tasks: [
      { title: "Collect quarterly financials", order: 0, relativeDueDays: 5 },
      { title: "Draft board narrative and KPIs", order: 1, relativeDueDays: 20 },
      { title: "Partner review", order: 2, relativeDueDays: 25 },
      { title: "Send pack to board", order: 3, relativeDueDays: 30 },
    ],
  },
];

type SeedInstance = {
  clientName: string;
  templateName: string;
  periodStart: Date;
  /** Overrides the default NOT_STARTED status, keyed by task index in the template's task list. */
  taskStatusOverrides?: Record<number, TaskStatus>;
};

const INSTANCES: SeedInstance[] = [
  {
    // Fully delivered — a healthy, on-time example.
    clientName: "Amboseli Fresh Foods Ltd",
    templateName: "Monthly Management Accounts",
    periodStart: new Date(Date.UTC(2026, 6, 1)),
    taskStatusOverrides: { 0: "DELIVERED", 1: "DELIVERED", 2: "DELIVERED", 3: "APPROVED", 4: "DELIVERED" },
  },
  {
    // Behind schedule — several tasks left NOT_STARTED past their due date,
    // which the Calendar/Work pages surface as overdue.
    clientName: "Baraka Logistics Group",
    templateName: "Monthly Management Accounts",
    periodStart: new Date(Date.UTC(2026, 7, 1)),
    taskStatusOverrides: { 0: "DELIVERED", 1: "DELIVERED", 2: "IN_PROGRESS" },
  },
  {
    // Mid-quarter, also running behind.
    clientName: "Highland Coffee Traders",
    templateName: "Quarterly Board Pack",
    periodStart: new Date(Date.UTC(2026, 6, 1)),
    taskStatusOverrides: { 0: "DELIVERED", 1: "IN_PROGRESS" },
  },
];

async function main() {
  const org = await db.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: {
      slug: ORG_SLUG,
      name: "CFO Innovation Partners",
      currency: "KES",
      timezone: "Africa/Nairobi",
    },
  });

  for (const c of CLIENTS) {
    const existing = await db.client.findFirst({
      where: { organizationId: org.id, name: c.name },
    });
    const client = existing
      ? await db.client.update({
          where: { id: existing.id },
          data: {
            country: c.country,
            currency: c.currency,
            serviceBucket: c.serviceBucket,
            lifecycleStage: c.lifecycleStage,
            healthScore: c.healthScore,
            healthStatus: c.healthStatus,
          },
        })
      : await db.client.create({
          data: {
            organizationId: org.id,
            name: c.name,
            country: c.country,
            currency: c.currency,
            serviceBucket: c.serviceBucket,
            lifecycleStage: c.lifecycleStage,
            healthScore: c.healthScore,
            healthStatus: c.healthStatus,
          },
        });

    const hasContact = await db.clientContact.findFirst({
      where: { clientId: client.id, email: c.contact.email },
    });
    if (!hasContact) {
      await db.clientContact.create({
        data: {
          clientId: client.id,
          name: c.contact.name,
          email: c.contact.email,
          role: c.contact.role,
          isPrimary: true,
        },
      });
    }
  }

  console.log(`Seeded ${CLIENTS.length} demo clients into organization "${org.name}".`);

  const templateIdByName = new Map<string, string>();
  for (const t of TEMPLATES) {
    const existing = await db.workflowTemplate.findFirst({
      where: { organizationId: org.id, name: t.name },
    });
    const template = existing
      ? existing
      : await db.workflowTemplate.create({
          data: {
            organizationId: org.id,
            name: t.name,
            description: t.description,
            serviceBucket: t.serviceBucket,
            recurrence: t.recurrence,
          },
        });
    templateIdByName.set(t.name, template.id);

    const taskTemplateCount = await db.taskTemplate.count({
      where: { workflowTemplateId: template.id },
    });
    if (taskTemplateCount === 0) {
      await db.taskTemplate.createMany({
        data: t.tasks.map((task) => ({
          workflowTemplateId: template.id,
          title: task.title,
          order: task.order,
          relativeDueDays: task.relativeDueDays,
        })),
      });
    }
  }
  console.log(`Seeded ${TEMPLATES.length} workflow templates.`);

  let instancesCreated = 0;
  for (const seedInstance of INSTANCES) {
    const client = await db.client.findFirst({
      where: { organizationId: org.id, name: seedInstance.clientName },
    });
    const template = TEMPLATES.find((t) => t.name === seedInstance.templateName);
    const templateId = templateIdByName.get(seedInstance.templateName);
    if (!client || !template || !templateId) continue;

    const alreadyExists = await db.workflowInstance.findFirst({
      where: { clientId: client.id, workflowTemplateId: templateId, periodStart: seedInstance.periodStart },
    });
    if (alreadyExists) continue;

    const periodEnd = computePeriodEnd(seedInstance.periodStart, template.recurrence);
    await db.workflowInstance.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        workflowTemplateId: templateId,
        name: template.name,
        serviceBucket: template.serviceBucket,
        periodStart: seedInstance.periodStart,
        periodEnd,
        tasks: {
          create: template.tasks.map((task, index) => ({
            title: task.title,
            order: task.order,
            dueDate: computeTaskDueDate(seedInstance.periodStart, task.relativeDueDays),
            status: seedInstance.taskStatusOverrides?.[index] ?? "NOT_STARTED",
          })),
        },
      },
    });
    instancesCreated += 1;
  }
  console.log(`Seeded ${instancesCreated} workflow instances.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
