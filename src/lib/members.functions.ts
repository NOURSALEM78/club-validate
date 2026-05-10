import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const identifierSchema = z.object({
  identifier: z.string().trim().min(1).max(255),
});

export const checkMember = createServerFn({ method: "POST" })
  .inputValidator((data) => identifierSchema.parse(data))
  .handler(async ({ data }) => {
    const value = data.identifier.trim();
    const { data: row, error } = await supabaseAdmin
      .from("members")
      .select("full_name, university_email, university_id")
      .or(`university_email.eq.${value},university_id.eq.${value}`)
      .maybeSingle();

    if (error) {
      console.error("checkMember error", error);
      return { found: false as const, error: "حدث خطأ أثناء التحقق" };
    }
    if (row) {
      return { found: true as const, name: row.full_name };
    }
    return { found: false as const, error: null };
  });

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير جدًا").max(120),
  university_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("صيغة الإيميل غير صحيحة")
    .max(255),
  university_id: z
    .string()
    .trim()
    .min(3, "الرقم الجامعي غير صحيح")
    .max(50),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,20}$/u, "رقم الجوال غير صحيح"),
  college: z.string().trim().min(2, "الكلية / القسم مطلوب").max(150),
  gender: z.enum(["male", "female"], { message: "اختر الجنس" }),
});

export const registerMember = createServerFn({ method: "POST" })
  .inputValidator((data) => registerSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: existing } = await supabaseAdmin
      .from("members")
      .select("id")
      .or(
        `university_email.eq.${data.university_email},university_id.eq.${data.university_id}`,
      )
      .maybeSingle();

    if (existing) {
      return { ok: false as const, error: "أنت مسجل مسبقًا في النادي." };
    }

    const { error } = await supabaseAdmin.from("members").insert(data);
    if (error) {
      console.error("registerMember error", error);
      if (error.code === "23505") {
        return { ok: false as const, error: "الإيميل أو الرقم الجامعي مسجل مسبقًا." };
      }
      return { ok: false as const, error: "تعذر إتمام التسجيل، حاول لاحقًا." };
    }
    return { ok: true as const };
  });