import type { Admin, PrismaClient } from "@prisma/client";
import argon2 from "argon2";

/** What's safe to send to the frontend — passwordHash never leaves this file. */
export interface PublicAdmin {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export function toPublicAdmin(admin: Admin): PublicAdmin {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    lastLoginAt: admin.lastLoginAt,
  };
}

/**
 * Verifies an email/password pair against the stored admin record.
 * Returns the admin on success, or null on any failure — deliberately
 * collapsing "no such email" and "wrong password" into the same outcome
 * so the login endpoint can't be used to enumerate valid admin emails.
 */
export async function verifyAdminCredentials(
  prisma: PrismaClient,
  email: string,
  password: string
): Promise<Admin | null> {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    // Still run a hash comparison against a dummy value so the response
    // time for "unknown email" and "wrong password" stays roughly equal.
    await argon2.hash(password).catch(() => undefined);
    return null;
  }

  const valid = await argon2.verify(admin.passwordHash, password);
  return valid ? admin : null;
}

export async function touchLastLogin(prisma: PrismaClient, adminId: string): Promise<Admin> {
  return prisma.admin.update({
    where: { id: adminId },
    data: { lastLoginAt: new Date() },
  });
}
