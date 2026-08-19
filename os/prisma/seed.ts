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
import type { ServiceBucket, ClientLifecycleStage, ClientHealthStatus } from "../src/generated/prisma/enums";

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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
