"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { banks, cardNetworks, categories } from "@/db/schema-v2";
import { getCurrentUser } from "@/lib/auth";

// v2 config CRUD — admin เท่านั้น · เขียนเฉพาะ schema v2 (ไม่แตะ public)
const PAGE_PATH = "/v2/config";

export type ActionResult = { ok: true } | { ok: false; error: string };

const codeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,40}$/, "code ใช้ได้แค่ a-z 0-9 และ - (ไม่เกิน 40 ตัว)");
const hexSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "สีต้องเป็น hex เช่น #5F5E5A");
const optionalText = z
  .string()
  .trim()
  .max(120)
  .transform((v) => (v === "" ? null : v))
  .nullable();
const sortSchema = z.number().int().min(0).max(9999);
const uuidSchema = z.string().uuid();

const bankSchema = z.object({
  code: codeSchema,
  shortName: z.string().trim().min(1, "กรอกชื่อย่อ").max(20),
  nameTh: z.string().trim().min(1, "กรอกชื่อไทย").max(120),
  nameEn: optionalText,
  brandBg: hexSchema,
  brandFg: hexSchema,
  sortOrder: sortSchema,
  isActive: z.boolean(),
});
export type BankInput = z.input<typeof bankSchema>;

const categorySchema = z.object({
  code: codeSchema,
  nameTh: z.string().trim().min(1, "กรอกชื่อไทย").max(120),
  nameEn: optionalText,
  icon: z.string().trim().min(1, "เลือกไอคอน").max(60),
  colorBg: hexSchema,
  colorFg: hexSchema,
  sortOrder: sortSchema,
  isActive: z.boolean(),
});
export type CategoryInput = z.input<typeof categorySchema>;

const networkSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1, "กรอกชื่อ").max(60),
  sortOrder: sortSchema,
  isActive: z.boolean(),
});
export type NetworkInput = z.input<typeof networkSchema>;

type Entity = "bank" | "category" | "network";
const TABLES = { bank: banks, category: categories, network: cardNetworks };

async function assertAdmin() {
  const user = await getCurrentUser();
  if (user.role !== "admin") throw new Error("Forbidden");
}

function toError(err: unknown): ActionResult {
  if (err instanceof z.ZodError) {
    return { ok: false, error: err.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const code = (err as { code?: string; cause?: { code?: string } })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  if (code === "23505") return { ok: false, error: "code นี้มีอยู่แล้ว" };
  console.error("[v2/config]", err);
  return { ok: false, error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
}

async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await assertAdmin();
    await fn();
    revalidatePath(PAGE_PATH);
    return { ok: true };
  } catch (err) {
    return toError(err);
  }
}

export async function saveConfigItem(
  entity: Entity,
  id: string | null,
  input: BankInput | CategoryInput | NetworkInput
): Promise<ActionResult> {
  return run(async () => {
    const rowId = id ? uuidSchema.parse(id) : null;
    const now = new Date();
    switch (entity) {
      case "bank": {
        const data = bankSchema.parse(input);
        if (rowId) {
          await db.update(banks).set({ ...data, updatedAt: now }).where(eq(banks.id, rowId));
        } else {
          await db.insert(banks).values(data);
        }
        return;
      }
      case "category": {
        const data = categorySchema.parse(input);
        if (rowId) {
          await db
            .update(categories)
            .set({ ...data, updatedAt: now })
            .where(eq(categories.id, rowId));
        } else {
          await db.insert(categories).values(data);
        }
        return;
      }
      case "network": {
        const data = networkSchema.parse(input);
        if (rowId) {
          await db
            .update(cardNetworks)
            .set({ ...data, updatedAt: now })
            .where(eq(cardNetworks.id, rowId));
        } else {
          await db.insert(cardNetworks).values(data);
        }
        return;
      }
    }
  });
}

export async function toggleConfigItem(
  entity: Entity,
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  return run(async () => {
    const table = TABLES[entity];
    await db
      .update(table)
      .set({ isActive: z.boolean().parse(isActive), updatedAt: new Date() })
      .where(eq(table.id, uuidSchema.parse(id)));
  });
}

export async function deleteConfigItem(
  entity: Entity,
  id: string
): Promise<ActionResult> {
  return run(async () => {
    const table = TABLES[entity];
    await db.delete(table).where(eq(table.id, uuidSchema.parse(id)));
  });
}
