import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

/**
 * Bootstrap the FIRST administrator (one-off, for a fresh/production database).
 *
 * Unlike the demo seed, no password is baked in: the admin receives an
 * activation link (valid 7 days) to set their own password, then logs in with
 * the normal e-mail + password + OTP flow.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_EMAIL="vous@exemple.com"; $env:ADMIN_NAME="Votre Nom"; `
 *   $env:AUTH_URL="https://votre-domaine"; npx tsx prisma/create-admin.ts
 *
 * Re-running with the same e-mail just issues a fresh activation link.
 */
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const name = process.env.ADMIN_NAME ?? "Administrateur LMP";
  if (!email) {
    throw new Error("ADMIN_EMAIL est requis (ex. ADMIN_EMAIL=vous@exemple.com).");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "SUPER_ADMIN" },
    create: { email, name, role: "SUPER_ADMIN", status: "INVITED" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.inviteToken.create({
    data: {
      token,
      userId: user.id,
      purpose: "ACTIVATION",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
  });

  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  console.log("✓ Super administrateur prêt :", email);
  console.log("  Lien d'activation (à ouvrir une fois) :");
  console.log(`  ${base}/fr/activate/${token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
