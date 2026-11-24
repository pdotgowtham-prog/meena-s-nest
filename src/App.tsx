import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight, Baby, CalendarDays, Check, ChevronRight, CircleHelp,
  Copy, FileText, Heart, LogOut, Mail, Settings,
  ShieldCheck, Sparkles, UploadCloud, Users, Wallet, X, Moon, Sun
} from "lucide-react";
import { APP_NAME, VAULT_BUCKET } from "./constants/app";
import { supabase } from "./lib/supabase";
import { formatCurrency, formatDate, localToday } from "./lib/date";
import { calculateEdd, calculateGestationalAge, daysUntilDue, trimesterForWeek } from "./lib/pregnancy";
import { authSchema, expenseSchema, inviteSchema, profileSchema, vaultSchema, workspaceSchema } from "./lib/validation";
import { EmptyState, Illustration } from "./components/Illustration";
import type { Database } from "./lib/database.types";

type Profile = Database["public"]["Tables"]["pregnancy_profiles"]["Row"];
type Page = "home" | "expenses" | "vault" | "family" | "more";
type Workspace = { id: string; name: string; role: "owner" | "partner" };

const navItems: { id: Page; label: string; icon: "home" | "expenses" | "vault" | "family" | "more" }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "expenses", label: "Expenses", icon: "expenses" },
  { id: "vault", label: "Vault", icon: "vault" },
  { id: "family", label: "Family", icon: "family" },
  { id: "more", label: "More", icon: "more" }
];

function NavGlyph({ name }: { name: (typeof navItems)[number]["icon"] }) {
  const paths: Record<string, string> = {
    home: "M3 10.8 12 3l9 7.8M5.5 9.5V21h13V9.5M9 21v-7h6v7",
    expenses: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
    vault: "M3 7.5h7l2 2H21v10H3zM3 7.5V5h8l2 2",
    family: "M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 4.5a3 3 0 0 1 0 5.8M20 20v-1.5a4.5 4.5 0 0 0-3.2-4.3",
    more: "M4 6h16M4 12h16M4 18h16"
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function requestPasswordReset() {
    setBusy(true); setError(""); setNotice("");
    const parsed = authSchema.shape.email.safeParse(email);
    if (!parsed.success) { setError("Enter your account email address first."); setBusy(false); return; }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/?password-reset=1` });
      if (resetError) throw resetError;
      setNotice("If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to send the reset email. Please try again."); }
    finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = authSchema.safeParse({ email, password });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check your sign-in details."); return; }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: window.location.href } });
        if (authError) throw authError;
        setNotice(data.session ? "Your account is ready. Set up your shared space next." : "Check your email to confirm your account, then return here to sign in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (authError) throw authError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
    <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-[#F2C9C0]/35 blur-3xl" />
    <div className="pointer-events-none absolute -right-16 bottom-8 h-72 w-72 rounded-full bg-[#A8B99A]/35 blur-3xl" />
    <section className="card paper relative grid w-full max-w-4xl overflow-hidden md:grid-cols-[1.05fr_.95fr]">
      <div className="flex flex-col justify-between bg-[#F4EBDD] p-7 md:p-10">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#75583C]"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/80"><Heart size={17}/></span> A little space for your growing family</div>
          <h1 className="serif mt-9 max-w-sm text-4xl leading-tight text-[#493628] md:text-5xl">{APP_NAME}</h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#735E49]">A calm, private place to keep your pregnancy journey organised, together.</p>
        </div>
        <Illustration kind="nest" week={18} className="mx-auto mt-6 w-full max-w-[300px]" />
        <p className="text-xs text-[#735E49]">One shared space. Two partners. A thousand little moments.</p>
      </div>
      <div className="p-7 md:p-10">
        <div className="mb-7 flex gap-2 rounded-full bg-[#F5EFE6] p-1">
          <button type="button" onClick={() => setMode("login")} className={"flex-1 rounded-full px-4 py-2 text-sm font-semibold " + (mode === "login" ? "bg-white text-[#583F2B] shadow-sm" : "text-[#735E49]")}>Sign in</button>
          <button type="button" onClick={() => setMode("signup")} className={"flex-1 rounded-full px-4 py-2 text-sm font-semibold " + (mode === "signup" ? "bg-white text-[#583F2B] shadow-sm" : "text-[#735E49]")}>Create account</button>
        </div>
        <h2 className="serif text-3xl text-[#493628]">{mode === "login" ? "Welcome back" : "Begin your little journey"}</h2>
        <p className="mt-2 text-sm leading-6 text-[#735E49]">{mode === "login" ? "Sign in to return to your shared space." : "Create your account first. You can invite your partner after setup."}</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          <label className="block"><span className="field-label">Email address</span><input className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></label>
          <label className="block"><span className="field-label">Password</span><input className="input" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters"/></label>
          {mode === "login" && <button type="button" disabled={busy} onClick={() => void requestPasswordReset()} className="text-sm font-semibold text-[#76583C] underline underline-offset-4 disabled:opacity-50">Forgot password?</button>}
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-[#E8F0E4] px-3 py-2 text-sm text-[#405A3B]">{notice}</p>}
          <button disabled={busy} className="btn-primary flex w-full items-center justify-center gap-2" type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={16}/></button>
        </form>
        <p className="mt-6 text-xs leading-5 text-[#735E49]"><ShieldCheck size={13} className="mr-1 inline"/> Your pregnancy records are stored in a private workspace, not in this public source-code repository.</p>
      </div>
    </section>
  </main>;
}

function PasswordResetScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("The passwords do not match."); return; }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else { setDone(true); const url = new URL(window.location.href); url.searchParams.delete("password-reset"); window.history.replaceState({}, "", url.pathname + url.search + url.hash); }
    setBusy(false);
  }
  return <main className="flex min-h-screen items-center justify-center px-4 py-10"><section className="card paper w-full max-w-md p-7 md:p-9"><div className="mb-5 flex items-center gap-2 text-[#76583C]"><Heart size={20}/><span className="serif text-2xl">{APP_NAME}</span></div><h1 className="serif text-3xl text-[#493628]">{done ? "Password updated" : "Choose a new password"}</h1><p className="mt-2 text-sm leading-6 text-[#735E49]">{done ? "Your password has been changed. You can continue to your private space." : "Create a new password for your account."}</p>{!done && <form onSubmit={submit} className="mt-6 space-y-4"><label className="block"><span className="field-label">New password</span><input className="input" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)}/></label><label className="block"><span className="field-label">Confirm new password</span><input className="input" type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)}/></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}<button className="btn-primary w-full" disabled={busy} type="submit">{busy ? "Updating…" : "Update password"}</button></form>}{done && <button className="btn-primary mt-6 w-full" onClick={() => window.location.assign(window.location.origin)}>Continue to Meena’s Nest</button>}</section></main>;
}

function WorkspaceSetup({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [name, setName] = useState("Our little nest");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = workspaceSchema.safeParse({ name });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the workspace name."); return; }
    setBusy(true); setError("");
    const { error: createError } = await supabase.rpc("create_workspace", { p_name: parsed.data.name });
    if (createError) setError(createError.message);
    else await onCreated();
    setBusy(false);
  }

  return <main className="flex min-h-screen items-center justify-center px-4 py-10">
    <section className="card paper w-full max-w-xl p-7 md:p-10">
      <Illustration kind="nest" week={4} className="mx-auto mb-2 h-40"/>
      <p className="text-center text-xs font-semibold uppercase tracking-[.18em] text-[#735E49]">A shared beginning</p>
      <h1 className="serif mt-2 text-center text-3xl text-[#493628]">Make a little room for both of you</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-[#735E49]">Create one private workspace. Your partner can join using an invitation link after they create or sign in to their account.</p>
      <form onSubmit={submit} className="mt-7 space-y-3">
        <label className="block"><span className="field-label">Workspace name</span><input className="input" maxLength={80} value={name} onChange={(event) => setName(event.target.value)}/></label>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <button className="btn-primary w-full" disabled={busy} type="submit">{busy ? "Creating your space…" : "Create private workspace"}</button>
      </form>
      <p className="mt-4 text-center text-xs text-[#735E49]">Signed in as {userId ? "your account" : "—"}</p>
    </section>
  </main>;
}

function ProfileForm({ workspaceId, userId, profile, onSaved }: { workspaceId: string; userId: string; profile: Profile | null; onSaved: (value: Profile) => void }) {
  const [lmp, setLmp] = useState(profile?.lmp_date ?? "");
  const [edd, setEdd] = useState(profile?.due_date ?? "");
  const [babyName, setBabyName] = useState(profile?.baby_name ?? "");
  const [notes, setNotes] = useState(profile?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLmp(profile?.lmp_date ?? "");
    setEdd(profile?.due_date ?? "");
    setBabyName(profile?.baby_name ?? "");
    setNotes(profile?.notes ?? "");
  }, [profile]);

  function updateLmp(value: string) {
    setLmp(value);
    if (value) setEdd(calculateEdd(value));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ lmp_date: lmp, due_date: edd, baby_name: babyName, notes });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please check the details."); return; }
    setBusy(true); setError(""); setSaved(false);
    const data = {
      workspace_id: workspaceId,
      created_by: profile?.created_by ?? userId,
      lmp_date: parsed.data.lmp_date || null,
      due_date: parsed.data.due_date || null,
      baby_name: parsed.data.baby_name || null,
      notes: parsed.data.notes || null
    };
    const query = profile
      ? supabase.from("pregnancy_profiles").update(data).eq("id", profile.id).select("*").single()
      : supabase.from("pregnancy_profiles").insert(data).select("*").single();
    const { data: row, error: saveError } = await query;
    if (saveError) setError(saveError.message);
    else if (row) { onSaved(row); setSaved(true); }
    setBusy(false);
  }

  return <form onSubmit={submit} className="card p-5 md:p-6">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">Pregnancy profile</p><h2 className="serif mt-1 text-2xl text-[#493628]">{profile ? "Your journey details" : "Add your first details"}</h2></div>
      <span className="rounded-full bg-[#F4EBDD] p-2 text-[#735E49]"><Baby size={20}/></span>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className="field-label">Last menstrual period (LMP)</span><input className="input" type="date" value={lmp} onChange={(event) => updateLmp(event.target.value)}/></label>
      <label><span className="field-label">Estimated due date (EDD)</span><input className="input" type="date" value={edd} onChange={(event) => setEdd(event.target.value)}/></label>
      <label><span className="field-label">Baby's name (editable)</span><input className="input" maxLength={80} value={babyName} onChange={(event) => setBabyName(event.target.value)} placeholder="A name you are thinking of…"/></label>
      <label className="sm:col-span-2"><span className="field-label">Private notes (optional)</span><textarea className="input min-h-20 resize-y" maxLength={4000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything you'd like to remember…"/></label>
    </div>
    <p className="mt-3 text-xs leading-5 text-[#735E49]">EDD is pre-filled as 280 days after LMP. Your clinician's confirmed date can be entered manually. This is a date calculation, not medical advice.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
    {saved && <p role="status" className="mt-3 text-sm text-[#48623F]"><Check size={14} className="mr-1 inline"/> Saved to your private workspace.</p>}
    <button className="btn-primary mt-4" disabled={busy} type="submit">{busy ? "Saving…" : "Save pregnancy profile"}</button>
  </form>;
}

function Dashboard({ workspace, profile, userId, onProfileSaved, onNavigate }: {
  workspace: Workspace; profile: Profile | null; userId: string; onProfileSaved: (p: Profile) => void; onNavigate: (page: Page) => void;
}) {
  const age = useMemo(() => profile?.lmp_date ? calculateGestationalAge(profile.lmp_date, localToday()) : null, [profile?.lmp_date]);
  const week = age?.weeks ?? 0;
  const dueDays = profile?.due_date ? daysUntilDue(profile.due_date, localToday()) : null;
  const sizeGuide = week < 8 ? "blueberry" : week < 12 ? "lime" : week < 16 ? "avocado" : week < 20 ? "banana" : week < 24 ? "papaya" : week < 28 ? "eggplant" : week < 32 ? "coconut" : week < 36 ? "pineapple" : "small watermelon";
  const trimester = trimesterForWeek(week);
  const milestones = [
    { label: "12 weeks", active: week >= 12 },
    { label: "Halfway", active: week >= 20 },
    { label: "28 weeks", active: week >= 28 },
    { label: "Full term", active: week >= 37 }
  ];

  return <div className="space-y-6">
    <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <div className="card paper relative overflow-hidden p-6 md:p-8">
        <div className="relative z-10 max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[.17em] text-[#735E49]">Your shared little world</p>
          <h1 className="serif mt-2 text-3xl leading-tight text-[#493628] md:text-4xl">A little more love, <span className="italic text-[#735E49]">every day.</span></h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#75624F]">{profile?.baby_name ? "A cosy place for " + profile.baby_name + "'s journey and all the moments around it." : "Keep the dates, documents and little milestones of this journey together."}</p>
          {age && <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-[#5B4632]"><Sparkles size={15} className="text-[#B88942]"/> Week {age.weeks} + {age.days} days</div>}
          {!age && <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-[#5B4632]"><Heart size={15}/> Your journey starts here</div>}
        </div>
        <Illustration week={week} className="pointer-events-none absolute -bottom-1 right-0 w-44 opacity-95 sm:w-56 md:w-64"/>
      </div>
      <div className="card flex flex-col justify-between p-5 md:p-6">
        <div>
          <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">Due date</p><CalendarDays size={19} className="text-[#735E49]"/></div>
          <p className="serif mt-4 text-3xl text-[#493628]">{formatDate(profile?.due_date)}</p>
          <p className="mt-2 text-sm text-[#735E49]">{dueDays === null ? "Add your LMP or EDD to see the countdown." : dueDays >= 0 ? dueDays + " days to go, one day at a time." : Math.abs(dueDays) + " days since the estimated date."}</p>
        </div>
        <div className="mt-5 rounded-2xl bg-[#F5EFE6] p-3">
          <div className="flex items-center justify-between text-xs text-[#705A43]"><span>Trimester {trimester}</span><span>{age ? "Week " + week : "Not calculated"}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E6DCCE]"><div className="h-full rounded-full bg-[#A8B99A]" style={{ width: Math.min(100, age ? (age.totalDays / 280) * 100 : 0) + "%" }}/></div>
        </div>
      </div>
    </section>

    {!profile?.lmp_date && <ProfileForm workspaceId={workspace.id} userId={userId} profile={profile} onSaved={onProfileSaved}/>}
    {profile?.lmp_date && <section className="grid gap-4 md:grid-cols-[.8fr_1.2fr]">
      <div className="card flex items-center gap-3 p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#F4EBDD]"><span className="serif text-2xl text-[#76583C]">{week || "—"}</span></div>
        <Illustration kind="fruit" week={week} className="h-20 w-24 shrink-0"/>
        <div className="min-w-0"><p className="text-xs text-[#735E49]">This week's guide</p><h2 className="serif text-xl text-[#493628]">About a {sizeGuide}</h2><p className="mt-1 text-xs text-[#735E49]">General guide, not medical advice.</p></div>
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">Little milestones</p><h2 className="serif mt-1 text-xl text-[#493628]">Look how far you've come</h2></div><Sparkles className="text-[#B88942]"/></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{milestones.map((item) => <div key={item.label} className={"rounded-xl px-3 py-3 text-center text-xs font-semibold " + (item.active ? "bg-[#E8EFE4] text-[#405A3B]" : "bg-[#F5EFE6] text-[#735E49]")}><span className="block mb-1">{item.active ? "✦" : "○"}</span>{item.label}</div>)}</div>
      </div>
    </section>}
    {profile && <details className="card p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">Profile settings</p><h2 className="serif mt-1 text-xl text-[#493628]">Edit journey details</h2></div><ChevronRight size={18} className="text-[#735E49]"/></summary>
      <div className="mt-5"><ProfileForm workspaceId={workspace.id} userId={userId} profile={profile} onSaved={onProfileSaved}/></div>
    </details>}
    <section className="grid gap-4 sm:grid-cols-2">
      <button onClick={() => onNavigate("expenses")} className="card flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F7E8E3] text-[#986A5B]"><Wallet size={22}/></span><span className="flex-1"><strong className="block text-[#493628]">Pregnancy expenses</strong><span className="text-sm text-[#735E49]">Keep the little costs organised</span></span><ArrowRight size={17}/></button>
      <button onClick={() => onNavigate("vault")} className="card flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E8EFE4] text-[#58704F]"><FileText size={22}/></span><span className="flex-1"><strong className="block text-[#493628]">Private document vault</strong><span className="text-sm text-[#735E49]">Keep reports in one safe place</span></span><ArrowRight size={17}/></button>
    </section>
    <p className="text-center text-xs text-[#735E49]">Space: {workspace.name} · Shared only with authorised members</p>
  </div>;
}

function ExpensePage({ workspace, userId }: { workspace: Workspace; userId: string }) {
  type Expense = Database["public"]["Tables"]["expenses"]["Row"];
  type Consultation = Database["public"]["Tables"]["consultations"]["Row"];
  type Doc = Database["public"]["Tables"]["vault_documents"]["Row"];
  const [expenses,setExpenses]=useState<Expense[]>([]);
  const [visits,setVisits]=useState<Consultation[]>([]);
  const [docs,setDocs]=useState<Doc[]>([]);
  const [editing,setEditing]=useState<Consultation|null>(null);
  const [visitDate,setVisitDate]=useState(localToday());
  const [week,setWeek]=useState(""); const [doctor,setDoctor]=useState(""); const [speciality,setSpeciality]=useState("");
  const [hospital,setHospital]=useState(""); const [reason,setReason]=useState(""); const [notes,setNotes]=useState("");
  const [advice,setAdvice]=useState(""); const [followUp,setFollowUp]=useState(""); const [fee,setFee]=useState("");
  const [payment,setPayment]=useState("upi"); const [files,setFiles]=useState<File[]>([]);
  const [amount,setAmount]=useState(""); const [date,setDate]=useState(localToday());
  const [category,setCategory]=useState<Expense["category"]>("scan"); const [merchant,setMerchant]=useState(""); const [description,setDescription]=useState("");
  const [expenseFiles,setExpenseFiles]=useState<File[]>([]);
  const [editingExpense,setEditingExpense]=useState<Expense|null>(null);
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [loaded,setLoaded]=useState(false); const [expanded,setExpanded]=useState<string|null>(null);
  const [removed,setRemoved]=useState<Expense|null>(null);
  const [removedDocIds,setRemovedDocIds]=useState<string[]>([]);
  const [expandedExpense,setExpandedExpense]=useState<string|null>(null);
  const [deleteTarget,setDeleteTarget]=useState<{kind:"visit";row:Consultation}|{kind:"expense";row:Expense}|null>(null);
  const longPressTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  function startLongPress(target:{kind:"visit";row:Consultation}|{kind:"expense";row:Expense}){if(longPressTimer.current)clearTimeout(longPressTimer.current);longPressTimer.current=setTimeout(()=>setDeleteTarget(target),650);}
  function cancelLongPress(){if(longPressTimer.current){clearTimeout(longPressTimer.current);longPressTimer.current=null;}}
  const load=useCallback(async()=>{
    const [a,b,c]=await Promise.all([
      supabase.from("expenses").select("*").eq("workspace_id",workspace.id).is("deleted_at",null).order("expense_date",{ascending:false}),
      supabase.from("consultations").select("*").eq("workspace_id",workspace.id).is("deleted_at",null).order("consultation_date",{ascending:false}),
      supabase.from("vault_documents").select("*").eq("workspace_id",workspace.id).is("deleted_at",null).order("created_at",{ascending:false})
    ]);
    if(a.error||b.error||c.error) setError(a.error?.message||b.error?.message||c.error?.message||"Unable to load records.");
    setExpenses(a.data??[]); setVisits(b.data??[]); setDocs(c.data??[]); setLoaded(true);
  },[workspace.id]);
  useEffect(()=>{void load();},[load]);
  function clearForm(){setEditing(null);setVisitDate(localToday());setWeek("");setDoctor("");setSpeciality("");setHospital("");setReason("");setNotes("");setAdvice("");setFollowUp("");setFee("");setPayment("upi");setFiles([]);const el=document.getElementById("visit-files") as HTMLInputElement|null;if(el)el.value="";}
  function openVisit(v:Consultation){setEditing(v);setVisitDate(v.consultation_date);setWeek(v.pregnancy_week?.toString()??"");setDoctor(v.doctor_name??"");setSpeciality(v.speciality??"");setHospital(v.hospital??"");setReason(v.reason??"");setNotes(v.notes??"");setAdvice(v.advice??"");setFollowUp(v.follow_up_date??"");setFee(v.fee_amount?.toString()??"");setPayment(v.payment_method??"upi");setExpanded(v.id);setFiles([]);const el=document.getElementById("visit-files") as HTMLInputElement|null;if(el)el.value="";window.scrollTo({top:0,behavior:"smooth"});}
  async function openDoc(path:string){const {data,error:e}=await supabase.storage.from(VAULT_BUCKET).createSignedUrl(path,60);if(e)setError(e.message);else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");}
  async function saveVisit(event:FormEvent){
    event.preventDefault();const f=fee.trim()?Number(fee):null;
    if(f!==null&&(!Number.isFinite(f)||f<0||f>99999999.99)){setError("Enter a valid consultation fee.");return;}
    if(week&&(!Number.isInteger(Number(week))||Number(week)<1||Number(week)>45)){setError("Pregnancy week must be between 1 and 45.");return;}
    const invalidFile=files.find(file=>!["application/pdf","image/jpeg","image/png","image/webp","image/heic","image/heif"].includes(file.type)||file.size>10*1024*1024);if(invalidFile){setError("Each attachment must be a PDF or image up to 10 MB: "+invalidFile.name);return;}
    setBusy(true);setError("");
    const payload={workspace_id:workspace.id,created_by:editing?.created_by??userId,consultation_date:visitDate,pregnancy_week:week?Number(week):null,doctor_name:doctor.trim()||null,speciality:speciality.trim()||null,hospital:hospital.trim()||null,reason:reason.trim()||null,notes:notes.trim()||null,advice:advice.trim()||null,follow_up_date:followUp||null,fee_amount:f,payment_method:f===null?null:payment};
    const result=editing?await supabase.from("consultations").update(payload).eq("id",editing.id).select("*").single():await supabase.from("consultations").insert(payload).select("*").single();
    if(result.error||!result.data){setError(result.error?.message??"Could not save consultation.");setBusy(false);return;}
    const visit=result.data;const oldFee=expenses.find(x=>x.consultation_id===visit.id);
    if(f!==null&&f>0){const feeRow={workspace_id:workspace.id,created_by:editing?.created_by??userId,expense_date:visitDate,amount:f,currency:"INR" as const,category:"consultation",merchant:hospital||doctor||"Consultation",description:"Consultation fee",consultation_id:visit.id};
      const feeResult=oldFee?await supabase.from("expenses").update(feeRow).eq("id",oldFee.id):await supabase.from("expenses").insert(feeRow);
      if(feeResult.error)setError("Visit saved; fee entry issue: "+feeResult.error.message);
    }else if(oldFee){await supabase.from("expenses").update({deleted_at:new Date().toISOString()}).eq("id",oldFee.id);}
    const failedFiles:string[]=[];for(const file of files){const path=workspace.id+"/"+crypto.randomUUID();const up=await supabase.storage.from(VAULT_BUCKET).upload(path,file,{contentType:file.type});if(up.error){failedFiles.push(file.name+" ("+up.error.message+")");continue;}const d=await supabase.from("vault_documents").insert({workspace_id:workspace.id,created_by:userId,title:file.name,category:file.type==="application/pdf"?"lab_report":"prescription",file_name:file.name,storage_path:path,mime_type:file.type,size_bytes:file.size,document_date:visitDate,notes:"Attached to consultation",consultation_id:visit.id});if(d.error){await supabase.storage.from(VAULT_BUCKET).remove([path]);failedFiles.push(file.name+" ("+d.error.message+")");}}if(failedFiles.length)setError("Visit saved, but these attachments could not be added: "+failedFiles.join("; "));
    clearForm();await load();setBusy(false);
  }
  function openExpense(x:Expense){setEditingExpense(x);setAmount(String(x.amount));setDate(x.expense_date);setCategory(x.category);setMerchant(x.merchant??"");setDescription(x.description??"");setExpenseFiles([]);const input=document.getElementById("expense-files") as HTMLInputElement|null;if(input)input.value="";setError("");window.scrollTo({top:0,behavior:"smooth"});}
  function clearExpenseForm(){setEditingExpense(null);setAmount("");setDate(localToday());setCategory("scan");setMerchant("");setDescription("");setExpenseFiles([]);const input=document.getElementById("expense-files") as HTMLInputElement|null;if(input)input.value="";setError("");}
  async function addExpense(event:FormEvent){event.preventDefault();const p=expenseSchema.safeParse({amount,expense_date:date,category,merchant,description});if(!p.success){setError(p.error.issues[0]?.message??"Check expense details.");return;}const invalid=expenseFiles.find(file=>!["application/pdf","image/jpeg","image/png","image/webp","image/heic","image/heif"].includes(file.type)||file.size>10*1024*1024);if(invalid){setError("Each attachment must be a PDF or image up to 10 MB: "+invalid.name);return;}setBusy(true);setError("");const payload={workspace_id:workspace.id,created_by:editingExpense?.created_by??userId,amount:p.data.amount,expense_date:p.data.expense_date,category:p.data.category,merchant:p.data.merchant||null,description:p.data.description||null,currency:"INR" as const};const result=editingExpense?await supabase.from("expenses").update(payload).eq("id",editingExpense.id).select("*").single():await supabase.from("expenses").insert(payload).select("*").single();const expense=result.data;if(result.error||!expense){setError(result.error?.message??"Could not save expense.");setBusy(false);return;}const failed:string[]=[];for(const file of expenseFiles){const path=workspace.id+"/"+crypto.randomUUID();const up=await supabase.storage.from(VAULT_BUCKET).upload(path,file,{contentType:file.type,upsert:false});if(up.error){failed.push(file.name+" ("+up.error.message+")");continue;}const docCategory=category==="scan"?"scan":category==="lab_test"?"lab_report":category==="medicine"?"prescription":"other";const d=await supabase.from("vault_documents").insert({workspace_id:workspace.id,created_by:userId,title:file.name,category:docCategory,file_name:file.name,storage_path:path,mime_type:file.type,size_bytes:file.size,document_date:date,notes:"Attached to expense: "+(description||category.replaceAll("_"," ")),expense_id:expense.id});if(d.error){await supabase.storage.from(VAULT_BUCKET).remove([path]);failed.push(file.name+" ("+d.error.message+")");}}clearExpenseForm();if(failed.length)setError("Expense saved, but these attachments could not be added: "+failed.join("; "));await load();setBusy(false);}
  async function removeExpense(id:string){const old=expenses.find(x=>x.id===id)??null;if(!old)return;setError("");const linked=docs.filter(d=>d.expense_id===id&&!d.deleted_at);const stamp=new Date().toISOString();const ids=linked.map(d=>d.id);if(ids.length){const {error:de}=await supabase.from("vault_documents").update({deleted_at:stamp}).in("id",ids);if(de){setError("Could not delete linked files: "+de.message);return;}}const {error:e}=await supabase.from("expenses").update({deleted_at:stamp}).eq("id",id);if(e){if(ids.length)await supabase.from("vault_documents").update({deleted_at:null}).in("id",ids);setError("Could not delete this expense: "+e.message);return;}setRemoved(old);setRemovedDocIds(ids);await load();}
  async function undo(){if(!removed)return;const {error:e}=await supabase.from("expenses").update({deleted_at:null}).eq("id",removed.id);if(e){setError(e.message);return;}if(removedDocIds.length){const {error:de}=await supabase.from("vault_documents").update({deleted_at:null}).in("id",removedDocIds);if(de)setError("Expense restored, but its documents could not all be restored: "+de.message);}setRemoved(null);setRemovedDocIds([]);await load();}
  async function removeVisit(v:Consultation){
    setError("");
    const stamp=new Date().toISOString();
    const linkedDocs=docs.filter(d=>d.consultation_id===v.id&&!d.deleted_at);
    const linkedFee=expenses.find(x=>x.consultation_id===v.id&&!x.deleted_at);
    const docIds=linkedDocs.map(d=>d.id);
    if(docIds.length){
      const {error:docError}=await supabase.from("vault_documents").update({deleted_at:stamp}).in("id",docIds);
      if(docError){setError("Could not remove consultation documents: "+docError.message);return;}
    }
    if(linkedFee){
      const {error:feeError}=await supabase.from("expenses").update({deleted_at:stamp}).eq("id",linkedFee.id);
      if(feeError){if(docIds.length)await supabase.from("vault_documents").update({deleted_at:null}).in("id",docIds);setError("Could not remove consultation fee: "+feeError.message);return;}
    }
    const {error:e}=await supabase.from("consultations").update({deleted_at:stamp}).eq("id",v.id);
    if(e){
      if(linkedFee)await supabase.from("expenses").update({deleted_at:null}).eq("id",linkedFee.id);
      if(docIds.length)await supabase.from("vault_documents").update({deleted_at:null}).in("id",docIds);
      setError("Could not remove this consultation: "+e.message);return;
    }
    if(editing?.id===v.id)clearForm();
    await load();
  }
  const total=expenses.reduce((n,x)=>n+Number(x.amount),0);
  const categories=["scan","lab_test","medicine","travel","nutrition","baby_items","insurance","other"];
  return <div className="space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">Medical records & spending</p><h1 className="serif mt-1 text-3xl text-[#493628]">Expenses</h1><p className="mt-1 text-sm text-[#735E49]">Consultations, fees, prescriptions, scan reports, bills and other pregnancy expenses together.</p></header>
    <div className="card flex items-center justify-between gap-4 bg-[#F1E9DC] p-5"><div><p className="text-xs text-[#735E49]">Total recorded spending</p><p className="serif mt-1 text-3xl text-[#493628]">{formatCurrency(total)}</p><p className="mt-1 text-xs text-[#735E49]">{visits.length} consultations · {expenses.length} expense entries</p></div><Wallet size={29} className="text-[#735E49]"/></div>
    <form onSubmit={saveVisit} className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#735E49]">{editing?"Editing previous visit":"Medical visit record"}</p><h2 className="serif text-xl text-[#493628]">{editing?"Update consultation":"Add consultation"}</h2></div>{editing&&<button type="button" onClick={clearForm} className="btn-secondary px-3 py-2 text-xs">Cancel</button>}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="field-label">Visit date</span><input className="input" type="date" required value={visitDate} onChange={e=>setVisitDate(e.target.value)}/></label>
        <label><span className="field-label">Pregnancy week</span><input className="input" type="number" min="1" max="45" value={week} onChange={e=>setWeek(e.target.value)} placeholder="Optional"/></label>
        <label><span className="field-label">Doctor name</span><input className="input" value={doctor} onChange={e=>setDoctor(e.target.value)} maxLength={140}/></label>
        <label><span className="field-label">Speciality</span><input className="input" value={speciality} onChange={e=>setSpeciality(e.target.value)} maxLength={100} placeholder="e.g. Gynaecologist"/></label>
        <label className="sm:col-span-2"><span className="field-label">Hospital / clinic</span><input className="input" value={hospital} onChange={e=>setHospital(e.target.value)} maxLength={180}/></label>
        <label className="sm:col-span-2"><span className="field-label">Reason for consultation</span><textarea className="input min-h-16" value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000}/></label>
        <label><span className="field-label">Consultation fee (₹)</span><input className="input" type="number" min="0" step="0.01" value={fee} onChange={e=>setFee(e.target.value)}/></label>
        <label><span className="field-label">Payment method</span><select className="input" value={payment} onChange={e=>setPayment(e.target.value)}><option value="upi">UPI</option><option value="cash">Cash</option><option value="card">Card</option><option value="insurance">Insurance</option><option value="other">Other</option></select></label>
        <label className="sm:col-span-2"><span className="field-label">Consultation notes</span><textarea className="input min-h-20" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={4000} placeholder="What was discussed during the visit?"/></label>
        <label className="sm:col-span-2"><span className="field-label">Doctor's advice / medicines / next steps</span><textarea className="input min-h-20" value={advice} onChange={e=>setAdvice(e.target.value)} maxLength={4000}/></label>
        <label><span className="field-label">Follow-up date</span><input className="input" type="date" value={followUp} onChange={e=>setFollowUp(e.target.value)}/></label>
        <label className="sm:col-span-2"><span className="field-label">Attach documents (select multiple PDFs/photos, max 10 MB each)</span><input id="visit-files" className="input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e=>setFiles(Array.from(e.target.files??[]))}/><span className="mt-1 block text-xs text-[#735E49]">You can select several files at once. Existing attachments stay linked when you edit a visit.</span>{files.length>0&&<span className="mt-2 block text-xs text-[#48623F]">{files.length} file{files.length===1?"":"s"} selected: {files.map(file=>file.name).join(", ")}</span>}</label>
      </div>
      {error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
      <button className="btn-primary mt-4" disabled={busy}>{busy?"Saving securely…":editing?"Save changes":"Save consultation"}</button>
    </form>
    <section className="card p-5"><div className="mb-3 flex items-center justify-between"><div><h2 className="serif text-xl text-[#493628]">Previous consultations</h2><p className="text-xs text-[#735E49]">Tap a visit to view options. You can also long-press it to delete.</p></div><span className="text-xs text-[#735E49]">{visits.length} records</span></div>
      {!loaded?<p className="py-6 text-sm text-[#735E49]">Loading…</p>:visits.length===0?<EmptyState title="No consultations yet" body="Add a visit above. Saved visits stay here for future viewing and editing."/>:<div className="divide-y divide-[#EEE5DA]">{visits.map(v=>{const expandedNow=expanded===v.id;const attached=docs.filter(d=>d.consultation_id===v.id);return <article key={v.id} className="py-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5EFE6] text-[#735E49]"><Heart size={18}/></span><button type="button" onTouchStart={()=>startLongPress({kind:"visit",row:v})} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress} onContextMenu={e=>{e.preventDefault();setDeleteTarget({kind:"visit",row:v});}} onClick={()=>setExpanded(expandedNow?null:v.id)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-[#493628]">{v.doctor_name?"Dr. "+v.doctor_name:"Consultation"}{v.hospital?" · "+v.hospital:""}</p><p className="text-xs text-[#735E49]">{formatDate(v.consultation_date)}{v.pregnancy_week?" · Week "+v.pregnancy_week:""}</p></button><div className="text-right"><p className="text-sm font-semibold text-[#493628]">{v.fee_amount!==null?formatCurrency(Number(v.fee_amount)):"—"}</p><button type="button" onClick={()=>openVisit(v)} className="text-xs font-semibold underline text-[#76583C]">Open / edit</button></div></div>
      {expandedNow&&<div className="mt-3 rounded-xl bg-[#F8F3EC] p-4 text-sm text-[#594936]">{v.speciality&&<p><b>Speciality:</b> {v.speciality}</p>}{v.reason&&<p className="mt-2"><b>Reason:</b> {v.reason}</p>}{v.notes&&<p className="mt-2 whitespace-pre-wrap"><b>Notes:</b> {v.notes}</p>}{v.advice&&<p className="mt-2 whitespace-pre-wrap"><b>Doctor's advice:</b> {v.advice}</p>}{v.follow_up_date&&<p className="mt-2"><b>Follow-up:</b> {formatDate(v.follow_up_date)}</p>}<div className="mt-3 border-t border-[#E8DDCF] pt-3"><b className="text-xs">ATTACHED DOCUMENTS ({attached.length})</b>{attached.length?attached.map(d=><div key={d.id} className="mt-2 flex justify-between gap-2"><span className="truncate text-xs">{d.title}</span><button type="button" onClick={()=>void openDoc(d.storage_path)} className="btn-secondary px-3 py-1 text-xs">Open</button></div>):<p className="mt-1 text-xs">No files attached.</p>}</div><div className="mt-3 flex justify-end gap-3"><button type="button" onClick={()=>openVisit(v)} className="text-xs underline">Edit visit</button><button type="button" onClick={()=>setDeleteTarget({kind:"visit",row:v})} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">Delete visit</button></div></div>}</article>})}</div>}
    </section>
    <form onSubmit={addExpense} className="card p-5"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="serif text-xl text-[#493628]">{editingExpense?"Edit medical expense":"Add other medical expense"}</h2>{editingExpense&&<button type="button" onClick={clearExpenseForm} className="btn-secondary px-3 py-2 text-xs">Cancel edit</button>}</div><div className="grid gap-3 sm:grid-cols-2">
      <label><span className="field-label">Amount (₹)</span><input className="input" type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label>
      <label><span className="field-label">Date</span><input className="input" type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label><span className="field-label">Category</span><select className="input" value={category} onChange={e=>setCategory(e.target.value as Expense["category"])}>{categories.map(c=><option key={c} value={c}>{c.replaceAll("_"," ")}</option>)}</select></label>
      <label><span className="field-label">Hospital / merchant</span><input className="input" value={merchant} onChange={e=>setMerchant(e.target.value)} maxLength={140}/></label>
      <label className="sm:col-span-2"><span className="field-label">Description</span><input className="input" value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000}/></label>
      <label className="sm:col-span-2"><span className="field-label">Attach supporting documents (multiple bills, scan reports or photos · max 10 MB each)</span><input id="expense-files" className="input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e=>setExpenseFiles(Array.from(e.target.files??[]))}/><span className="mt-1 block text-xs text-[#735E49]">Optional. You can select more than one file for this expense.</span>{expenseFiles.length>0&&<span className="mt-2 block text-xs text-[#48623F]">{expenseFiles.length} file{expenseFiles.length===1?"":"s"} selected: {expenseFiles.map(file=>file.name).join(", ")}</span>}</label>
    </div>{error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}<button className="btn-primary mt-4" disabled={busy}>{busy?"Saving expense & files…":editingExpense?"Save expense changes":"Add expense"}</button></form>
    {deleteTarget&&<div role="presentation" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={()=>setDeleteTarget(null)}><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="card w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}><h2 id="delete-title" className="serif text-xl text-[#493628]">Confirm deletion</h2><p className="mt-2 text-sm leading-6 text-[#735E49]">Are you sure you want to delete this {deleteTarget.kind==="visit"?"consultation and its linked fee and documents":"expense and its supporting documents"}? This will move the record out of your active list.</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={()=>setDeleteTarget(null)} className="btn-secondary">Cancel</button><button type="button" onClick={()=>{const target=deleteTarget;setDeleteTarget(null);if(target.kind==="visit")void removeVisit(target.row);else void removeExpense(target.row.id);}} className="rounded-full bg-[#8A5148] px-5 py-3 text-sm font-semibold text-white">Yes, delete</button></div></section></div>}\n    {removed&&<div role="status" className="rounded-xl bg-[#E8EFE4] px-4 py-3 text-sm text-[#405A3B]">Expense deleted. <button onClick={()=>void undo()} className="font-semibold underline">Undo</button></div>}
    <section className="card p-5"><h2 className="serif mb-1 text-xl text-[#493628]">Other expenses</h2><p className="mb-3 text-xs text-[#735E49]">Tap an entry for actions, or long-press it to delete.</p>{expenses.filter(x=>!x.consultation_id).length===0?<p className="text-sm text-[#735E49]">No other expenses recorded.</p>:expenses.filter(x=>!x.consultation_id).map(x=>{const attached=docs.filter(d=>d.expense_id===x.id);const open=expandedExpense===x.id;return <div key={x.id} className="border-t border-[#EEE5DA] py-3"><button type="button" onTouchStart={()=>startLongPress({kind:"expense",row:x})} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress} onContextMenu={e=>{e.preventDefault();setDeleteTarget({kind:"expense",row:x});}} onClick={()=>setExpandedExpense(open?null:x.id)} className="flex w-full items-center gap-3 text-left"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#493628]">{x.merchant||x.category.replaceAll("_"," ")}</p><p className="text-xs text-[#735E49]">{formatDate(x.expense_date)} · {x.description||""}</p></div><div className="text-right"><p className="text-sm font-semibold">{formatCurrency(Number(x.amount))}</p><span className="text-xs text-[#76583C] underline">{open?"Hide options":"View options"}</span></div></button>{open&&<div className="mt-3 rounded-lg bg-[#F8F3EC] p-3"><div className="flex justify-end gap-3"><button type="button" onClick={()=>openExpense(x)} className="text-xs underline">Edit</button><button type="button" onClick={()=>setDeleteTarget({kind:"expense",row:x})} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">Delete expense</button></div>{attached.length>0&&<div className="mt-2 border-t border-[#E8DDCF] pt-2"><p className="text-xs font-semibold text-[#735E49]">SUPPORTING DOCUMENTS ({attached.length})</p>{attached.map(d=><div key={d.id} className="mt-2 flex justify-between gap-2"><span className="truncate text-xs text-[#594936]">{d.title}</span><button type="button" onClick={()=>void openDoc(d.storage_path)} className="btn-secondary px-3 py-1 text-xs">Open</button></div>)}</div>}</div>}</div>})}</section>
  </div>;
}

function VaultPage({ workspace, userId }: { workspace: Workspace; userId: string }) {
  const [documents, setDocuments] = useState<Database["public"]["Tables"]["vault_documents"]["Row"][]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Database["public"]["Tables"]["vault_documents"]["Row"]["category"]>("other");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [removedDocument, setRemovedDocument] = useState<Database["public"]["Tables"]["vault_documents"]["Row"] | null>(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.from("vault_documents").select("*").eq("workspace_id", workspace.id).is("deleted_at", null).order("created_at", { ascending: false });
    if (loadError) setError(loadError.message); else setDocuments(data ?? []);
    setLoaded(true);
  }, [workspace.id]);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) { setError("Choose a PDF or image first."); return; }
    const parsed = vaultSchema.safeParse({ title, category, fileSize: file.size, mimeType: file.type });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the document details."); return; }
    setBusy(true); setError("");
    const path = workspace.id + "/" + crypto.randomUUID();
    const { error: uploadError } = await supabase.storage.from(VAULT_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { setError(uploadError.message); setBusy(false); return; }
    const { error: insertError } = await supabase.from("vault_documents").insert({
      workspace_id: workspace.id, created_by: userId, title: parsed.data.title, category: parsed.data.category,
      file_name: file.name, storage_path: path, mime_type: file.type, size_bytes: file.size
    });
    if (insertError) {
      await supabase.storage.from(VAULT_BUCKET).remove([path]);
      setError(insertError.message);
    } else { setTitle(""); setFile(null); const input = document.getElementById("vault-file") as HTMLInputElement | null; if (input) input.value = ""; await load(); }
    setBusy(false);
  }

  async function openDocument(path: string) {
    const { data, error: urlError } = await supabase.storage.from(VAULT_BUCKET).createSignedUrl(path, 60);
    if (urlError) setError(urlError.message);
    else if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function softDelete(row: Database["public"]["Tables"]["vault_documents"]["Row"]) {
    const previous = documents;
    setDocuments((current) => current.filter((item) => item.id !== row.id));
    const { error: updateError } = await supabase.from("vault_documents").update({ deleted_at: new Date().toISOString() }).eq("id", row.id);
    if (updateError) { setDocuments(previous); setError(updateError.message); return; }
    setRemovedDocument(row);
  }

  async function undoDocumentDelete() {
    if (!removedDocument) return;
    const { error: restoreError } = await supabase.from("vault_documents").update({ deleted_at: null }).eq("id", removedDocument.id);
    if (restoreError) setError(restoreError.message);
    else { setRemovedDocument(null); await load(); }
  }

  return <div className="space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">Private keepsakes</p><h1 className="serif mt-1 text-3xl text-[#493628]">Document vault</h1><p className="mt-1 text-sm text-[#735E49]">Reports and files stay in a private bucket, accessible only to workspace members.</p></header>
    <div className="card flex items-center gap-4 bg-[#EFF2E9] p-5"><Illustration kind="vault" className="h-24 w-28 shrink-0"/><div><p className="font-semibold text-[#42533D]">A safe little filing place</p><p className="mt-1 text-sm leading-5 text-[#48623F]">PDFs and common image formats · Maximum 10 MB each · Private access</p></div></div>
    <form onSubmit={submit} className="card p-5">
      <h2 className="serif mb-4 text-xl text-[#493628]">Add a document</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="field-label">Document title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="e.g. Scan report" required/></label>
        <label><span className="field-label">Category</span><select className="input" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>{["scan","lab_report","prescription","insurance","discharge_summary","other"].map((v) => <option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="field-label">Choose file</span><input id="vault-file" className="input file:mr-3 file:rounded-full file:border-0 file:bg-[#F0E7DA] file:px-3 file:py-2" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required/></label>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
      <button className="btn-primary mt-4 inline-flex items-center gap-2" disabled={busy} type="submit"><UploadCloud size={16}/>{busy ? "Securing file…" : "Upload to private vault"}</button>
    </form>
    {removedDocument && <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-[#E8EFE4] px-4 py-3 text-sm text-[#405A3B]"><span>Document moved to recently removed. The file is retained.</span><button onClick={() => void undoDocumentDelete()} className="font-semibold underline">Undo</button></div>}
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between"><h2 className="serif text-xl text-[#493628]">Your documents</h2><span className="text-xs text-[#735E49]">{documents.length} files</span></div>
      {!loaded ? <p className="py-8 text-center text-sm text-[#735E49]">Loading your vault…</p> : documents.length === 0 ? <EmptyState title="Nothing filed yet" body="Your uploaded reports and important documents will be listed here."/> : <div className="divide-y divide-[#EEE5DA]">{documents.map((row) => <div key={row.id} className="flex items-center gap-3 py-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5EFE6] text-[#735E49]"><FileText size={18}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#493628]">{row.title}</p><p className="text-xs capitalize text-[#735E49]">{row.category.replaceAll("_"," ")} · {(row.size_bytes / 1024 / 1024).toFixed(1)} MB</p></div><button className="btn-secondary px-3 py-2 text-xs" onClick={() => void openDocument(row.storage_path)}>Open</button><button aria-label={"Remove " + row.title} className="px-2 py-2 text-xs text-[#735E49]" onClick={() => void softDelete(row)}>Remove</button></div>)}</div>}
    </section>
  </div>;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function FamilyPage({ workspace, userId }: { workspace: Workspace; userId: string }) {
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [members, setMembers] = useState<{ user_id: string; role: string }[]>([]);
  const [invites, setInvites] = useState<{ id: string; invited_email: string; expires_at: string }[]>([]);

  const load = useCallback(async () => {
    const [memberRows, inviteRows] = await Promise.all([
      supabase.from("workspace_members").select("user_id,role").eq("workspace_id", workspace.id).is("deleted_at", null),
      supabase.from("workspace_invites").select("id,invited_email,expires_at").eq("workspace_id", workspace.id).is("accepted_at", null).is("deleted_at", null).order("created_at", { ascending: false })
    ]);
    setMembers(memberRows.data ?? []);
    if (workspace.role === "owner") setInvites(inviteRows.data ?? []);
  }, [workspace.id, workspace.role]);
  useEffect(() => { void load(); }, [load]);

  async function makeInvite(event: FormEvent) {
    event.preventDefault();
    const parsed = inviteSchema.safeParse({ email });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enter a valid email."); return; }
    setBusy(true); setError(""); setNotice(""); setInviteUrl("");
    try {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes).map((value) => value.toString(16).padStart(2, "0")).join("");
      const tokenHash = await sha256(token);
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      const { error: inviteError } = await supabase.from("workspace_invites").insert({
        workspace_id: workspace.id, invited_email: parsed.data.email.toLowerCase(),
        token_hash: tokenHash, role: "partner", invited_by: userId,
        created_by: userId, expires_at: expiresAt
      });
      if (inviteError) throw inviteError;
      const url = new URL(window.location.href);
      url.searchParams.set("invite", token);
      setInviteUrl(url.toString());
      setEmail("");
      setNotice("Invitation created. Share this link only with the intended partner. It expires in 7 days.");
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to create invitation."); }
    finally { setBusy(false); }
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setNotice("Invitation link copied.");
  }

  return <div className="space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">Together, in one place</p><h1 className="serif mt-1 text-3xl text-[#493628]">Your family space</h1><p className="mt-1 text-sm text-[#735E49]">Workspace: {workspace.name}</p></header>
    <section className="card p-5">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F7E8E3] text-[#986A5B]"><Users size={20}/></span><div><h2 className="serif text-xl text-[#493628]">Workspace members</h2><p className="text-sm text-[#735E49]">{members.length} authorised member{members.length === 1 ? "" : "s"}</p></div></div>
      <div className="mt-4 space-y-2">{members.map((member) => <div key={member.user_id} className="flex items-center justify-between rounded-xl bg-[#F8F3EC] px-3 py-3"><span className="text-sm text-[#493628]">{member.user_id === userId ? "You" : "Partner"}</span><span className="rounded-full bg-[#E8EFE4] px-3 py-1 text-xs font-semibold capitalize text-[#48623F]">{member.role}</span></div>)}</div>
    </section>
    {workspace.role === "owner" ? <section className="card p-5">
      <h2 className="serif text-xl text-[#493628]">Invite your partner</h2>
      <p className="mt-1 text-sm leading-6 text-[#735E49]">Create an email-bound invitation link. Your partner must sign in using the invited email address before joining this workspace.</p>
      <form onSubmit={makeInvite} className="mt-4 flex flex-col gap-3 sm:flex-row"><input className="input flex-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@example.com" required/><button className="btn-primary inline-flex items-center justify-center gap-2" disabled={busy} type="submit"><Mail size={16}/>{busy ? "Creating…" : "Create invite"}</button></form>
      {inviteUrl && <div className="mt-4 rounded-2xl bg-[#F4EBDD] p-3"><p className="break-all text-xs leading-5 text-[#674E36]">{inviteUrl}</p><button onClick={() => void copyInvite()} className="btn-secondary mt-3 inline-flex items-center gap-2 text-xs"><Copy size={14}/>Copy invitation link</button></div>}
      {invites.length > 0 && <div className="mt-5 border-t border-[#EEE5DA] pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#735E49]">Pending invitations</p>{invites.map((invite) => <p key={invite.id} className="mt-2 text-sm text-[#695541]">{invite.invited_email} · expires {formatDate(invite.expires_at.slice(0,10))}</p>)}</div>}
    </section> : <p className="card p-4 text-sm leading-6 text-[#735E49]">Only the workspace owner can create partner invitations.</p>}
    {notice && <p role="status" className="rounded-xl bg-[#E8EFE4] p-3 text-sm text-[#405A3B]">{notice}</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="card p-5"><div className="flex gap-3"><ShieldCheck className="mt-1 shrink-0 text-[#67805E]"/><div><h3 className="font-semibold text-[#493628]">Private by membership</h3><p className="mt-1 text-sm leading-6 text-[#735E49]">Only active members of this workspace can access its pregnancy profile, expenses and documents. Invitation tokens are stored as hashes and expire after seven days.</p></div></div></div>
  </div>;
}

function MorePage({ email, onSignOut, darkMode, onToggleTheme }: { email: string; onSignOut: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  return <div className="space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">A few useful details</p><h1 className="serif mt-1 text-3xl text-[#493628]">More</h1></header>
    <section className="card p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E8EFE4] text-[#58704F]"><Settings size={20}/></span><div><p className="font-semibold text-[#493628]">Account</p><p className="text-sm text-[#735E49]">{email}</p></div></div><button onClick={onToggleTheme} className="btn-secondary mt-5 inline-flex items-center gap-2"><Sun size={16}/>{darkMode ? "Switch to light theme" : "Switch to dark theme"}<Moon size={15}/></button><button onClick={onSignOut} className="btn-secondary ml-2 mt-5 inline-flex items-center gap-2"><LogOut size={16}/>Sign out</button></section>
    <section className="card p-5"><h2 className="serif text-xl text-[#493628]">Privacy & care</h2><p className="mt-2 text-sm leading-6 text-[#735E49]">This app is a personal organiser. It does not diagnose, interpret test results or replace advice from your doctor. Pregnancy data is accessible only to signed-in members of your private workspace.</p><p className="mt-3 text-xs text-[#735E49]">Timezone: India Standard Time · Date display: DD-MM-YYYY · Currency: INR</p></section>
    <section className="card p-5"><div className="flex items-center gap-3"><CircleHelp className="text-[#735E49]"/><div><p className="font-semibold text-[#493628]">Current foundation</p><p className="text-sm text-[#735E49]">Authentication, shared workspace, pregnancy profile, expenses and private vault.</p></div></div></section>
  </div>;
}

export default function App() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [page, setPage] = useState<Page>("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("nest-theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    try { localStorage.setItem("nest-theme", darkMode ? "dark" : "light"); } catch { /* Theme preference is optional. */ }
  }, [darkMode]);

  const loadWorkspace = useCallback(async (userId: string) => {
    setError("");
    const { data: membership, error: membershipError } = await supabase.from("workspace_members")
      .select("workspace_id,role").eq("user_id", userId).is("deleted_at", null).limit(1).maybeSingle();
    if (membershipError) { setError(membershipError.message); setWorkspace(null); setProfile(null); return; }
    if (!membership) { setWorkspace(null); setProfile(null); return; }
    const { data: workspaceRow, error: workspaceError } = await supabase.from("workspaces")
      .select("id,name").eq("id", membership.workspace_id).maybeSingle();
    if (workspaceError || !workspaceRow) { setError(workspaceError?.message ?? "Workspace could not be loaded."); return; }
    setWorkspace({ id: workspaceRow.id, name: workspaceRow.name, role: membership.role });
    const { data: profileRow, error: profileError } = await supabase.from("pregnancy_profiles")
      .select("*").eq("workspace_id", workspaceRow.id).is("deleted_at", null).maybeSingle();
    if (profileError) setError(profileError.message);
    setProfile(profileRow);
  }, []);

  useEffect(() => {
    document.title = APP_NAME;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setSession(data.session); setLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) { setWorkspace(null); setProfile(null); }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user.id) return;
    let alive = true;
    const bootstrap = async () => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("invite");
      if (token) {
        const { error: inviteError } = await supabase.rpc("accept_workspace_invite", { p_token: token });
        url.searchParams.delete("invite");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        if (inviteError) setError(inviteError.message);
      }
      await loadWorkspace(session.user.id);
      if (!alive) return;
    };
    void bootstrap();
    return () => { alive = false; };
  }, [session?.user.id, loadWorkspace]);

  async function signOut() { await supabase.auth.signOut(); }

  if (loading) return <main className="grid min-h-screen place-items-center"><div className="card px-8 py-7 text-center"><Illustration kind="nest" className="mx-auto h-32"/><p className="serif mt-2 text-xl text-[#493628]">Settling into your nest…</p></div></main>;
  if (new URLSearchParams(window.location.search).get("password-reset") === "1") return session ? <PasswordResetScreen/> : <main className="grid min-h-screen place-items-center"><p className="card p-6 text-sm text-[#735E49]">Opening your secure password reset… If this message remains, request a new reset email.</p></main>;
  if (!session) return <AuthScreen/>;
  if (!workspace) return <><WorkspaceSetup userId={session.user.id} onCreated={() => loadWorkspace(session.user.id)}/>{error && <p role="alert" className="fixed bottom-5 left-4 right-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}</>;

  return <div className="min-h-screen pb-28">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F0E4D4] text-[#76583C]"><Heart size={19}/></span><div><p className="serif text-xl leading-none text-[#493628]">{APP_NAME}</p><p className="mt-1 text-[11px] text-[#735E49]">{workspace.name}</p></div></div>
      <div className="flex items-center gap-2"><span className="hidden rounded-full bg-[#E8EFE4] px-3 py-2 text-xs font-semibold text-[#48623F] sm:inline-flex"><ShieldCheck size={14} className="mr-1"/>Private space</span><button onClick={() => setPage("more")} aria-label="Open settings" className="grid h-10 w-10 place-items-center rounded-full border border-[#E8DDCF] bg-white text-[#76583C]"><Settings size={18}/></button></div>
    </header>
    <main className="mx-auto max-w-6xl px-4 pb-10 md:px-8">
      {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={16}/></button></div>}
      {page === "home" && <Dashboard workspace={workspace} profile={profile} userId={session.user.id} onProfileSaved={setProfile} onNavigate={setPage}/>}
      {page === "expenses" && <ExpensePage workspace={workspace} userId={session.user.id}/>}
      {page === "vault" && <VaultPage workspace={workspace} userId={session.user.id}/>}
      {page === "family" && <FamilyPage workspace={workspace} userId={session.user.id}/>}
      {page === "more" && <MorePage email={session.user.email ?? ""} onSignOut={() => void signOut()} darkMode={darkMode} onToggleTheme={() => setDarkMode((value) => !value)}/>}
    </main>
    <nav aria-label="Main navigation" className="bottom-safe fixed inset-x-0 bottom-0 z-20 border-t border-[#E8DDCF] bg-[#FFFCF7]/95 backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-5 px-2 pt-2">
        {navItems.map((item) => <button key={item.id} onClick={() => setPage(item.id)} aria-current={page === item.id ? "page" : undefined} className={"flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold " + (page === item.id ? "text-[#684B32]" : "text-[#735E49]")}><span className={"grid h-8 w-12 place-items-center rounded-full " + (page === item.id ? "bg-[#F0E4D4]" : "")}><NavGlyph name={item.icon}/></span>{item.label}</button>)}
      </div>
    </nav>
  </div>;
}
