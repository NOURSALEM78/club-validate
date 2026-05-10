import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, ShieldCheck, UserPlus, Loader2, ArrowRight } from "lucide-react";
import { checkMember, registerMember } from "@/lib/members.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

type Step = "check" | "registered" | "register" | "done";

const formSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير جدًا").max(120),
  university_email: z.string().trim().email("صيغة الإيميل غير صحيحة").max(255),
  university_id: z.string().trim().min(3, "الرقم الجامعي غير صحيح").max(50),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/u, "رقم الجوال غير صحيح"),
  college: z.string().trim().min(2, "الكلية / القسم مطلوب").max(150),
  gender: z.enum(["male", "female"], { message: "اختر الجنس" }),
});

const initialForm = {
  full_name: "",
  university_email: "",
  university_id: "",
  phone: "",
  college: "",
  gender: "" as "" | "male" | "female",
};

function Index() {
  const check = useServerFn(checkMember);
  const register = useServerFn(registerMember);

  const [step, setStep] = useState<Step>("check");
  const [identifier, setIdentifier] = useState("");
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopError(null);
    const value = identifier.trim();
    if (!value) {
      setTopError("يرجى إدخال الإيميل أو الرقم الجامعي");
      return;
    }
    setLoading(true);
    try {
      const res = await check({ data: { identifier: value } });
      if (res.found) {
        setMemberName(res.name);
        setStep("registered");
      } else {
        // Pre-fill the field that matches input type
        setForm({
          ...initialForm,
          university_email: value.includes("@") ? value.toLowerCase() : "",
          university_id: value.includes("@") ? "" : value,
        });
        setStep("register");
      }
    } catch {
      setTopError("حدث خطأ في الاتصال، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopError(null);
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await register({ data: parsed.data });
      if (res.ok) {
        setMemberName(parsed.data.full_name);
        setStep("done");
      } else {
        setTopError(res.error);
      }
    } catch {
      setTopError("حدث خطأ في الاتصال، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("check");
    setIdentifier("");
    setMemberName("");
    setForm(initialForm);
    setErrors({});
    setTopError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-[var(--shadow-elegant)]" style={{ background: "var(--gradient-hero)" }}>
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">نادي الطلاب</h1>
          <p className="text-muted-foreground">تحقق من تسجيلك أو انضم إلينا الآن</p>
        </div>

        <div
          className="rounded-2xl border border-border p-6 sm:p-8 shadow-[var(--shadow-elegant)]"
          style={{ background: "var(--gradient-card)" }}
        >
          {topError && (
            <div className="mb-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 px-4 py-3 text-sm">
              {topError}
            </div>
          )}

          {step === "check" && (
            <form onSubmit={onCheck} className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">التحقق من العضوية</h2>
                <p className="text-sm text-muted-foreground">أدخل الإيميل الجامعي أو الرقم الجامعي</p>
              </div>
              <Field
                label="الإيميل الجامعي أو الرقم الجامعي"
                value={identifier}
                onChange={setIdentifier}
                placeholder="example@uni.edu.sa أو 4412345"
                autoFocus
              />
              <SubmitButton loading={loading} icon={<ArrowRight className="w-5 h-5" />}>
                تحقق
              </SubmitButton>
            </form>
          )}

          {step === "registered" && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 text-success mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">أنت مسجل مسبقًا في النادي</h2>
              <p className="text-muted-foreground mb-1">مرحبًا بعودتك</p>
              <p className="text-xl font-semibold text-primary mb-6">{memberName}</p>
              <button
                onClick={reset}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                تحقق من عضو آخر
              </button>
            </div>
          )}

          {step === "register" && (
            <form onSubmit={onRegister} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">تسجيل عضو جديد</h2>
                  <p className="text-sm text-muted-foreground">أكمل بياناتك للانضمام للنادي</p>
                </div>
              </div>

              <Field label="الاسم الكامل" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} error={errors.full_name} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="الإيميل الجامعي" type="email" value={form.university_email} onChange={(v) => setForm({ ...form, university_email: v })} error={errors.university_email} />
                <Field label="الرقم الجامعي" value={form.university_id} onChange={(v) => setForm({ ...form, university_id: v })} error={errors.university_id} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="رقم الجوال" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={errors.phone} placeholder="05xxxxxxxx" />
                <Field label="الكلية / القسم" value={form.college} onChange={(v) => setForm({ ...form, college: v })} error={errors.college} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">الجنس</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setForm({ ...form, gender: g })}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                        form.gender === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {g === "male" ? "ذكر" : "أنثى"}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="mt-1 text-xs text-destructive">{errors.gender}</p>}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-3 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
                >
                  رجوع
                </button>
                <div className="flex-1">
                  <SubmitButton loading={loading}>تسجيل</SubmitButton>
                </div>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 text-success mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">تم تسجيلك بنجاح</h2>
              <p className="text-muted-foreground mb-1">أهلًا بك في النادي</p>
              <p className="text-xl font-semibold text-primary mb-6">{memberName}</p>
              <button
                onClick={reset}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                تحقق من عضو آخر
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} نادي الطلاب — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm ${
          error ? "border-destructive" : "border-input"
        }`}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SubmitButton({
  loading,
  children,
  icon,
}: {
  loading: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-primary-foreground font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] shadow-[var(--shadow-elegant)]"
      style={{ background: "var(--gradient-hero)" }}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
}
