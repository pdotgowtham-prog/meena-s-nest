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
type Page = "home" | "expenses" | "memories" | "vault" | "family";
type Workspace = { id: string; name: string; role: "owner" | "partner" };
type Medicine = { name: string; dosage: string; schedule: string; instructions: string };

const navItems: { id: Page; label: string; icon: "home" | "expenses" | "vault" | "family" | "memories" }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "expenses", label: "Visits", icon: "expenses" },
  { id: "memories", label: "Memories", icon: "memories" },
  { id: "vault", label: "Vault", icon: "vault" },
  { id: "family", label: "Family", icon: "family" },
];

function NavGlyph({ name }: { name: (typeof navItems)[number]["icon"] }) {
  const paths: Record<string, string> = {
    home: "M3 10.8 12 3l9 7.8M5.5 9.5V21h13V9.5M9 21v-7h6v7",
    expenses: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
    vault: "M3 7.5h7l2 2H21v10H3zM3 7.5V5h8l2 2",
    family: "M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 4.5a3 3 0 0 1 0 5.8M20 20v-1.5a4.5 4.5 0 0 0-3.2-4.3",
    memories: "M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11"
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
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#75583C]"><img src="/nest-icon.svg" alt="Meena’s Nest logo" className="h-14 w-14 rounded-2xl object-cover shadow-sm"/> <span>A little space for your growing family</span></div>
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
  return <main className="flex min-h-screen items-center justify-center px-4 py-10"><section className="card paper w-full max-w-md p-7 md:p-9"><div className="mb-5 flex items-center gap-3 text-[#76583C]"><img src="/nest-icon.svg" alt="Meena’s Nest logo" className="h-12 w-12 rounded-xl object-cover"/><span className="serif text-2xl">{APP_NAME}</span></div><h1 className="serif text-3xl text-[#493628]">{done ? "Password updated" : "Choose a new password"}</h1><p className="mt-2 text-sm leading-6 text-[#735E49]">{done ? "Your password has been changed. You can continue to your private space." : "Create a new password for your account."}</p>{!done && <form onSubmit={submit} className="mt-6 space-y-4"><label className="block"><span className="field-label">New password</span><input className="input" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)}/></label><label className="block"><span className="field-label">Confirm new password</span><input className="input" type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)}/></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}<button className="btn-primary w-full" disabled={busy} type="submit">{busy ? "Updating…" : "Update password"}</button></form>}{done && <button className="btn-primary mt-6 w-full" onClick={() => window.location.assign(window.location.origin)}>Continue to Meena’s Nest</button>}</section></main>;
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
  const [latestMemory,setLatestMemory] = useState<Database["public"]["Tables"]["memories"]["Row"] | null>(null);
  const [latestMemoryUrl,setLatestMemoryUrl] = useState("");
  useEffect(() => {
    let live=true;
    supabase.from("memories").select("*").eq("workspace_id",workspace.id).is("deleted_at",null).order("memory_date",{ascending:false}).limit(1).maybeSingle().then(async ({data})=>{
      if(!live)return;
      const row=(data??null) as Database["public"]["Tables"]["memories"]["Row"] | null;
      setLatestMemory(row);
      if(row?.storage_path){const {data: signed}=await supabase.storage.from(VAULT_BUCKET).createSignedUrl(row.storage_path,60);if(live&&signed?.signedUrl)setLatestMemoryUrl(signed.signedUrl);}
    });
    return ()=>{live=false;};
  },[workspace.id]);
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
    <section className="card overflow-hidden p-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">From your memory book</p><h2 className="serif mt-1 text-xl text-[#493628]">Your latest little moment</h2></div><button type="button" onClick={() => onNavigate("memories")} className="text-xs font-semibold text-[#76583C] underline">View memories</button></div>
      {latestMemory ? <div className="mt-3 flex items-center gap-4">{latestMemoryUrl&&<img src={latestMemoryUrl} alt="" className="h-20 w-20 rounded-2xl object-cover"/>}<div className="min-w-0"><p className="font-semibold text-[#493628]">{latestMemory.title||"A little memory"}</p><p className="mt-1 text-xs text-[#735E49]">{formatDate(latestMemory.memory_date)}{latestMemory.pregnancy_week?" · Week "+latestMemory.pregnancy_week:""}</p><p className="mt-2 line-clamp-2 text-sm text-[#735E49]">{latestMemory.story||"A moment saved for later."}</p></div></div> : <div className="mt-3 rounded-xl bg-[#F8F3EC] p-4"><p className="text-sm text-[#735E49]">Your memory book is waiting for its first photo or little story.</p><button type="button" onClick={() => onNavigate("memories")} className="btn-secondary mt-3 text-xs">Add a memory</button></div>}
    </section>
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
  const [dayBrief,setDayBrief]=useState(""); const [bloodPressure,setBloodPressure]=useState(""); const [weightKg,setWeightKg]=useState(""); const [fetalHeartRate,setFetalHeartRate]=useState("");
  type Medicine={name:string;dosage:string;schedule:string;instructions:string};
  const [medicines,setMedicines]=useState<Medicine[]>([]);
  const [payment,setPayment]=useState("upi"); const [files,setFiles]=useState<File[]>([]);
  const [amount,setAmount]=useState(""); const [date,setDate]=useState(localToday());
  const [category,setCategory]=useState<Expense["category"]>("scan"); const [merchant,setMerchant]=useState(""); const [description,setDescription]=useState("");
  const [expenseFiles,setExpenseFiles]=useState<File[]>([]);
  const [editingExpense,setEditingExpense]=useState<Expense|null>(null);
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [loaded,setLoaded]=useState(false); const [expanded,setExpanded]=useState<string|null>(null);
  const [removed,setRemoved]=useState<Expense|null>(null);
  const [removedDocIds,setRemovedDocIds]=useState<string[]>([]);
  const [expandedExpense,setExpandedExpense]=useState<string|null>(null);
  const [visitFilter,setVisitFilter]=useState<"all"|"consultations"|"scans"|"medicines">("all");
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
  function clearForm(){setEditing(null);setVisitDate(localToday());setWeek("");setDoctor("");setSpeciality("");setHospital("");setReason("");setNotes("");setAdvice("");setDayBrief("");setBloodPressure("");setWeightKg("");setFetalHeartRate("");setMedicines([]);setFollowUp("");setFee("");setPayment("upi");setFiles([]);const el=document.getElementById("visit-files") as HTMLInputElement|null;if(el)el.value="";}
  function openVisit(v:Consultation){setEditing(v);setVisitDate(v.consultation_date);setWeek(v.pregnancy_week?.toString()??"");setDoctor(v.doctor_name??"");setSpeciality(v.speciality??"");setHospital(v.hospital??"");setReason(v.reason??"");setNotes(v.notes??"");setAdvice(v.advice??"");setDayBrief(v.day_brief??"");setBloodPressure(v.blood_pressure??"");setWeightKg(v.weight_kg?.toString()??"");setFetalHeartRate(v.fetal_heart_rate?.toString()??"");setMedicines(Array.isArray(v.medicines)?v.medicines as unknown as Medicine[]:[]);setFollowUp(v.follow_up_date??"");setFee(v.fee_amount?.toString()??"");setPayment(v.payment_method??"upi");setExpanded(v.id);setFiles([]);const el=document.getElementById("visit-files") as HTMLInputElement|null;if(el)el.value="";window.scrollTo({top:0,behavior:"smooth"});}
  async function openDoc(path:string){const {data,error:e}=await supabase.storage.from(VAULT_BUCKET).createSignedUrl(path,60);if(e)setError(e.message);else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");}
  function printVisit(v:Consultation){
    const docsForVisit=docs.filter(d=>d.consultation_id===v.id);
    const esc=(value:unknown)=>String(value??"").replace(/[&<>"\']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#39;"}[ch]??ch));
    const meds=Array.isArray(v.medicines)?v.medicines as unknown as Medicine[]:[];
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>Visit summary</title><style>body{font:14px Arial,sans-serif;color:#3f342b;margin:32px}h1,h2{font-family:Georgia,serif;color:#493628}h1{font-size:26px}h2{font-size:18px;margin-top:24px}.muted{color:#786958}.box{background:#f7f2eb;padding:14px;border-radius:10px;margin:12px 0}li{margin:7px 0} @media print{body{margin:18mm}}</style></head><body><h1>Meena’s Nest · Visit summary</h1><p class="muted">${esc(formatDate(v.consultation_date))} · ${esc(v.pregnancy_week?`Week ${v.pregnancy_week}`:"Pregnancy visit")}</p><div class="box"><b>${esc(v.doctor_name?`Dr. ${v.doctor_name.replace(/^\s*Dr\.?\s*/i,"")}`:"Consultation")}</b><p>${esc(v.speciality)} ${v.hospital?"· "+esc(v.hospital):""}</p><p>${esc(v.reason)}</p><p><b>Fee:</b> ${esc(v.fee_amount===null?"Not recorded":formatCurrency(Number(v.fee_amount)))}</p></div><h2>Visit brief & observations</h2><p>${esc(v.day_brief||"Not recorded")}</p><p>${esc(v.notes||"")}</p><p><b>Advice:</b> ${esc(v.advice||"Not recorded")}</p><h2>Vitals</h2><ul><li>Blood pressure: ${esc(v.blood_pressure||"Not recorded")}</li><li>Weight: ${esc(v.weight_kg===null?"Not recorded":v.weight_kg+" kg")}</li><li>Fetal heart rate: ${esc(v.fetal_heart_rate===null?"Not recorded":v.fetal_heart_rate+" bpm")}</li></ul><h2>Medicines</h2>${meds.length?`<ul>${meds.map(m=>`<li><b>${esc(m.name)}</b> · ${esc(m.dosage)} · ${esc(m.schedule)}<br>${esc(m.instructions)}</li>`).join("")}</ul>`:"<p>None recorded</p>"}<h2>Follow-up</h2><p>${esc(v.follow_up_date?formatDate(v.follow_up_date):"Not recorded")}</p><h2>Attached reports & files</h2>${docsForVisit.length?`<ul>${docsForVisit.map(d=>`<li>${esc(d.title)} (${esc(d.category.replaceAll("_"," "))})</li>`).join("")}</ul>`:"<p>No files attached</p>"}<p class="muted">Prepared from records saved in Meena’s Nest. This summary is not a medical document or substitute for the original reports.</p><script>window.onload=()=>window.print()</script></body></html>`;
    const win=window.open("","_blank");if(!win){setError("Allow pop-ups to print this visit summary.");return;}win.document.open();win.document.write(html);win.document.close();
  }
  async function saveVisit(event:FormEvent){
    event.preventDefault();const f=fee.trim()?Number(fee):null;
    if(f!==null&&(!Number.isFinite(f)||f<0||f>99999999.99)){setError("Enter a valid consultation fee.");return;}
    if(week&&(!Number.isInteger(Number(week))||Number(week)<1||Number(week)>45)){setError("Pregnancy week must be between 1 and 45.");return;}
    const invalidFile=files.find(file=>!["application/pdf","image/jpeg","image/png","image/webp","image/heic","image/heif"].includes(file.type)||file.size>10*1024*1024);if(invalidFile){setError("Each attachment must be a PDF or image up to 10 MB: "+invalidFile.name);return;}
    setBusy(true);setError("");
    const payload={workspace_id:workspace.id,created_by:editing?.created_by??userId,consultation_date:visitDate,pregnancy_week:week?Number(week):null,doctor_name:doctor.trim()||null,speciality:speciality.trim()||null,hospital:hospital.trim()||null,reason:reason.trim()||null,notes:notes.trim()||null,advice:advice.trim()||null,day_brief:dayBrief.trim()||null,blood_pressure:bloodPressure.trim()||null,weight_kg:weightKg.trim()?Number(weightKg):null,fetal_heart_rate:fetalHeartRate.trim()?Number(fetalHeartRate):null,medicines:medicines.filter(m=>m.name.trim()).map(m=>({name:m.name.trim(),dosage:m.dosage.trim(),schedule:m.schedule.trim(),instructions:m.instructions.trim()})),follow_up_date:followUp||null,fee_amount:f,payment_method:f===null?null:payment};
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
    setBusy(true);
    const { error: deleteError } = await supabase.rpc("soft_delete_consultation", { p_consultation_id: v.id });
    if(deleteError){
      setError("Could not remove this consultation: "+deleteError.message);
      setBusy(false);
      return;
    }
    if(editing?.id===v.id)clearForm();
    setDeleteTarget(null);
    await load();
    setBusy(false);
  }
  const total=expenses.reduce((n,x)=>n+Number(x.amount),0);
  const visibleOtherExpenses=expenses.filter(x=>!x.consultation_id&&(visitFilter==="all"||(visitFilter==="scans"&&(x.category==="scan"||x.category==="lab_test"))||(visitFilter==="medicines"&&x.category==="medicine")));
  const showVisits=visitFilter==="all"||visitFilter==="consultations";
  const showOtherExpenses=visitFilter!=="consultations";
  const categories=["scan","lab_test","medicine","travel","nutrition","baby_items","insurance","other"];
  const medicationHistory=visits.flatMap(v=>(Array.isArray(v.medicines)?v.medicines as unknown as Medicine[]:[]).filter(m=>m.name?.trim()).map((m,i)=>({...m,visitId:v.id,visitDate:v.consultation_date,doctorName:v.doctor_name||"Consultation",key:v.id+"-"+i}))).sort((a,b)=>b.visitDate.localeCompare(a.visitDate));
  const upcomingFollowUps=visits.filter(v=>v.follow_up_date&&v.follow_up_date>=localToday()).sort((a,b)=>(a.follow_up_date||"").localeCompare(b.follow_up_date||""));
  const vitalsHistory=visits.filter(v=>v.blood_pressure||v.weight_kg!==null||v.fetal_heart_rate!==null).slice().sort((a,b)=>a.consultation_date.localeCompare(b.consultation_date));
  return <div className="space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">Medical records & spending</p><h1 className="serif mt-1 text-3xl text-[#493628]">Care &amp; Visits</h1><p className="mt-1 text-sm text-[#735E49]">Consultations, fees, prescriptions, scan reports, bills and other pregnancy expenses together.</p></header>
    <div className="card flex items-center justify-between gap-4 bg-[#F1E9DC] p-5"><div><p className="text-xs text-[#735E49]">Total recorded spending</p><p className="serif mt-1 text-3xl text-[#493628]">{formatCurrency(total)}</p><p className="mt-1 text-xs text-[#735E49]">{visits.length} consultations · {expenses.length} expense entries</p></div><Wallet size={29} className="text-[#735E49]"/></div>
    <div className="flex gap-2 overflow-x-auto pb-1">{([{id:"all",label:"All"},{id:"consultations",label:"Consultations"},{id:"scans",label:"Scans & Labs"},{id:"medicines",label:"Medicines"}] as const).map(item=><button key={item.id} type="button" onClick={()=>setVisitFilter(item.id)} className={"shrink-0 rounded-full px-4 py-2 text-xs font-semibold "+(visitFilter===item.id?"bg-[#76583C] text-white":"bg-[#F5EFE6] text-[#735E49]")}>{item.label}</button>)}</div>
    {(visitFilter==="all"||visitFilter==="medicines")&&<section className="grid gap-4 lg:grid-cols-2">
      <div className="card p-5">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#735E49]">Prescription history</p><h2 className="serif mt-1 text-xl text-[#493628]">Medicines recorded by visit</h2></div><span className="rounded-full bg-[#F5EFE6] px-3 py-1 text-xs text-[#735E49]">{medicationHistory.length} entries</span></div>
        <p className="mt-2 text-xs leading-5 text-[#735E49]">This is a history of medicines entered from consultation records, not a live medication list. Confirm current use and dosage with your clinician.</p>
        {medicationHistory.length===0?<p className="mt-4 text-sm text-[#735E49]">No prescribed medicines recorded yet.</p>:<div className="mt-3 max-h-72 space-y-2 overflow-y-auto">{medicationHistory.map(m=><div key={m.key} className="rounded-xl bg-[#F8F3EC] p-3"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-[#493628]">{m.name}</p><span className="shrink-0 text-[11px] text-[#735E49]">{formatDate(m.visitDate)}</span></div><p className="mt-1 text-xs text-[#594936]">{[m.dosage,m.schedule].filter(Boolean).join(" · ")||"Dosage not recorded"}</p>{m.instructions&&<p className="mt-1 text-xs text-[#735E49]">{m.instructions}</p>}<p className="mt-1 text-[11px] text-[#8A755E]">Recorded at {m.doctorName}</p></div>)}</div>}
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#735E49]">Care schedule</p><h2 className="serif mt-1 text-xl text-[#493628]">Upcoming follow-ups</h2></div><CalendarDays className="text-[#735E49]"/></div>
        {upcomingFollowUps.length===0?<p className="mt-4 text-sm text-[#735E49]">No future follow-up dates recorded. Add one when your doctor recommends it.</p>:<div className="mt-3 space-y-2">{upcomingFollowUps.slice(0,5).map(v=><div key={v.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F3EC] p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#493628]">{v.doctor_name?("Dr. "+v.doctor_name.replace(/^\\s*Dr\\.?\\s*/i,"")):"Consultation"}{v.hospital?" · "+v.hospital:""}</p><p className="text-xs text-[#735E49]">{v.reason||"Follow-up visit"}</p></div><span className="shrink-0 text-xs font-semibold text-[#76583C]">{formatDate(v.follow_up_date)}</span></div>)}</div>}
      </div>
      <div className="card p-5 lg:col-span-2">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#735E49]">Clinical observations</p><h2 className="serif mt-1 text-xl text-[#493628]">Vitals history</h2></div><span className="text-xs text-[#735E49]">{vitalsHistory.length} visits with readings</span></div>
        <p className="mt-2 text-xs text-[#735E49]">Recorded values are shown as entered. The app does not assess whether a reading is normal or abnormal.</p>
        {vitalsHistory.length===0?<p className="mt-4 text-sm text-[#735E49]">No vital readings recorded yet.</p>:<div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="text-[#735E49]"><tr><th className="pb-2 pr-3">Date</th><th className="pb-2 pr-3">Blood pressure</th><th className="pb-2 pr-3">Weight</th><th className="pb-2">Fetal heart rate</th></tr></thead><tbody>{vitalsHistory.slice(-8).reverse().map(v=><tr key={v.id} className="border-t border-[#EEE5DA]"><td className="py-2 pr-3 text-[#493628]">{formatDate(v.consultation_date)}</td><td className="py-2 pr-3">{v.blood_pressure||"—"}</td><td className="py-2 pr-3">{v.weight_kg===null?"—":v.weight_kg+" kg"}</td><td className="py-2">{v.fetal_heart_rate===null?"—":v.fetal_heart_rate+" bpm"}</td></tr>)}</tbody></table></div>}
      </div>
    </section>}
    <div className={showVisits?"space-y-5":"hidden"}>
    <form onSubmit={saveVisit} className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#735E49]">{editing?"Editing previous visit":"Medical visit record"}</p><h2 className="serif text-xl text-[#493628]">{editing?"Update consultation":"Add consultation"}</h2></div>{editing&&<button type="button" onClick={clearForm} className="btn-secondary px-3 py-2 text-xs">Cancel</button>}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="field-label">Visit date</span><input className="input" type="date" required value={visitDate} onChange={e=>setVisitDate(e.target.value)}/></label>
        <label><span className="field-label">Pregnancy week</span><input className="input" type="number" min="1" max="45" value={week} onChange={e=>setWeek(e.target.value)} placeholder="Optional"/></label>
        <label><span className="field-label">Doctor name</span><input className="input" value={doctor} onChange={e=>setDoctor(e.target.value)} maxLength={140}/></label>
        <label><span className="field-label">Speciality</span><input className="input" value={speciality} onChange={e=>setSpeciality(e.target.value)} maxLength={100} placeholder="e.g. Gynaecologist"/></label>
        <label className="sm:col-span-2"><span className="field-label">Hospital / clinic</span><input className="input" value={hospital} onChange={e=>setHospital(e.target.value)} maxLength={180}/></label>
        <label className="sm:col-span-2"><span className="field-label">Reason for consultation</span><textarea className="input min-h-16" value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000}/></label>
        <label className="sm:col-span-2"><span className="field-label">Day brief</span><textarea className="input min-h-16" value={dayBrief} onChange={e=>setDayBrief(e.target.value)} maxLength={2000} placeholder="Short summary of this visit"/></label>
        <label><span className="field-label">Blood pressure</span><input className="input" value={bloodPressure} onChange={e=>setBloodPressure(e.target.value)} placeholder="e.g. 120/80"/></label>
        <label><span className="field-label">Weight (kg)</span><input className="input" type="number" min="0" max="300" step="0.01" value={weightKg} onChange={e=>setWeightKg(e.target.value)}/></label>
        <label><span className="field-label">Fetal heart rate (bpm)</span><input className="input" type="number" min="0" max="300" value={fetalHeartRate} onChange={e=>setFetalHeartRate(e.target.value)}/></label>
        <div className="sm:col-span-2 rounded-xl bg-[#F8F3EC] p-3"><div className="mb-3 flex items-center justify-between"><span className="field-label">Medicines prescribed</span><button type="button" className="text-xs font-semibold text-[#76583C] underline" onClick={()=>setMedicines(v=>[...v,{name:"",dosage:"",schedule:"",instructions:""}])}>+ Add medicine</button></div>{medicines.map((m,i)=><div key={i} className="mb-3 grid gap-2 rounded-xl border border-[#E8DDCF] bg-white p-3 sm:grid-cols-2"><label><span className="field-label">Medicine name</span><input className="input" value={m.name} onChange={e=>setMedicines(v=>v.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/></label><label><span className="field-label">Dosage</span><input className="input" value={m.dosage} onChange={e=>setMedicines(v=>v.map((x,j)=>j===i?{...x,dosage:e.target.value}:x))} placeholder="e.g. 1 tablet"/></label><label><span className="field-label">Schedule</span><input className="input" value={m.schedule} onChange={e=>setMedicines(v=>v.map((x,j)=>j===i?{...x,schedule:e.target.value}:x))} placeholder="e.g. Morning and night"/></label><label><span className="field-label">Instructions</span><input className="input" value={m.instructions} onChange={e=>setMedicines(v=>v.map((x,j)=>j===i?{...x,instructions:e.target.value}:x))}/></label><div className="sm:col-span-2 text-right"><button type="button" onClick={()=>setMedicines(v=>v.filter((_,j)=>j!==i))} className="text-xs text-red-700 underline">Remove</button></div></div>)}</div>
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
      {!loaded?<p className="py-6 text-sm text-[#735E49]">Loading…</p>:visits.length===0?<EmptyState title="No consultations yet" body="Add a visit above. Saved visits stay here for future viewing and editing."/>:<div className="divide-y divide-[#EEE5DA]">{visits.map(v=>{const expandedNow=expanded===v.id;const attached=docs.filter(d=>d.consultation_id===v.id);return <article key={v.id} className="py-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5EFE6] text-[#735E49]"><Heart size={18}/></span><button type="button" onTouchStart={()=>startLongPress({kind:"visit",row:v})} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress} onContextMenu={e=>{e.preventDefault();setDeleteTarget({kind:"visit",row:v});}} onClick={()=>setExpanded(expandedNow?null:v.id)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-semibold text-[#493628]">{v.doctor_name?("Dr. "+v.doctor_name.replace(/^\\s*Dr\\.?\\s*/i,"")):"Consultation"}{v.hospital?" · "+v.hospital:""}</p><p className="text-xs text-[#735E49]">{formatDate(v.consultation_date)}{v.pregnancy_week?" · Week "+v.pregnancy_week:""}</p></button><div className="text-right"><p className="text-sm font-semibold text-[#493628]">{v.fee_amount!==null?formatCurrency(Number(v.fee_amount)):"—"}</p><div className="flex items-center justify-end gap-2"><button type="button" onClick={()=>setExpanded(expandedNow?null:v.id)} className="text-xs font-semibold underline text-[#76583C]">{expandedNow?"Hide options":"Options"}</button><button type="button" onClick={()=>openVisit(v)} className="text-xs font-semibold underline text-[#76583C]">Open / edit</button></div></div></div>
      {expandedNow&&<div className="mt-3 rounded-xl bg-[#F8F3EC] p-4 text-sm text-[#594936]">{v.speciality&&<p><b>Speciality:</b> {v.speciality}</p>}{v.reason&&<p className="mt-2"><b>Reason:</b> {v.reason}</p>}{v.notes&&<p className="mt-2 whitespace-pre-wrap"><b>Notes:</b> {v.notes}</p>}{v.day_brief&&<p className="mt-2 whitespace-pre-wrap"><b>Day brief:</b> {v.day_brief}</p>}{(v.blood_pressure||v.weight_kg!==null||v.fetal_heart_rate!==null)&&<div className="mt-3 rounded-lg bg-white p-3"><b>Vitals</b><div className="mt-2 grid grid-cols-3 gap-2 text-xs">{v.blood_pressure&&<p><span className="block text-[#735E49]">BP</span><b>{v.blood_pressure}</b></p>}{v.weight_kg!==null&&<p><span className="block text-[#735E49]">Weight</span><b>{v.weight_kg} kg</b></p>}{v.fetal_heart_rate!==null&&<p><span className="block text-[#735E49]">Fetal HR</span><b>{v.fetal_heart_rate} bpm</b></p>}</div></div>}{Array.isArray(v.medicines)&&v.medicines.length>0&&<div className="mt-3"><b>Medicines</b>{(v.medicines as unknown as Medicine[]).map((m,i)=><div key={i} className="mt-2 rounded-lg bg-white p-3"><p className="font-semibold">{m.name}</p><p className="text-xs">{[m.dosage,m.schedule].filter(Boolean).join(" · ")}</p>{m.instructions&&<p className="mt-1 text-xs text-[#735E49]">{m.instructions}</p>}</div>)}</div>}{v.advice&&<p className="mt-2 whitespace-pre-wrap"><b>Doctor's advice:</b> {v.advice}</p>}{v.follow_up_date&&<p className="mt-2"><b>Follow-up:</b> {formatDate(v.follow_up_date)}</p>}<div className="mt-3 border-t border-[#E8DDCF] pt-3"><b className="text-xs">ATTACHED DOCUMENTS ({attached.length})</b>{attached.length?attached.map(d=><div key={d.id} className="mt-2 flex justify-between gap-2"><span className="truncate text-xs">{d.title}</span><button type="button" onClick={()=>void openDoc(d.storage_path)} className="btn-secondary px-3 py-1 text-xs">Open</button></div>):<p className="mt-1 text-xs">No files attached.</p>}</div><div className="mt-3 flex flex-wrap justify-end gap-3"><button type="button" onClick={()=>printVisit(v)} className="text-xs underline">Print / Save PDF</button><button type="button" onClick={()=>openVisit(v)} className="text-xs underline">Edit visit</button><button type="button" onClick={()=>setDeleteTarget({kind:"visit",row:v})} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">Delete visit</button></div></div>}</article>})}</div>}
    </section>
    </div>
    <div className={showOtherExpenses?"space-y-5":"hidden"}>
    <form onSubmit={addExpense} className="card p-5"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="serif text-xl text-[#493628]">{editingExpense?"Edit medical expense":"Add other medical expense"}</h2>{editingExpense&&<button type="button" onClick={clearExpenseForm} className="btn-secondary px-3 py-2 text-xs">Cancel edit</button>}</div><div className="grid gap-3 sm:grid-cols-2">
      <label><span className="field-label">Amount (₹)</span><input className="input" type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label>
      <label><span className="field-label">Date</span><input className="input" type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label><span className="field-label">Category</span><select className="input" value={category} onChange={e=>setCategory(e.target.value as Expense["category"])}>{categories.map(c=><option key={c} value={c}>{c.replaceAll("_"," ")}</option>)}</select></label>
      <label><span className="field-label">Hospital / merchant</span><input className="input" value={merchant} onChange={e=>setMerchant(e.target.value)} maxLength={140}/></label>
      <label className="sm:col-span-2"><span className="field-label">Description</span><input className="input" value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000}/></label>
      <label className="sm:col-span-2"><span className="field-label">Attach supporting documents (multiple bills, scan reports or photos · max 10 MB each)</span><input id="expense-files" className="input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e=>setExpenseFiles(Array.from(e.target.files??[]))}/><span className="mt-1 block text-xs text-[#735E49]">Optional. You can select more than one file for this expense.</span>{expenseFiles.length>0&&<span className="mt-2 block text-xs text-[#48623F]">{expenseFiles.length} file{expenseFiles.length===1?"":"s"} selected: {expenseFiles.map(file=>file.name).join(", ")}</span>}</label>
    </div>{error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}<button className="btn-primary mt-4" disabled={busy}>{busy?"Saving expense & files…":editingExpense?"Save expense changes":"Add expense"}</button></form>
    {deleteTarget&&<div role="presentation" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={()=>setDeleteTarget(null)}><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="card w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}><h2 id="delete-title" className="serif text-xl text-[#493628]">Confirm deletion</h2><p className="mt-2 text-sm leading-6 text-[#735E49]">Are you sure you want to delete this {deleteTarget.kind==="visit"?"consultation and its linked fee and documents":"expense and its supporting documents"}? This will move the record out of your active list.</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={()=>setDeleteTarget(null)} className="btn-secondary">Cancel</button><button type="button" onClick={()=>{const target=deleteTarget;setDeleteTarget(null);if(target.kind==="visit")void removeVisit(target.row);else void removeExpense(target.row.id);}} className="rounded-full bg-[#8A5148] px-5 py-3 text-sm font-semibold text-white">Yes, delete</button></div></section></div>}\n    {removed&&<div role="status" className="rounded-xl bg-[#E8EFE4] px-4 py-3 text-sm text-[#405A3B]">Expense deleted. <button onClick={()=>void undo()} className="font-semibold underline">Undo</button></div>}
    <section className="card p-5"><h2 className="serif mb-1 text-xl text-[#493628]">Other expenses</h2><p className="mb-3 text-xs text-[#735E49]">Tap an entry for actions, or long-press it to delete.</p>{visibleOtherExpenses.length===0?<p className="text-sm text-[#735E49]">No other expenses recorded.</p>:visibleOtherExpenses.map(x=>{const attached=docs.filter(d=>d.expense_id===x.id);const open=expandedExpense===x.id;return <div key={x.id} className="border-t border-[#EEE5DA] py-3"><button type="button" onTouchStart={()=>startLongPress({kind:"expense",row:x})} onTouchEnd={cancelLongPress} onTouchMove={cancelLongPress} onContextMenu={e=>{e.preventDefault();setDeleteTarget({kind:"expense",row:x});}} onClick={()=>setExpandedExpense(open?null:x.id)} className="flex w-full items-center gap-3 text-left"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#493628]">{x.merchant||x.category.replaceAll("_"," ")}</p><p className="text-xs text-[#735E49]">{formatDate(x.expense_date)} · {x.description||""}</p></div><div className="text-right"><p className="text-sm font-semibold">{formatCurrency(Number(x.amount))}</p><span className="text-xs text-[#76583C] underline">{open?"Hide options":"View options"}</span></div></button>{open&&<div className="mt-3 rounded-lg bg-[#F8F3EC] p-3"><div className="flex justify-end gap-3"><button type="button" onClick={()=>openExpense(x)} className="text-xs underline">Edit</button><button type="button" onClick={()=>setDeleteTarget({kind:"expense",row:x})} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">Delete expense</button></div>{attached.length>0&&<div className="mt-2 border-t border-[#E8DDCF] pt-2"><p className="text-xs font-semibold text-[#735E49]">SUPPORTING DOCUMENTS ({attached.length})</p>{attached.map(d=><div key={d.id} className="mt-2 flex justify-between gap-2"><span className="truncate text-xs text-[#594936]">{d.title}</span><button type="button" onClick={()=>void openDoc(d.storage_path)} className="btn-secondary px-3 py-1 text-xs">Open</button></div>)}</div>}</div>}</div>})}</section>
    </div>
  </div>;
}


type ZipInput={name:string;blob:Blob};
function zipCrc32(bytes:Uint8Array){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
async function makeZip(files:ZipInput[]){const enc=new TextEncoder();const locals:Uint8Array[]=[];const centrals:Uint8Array[]=[];let offset=0;for(const file of files){const name=enc.encode(file.name);const data=new Uint8Array(await file.blob.arrayBuffer());const crc=zipCrc32(data);const local=new Uint8Array(30+name.length+data.length);const lv=new DataView(local.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0,true);lv.setUint16(8,0,true);lv.setUint16(10,0,true);lv.setUint16(12,0,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,name.length,true);lv.setUint16(28,0,true);local.set(name,30);local.set(data,30+name.length);locals.push(local);const central=new Uint8Array(46+name.length);const cv=new DataView(central.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0,true);cv.setUint16(10,0,true);cv.setUint16(12,0,true);cv.setUint16(14,0,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint16(30,0,true);cv.setUint16(32,0,true);cv.setUint16(34,0,true);cv.setUint16(36,0,true);cv.setUint32(38,0,true);cv.setUint32(42,offset,true);central.set(name,46);centrals.push(central);offset+=local.length;}const centralSize=centrals.reduce((n,x)=>n+x.length,0);const end=new Uint8Array(22);const ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(4,0,true);ev.setUint16(6,0,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);ev.setUint16(20,0,true);return new Blob([...locals,...centrals,end].map(part=>part.buffer.slice(part.byteOffset,part.byteOffset+part.byteLength) as ArrayBuffer),{type:"application/zip"});}

function VaultPage({ workspace, userId }: { workspace: Workspace; userId: string }) {
  const [documents, setDocuments] = useState<Database["public"]["Tables"]["vault_documents"]["Row"][]>([]);
  const [memoryFiles,setMemoryFiles] = useState<Database["public"]["Tables"]["memories"]["Row"][]>([]);
  const [memoryUrls,setMemoryUrls] = useState<Record<string,string>>({});

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Database["public"]["Tables"]["vault_documents"]["Row"]["category"]>("other");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [removedDocument, setRemovedDocument] = useState<Database["public"]["Tables"]["vault_documents"]["Row"] | null>(null);
  const [uploadOpen,setUploadOpen]=useState(false); const [vaultFilter,setVaultFilter]=useState("all"); const [exporting,setExporting]=useState(false);

  const load = useCallback(async () => {
    const [docsResult, memoriesResult] = await Promise.all([
      supabase.from("vault_documents").select("*").eq("workspace_id", workspace.id).is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("memories").select("*").eq("workspace_id", workspace.id).is("deleted_at", null).not("storage_path","is",null).order("memory_date", { ascending: false })
    ]);
    if (docsResult.error || memoriesResult.error) setError(docsResult.error?.message || memoriesResult.error?.message || "Unable to load vault.");
    setDocuments(docsResult.data ?? []);
    const memories=(memoriesResult.data ?? []) as Database["public"]["Tables"]["memories"]["Row"][];
    setMemoryFiles(memories);
    const signed=await Promise.all(memories.map(async row=>{if(!row.storage_path)return [row.id,""] as const;const {data}=await supabase.storage.from(VAULT_BUCKET).createSignedUrl(row.storage_path,60);return [row.id,data?.signedUrl??""] as const;}));
    setMemoryUrls(Object.fromEntries(signed));
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
    } else { setTitle(""); setFile(null); setUploadOpen(false); const input = document.getElementById("vault-file") as HTMLInputElement | null; if (input) input.value = ""; await load(); }
    setBusy(false);
  }

  async function exportVaultZip(){setExporting(true);setError("");try{const files:ZipInput[]=[];for(const row of documents){const {data,error:e}=await supabase.storage.from(VAULT_BUCKET).download(row.storage_path);if(e||!data)throw new Error("Could not download "+row.title+": "+(e?.message??"File unavailable"));files.push({name:"Documents/"+(row.title||row.file_name).replace(/[\\/:*?"<>|]/g,"_"),blob:data});}for(const row of memoryFiles){if(!row.storage_path)continue;const {data,error:e}=await supabase.storage.from(VAULT_BUCKET).download(row.storage_path);if(e||!data)throw new Error("Could not download a memory photo: "+(e?.message??"File unavailable"));const ext=(data.type.split("/")[1]||"jpg").replace("jpeg","jpg");files.push({name:"Memory photos/"+(row.title||"Memory").replace(/[\\/:*?"<>|]/g,"_")+"-"+row.id+"."+ext,blob:data});}const zip=await makeZip(files);const url=URL.createObjectURL(zip);const a=document.createElement("a");a.href=url;a.download="Meenas-Nest-Vault-Backup.zip";a.click();URL.revokeObjectURL(url);}catch(e){setError(e instanceof Error?e.message:"Unable to create ZIP backup.");}finally{setExporting(false);}}

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
    <div className="flex justify-end"><button type="button" onClick={()=>setUploadOpen(true)} className="btn-primary">+ Add document</button></div>
    {uploadOpen&&<div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-3 sm:items-center"><form onSubmit={submit} className="card max-h-[92vh] w-full max-w-xl overflow-y-auto p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="serif text-xl text-[#493628]">Add a document</h2><button type="button" onClick={()=>setUploadOpen(false)} className="text-sm underline">Close</button></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="field-label">Document title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="e.g. Scan report" required/></label>
        <label><span className="field-label">Category</span><select className="input" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>{["scan","lab_report","prescription","insurance","discharge_summary","other"].map((v) => <option key={v} value={v}>{v.replaceAll("_"," ")}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="field-label">Choose file</span><input id="vault-file" className="input file:mr-3 file:rounded-full file:border-0 file:bg-[#F0E7DA] file:px-3 file:py-2" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required/></label>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={()=>setUploadOpen(false)} className="btn-secondary">Cancel</button><button className="btn-primary inline-flex items-center gap-2" disabled={busy} type="submit"><UploadCloud size={16}/>{busy ? "Securing file…" : "Upload to private vault"}</button></div>
    </form></div>}
    {removedDocument && <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-[#E8EFE4] px-4 py-3 text-sm text-[#405A3B]"><span>Document moved to recently removed. The file is retained.</span><button onClick={() => void undoDocumentDelete()} className="font-semibold underline">Undo</button></div>}
    <section className="card p-5"><div className="mb-3 flex items-center justify-between"><h2 className="serif text-xl text-[#493628]">Memory keepsakes</h2><span className="text-xs text-[#735E49]">{memoryFiles.length} photos</span></div>{memoryFiles.length===0?<p className="text-sm text-[#735E49]">Photos saved in Memories will appear here.</p>:<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{memoryFiles.map(m=><article key={m.id} className="overflow-hidden rounded-xl bg-[#F8F3EC]">{memoryUrls[m.id]?<button type="button" onClick={()=>void openDocument(m.storage_path!)} className="block w-full"><img src={memoryUrls[m.id]} alt={m.title||"Memory"} className="h-36 w-full object-cover"/></button>:<div className="grid h-36 place-items-center text-xs text-[#735E49]">Preview unavailable</div>}<div className="p-3"><p className="truncate text-sm font-semibold text-[#493628]">{m.title||"Memory photo"}</p><p className="text-xs text-[#735E49]">{formatDate(m.memory_date)} · {m.pregnancy_week?"Week "+m.pregnancy_week:"Journey"}</p></div></article>)}</div>}</section>
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="serif text-xl text-[#493628]">Your documents</h2><span className="text-xs text-[#735E49]">{documents.length} files</span></div><button type="button" onClick={()=>void exportVaultZip()} disabled={exporting||(!documents.length&&!memoryFiles.length)} className="btn-secondary px-3 py-2 text-xs">{exporting?"Preparing ZIP…":"Download ZIP backup"}</button></div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{[{id:"all",label:"All"},{id:"scan",label:"Scans"},{id:"lab_report",label:"Lab reports"},{id:"prescription",label:"Prescriptions"},{id:"insurance",label:"Insurance"},{id:"discharge_summary",label:"Discharge"},{id:"other",label:"Other"}].map(item=><button key={item.id} type="button" onClick={()=>setVaultFilter(item.id)} className={"shrink-0 rounded-full px-3 py-2 text-xs font-semibold "+(vaultFilter===item.id?"bg-[#76583C] text-white":"bg-[#F5EFE6] text-[#735E49]")}>{item.label}</button>)}</div>
      {!loaded ? <p className="py-8 text-center text-sm text-[#735E49]">Loading your vault…</p> : documents.filter(row=>vaultFilter==="all"||row.category===vaultFilter).length === 0 ? <EmptyState title="Nothing filed yet" body="No documents match this category. Try another filter or add a document."/> : <div className="divide-y divide-[#EEE5DA]">{documents.filter(row=>vaultFilter==="all"||row.category===vaultFilter).map((row) => <div key={row.id} className="flex items-center gap-3 py-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F5EFE6] text-[#735E49]"><FileText size={18}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#493628]">{row.title}</p><p className="text-xs capitalize text-[#735E49]">{row.category.replaceAll("_"," ")} · {(row.size_bytes / 1024 / 1024).toFixed(1)} MB</p></div><button className="btn-secondary px-3 py-2 text-xs" onClick={() => void openDocument(row.storage_path)}>Open</button><button aria-label={"Remove " + row.title} className="px-2 py-2 text-xs text-[#735E49]" onClick={() => void softDelete(row)}>Remove</button></div>)}</div>}
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


function MemoriesPage({workspace,userId,profile}:{workspace:Workspace;userId:string;profile:Profile|null}) {
  type Memory=Database["public"]["Tables"]["memories"]["Row"];
  type Comment=Database["public"]["Tables"]["memory_comments"]["Row"];
  const [rows,setRows]=useState<Memory[]>([]);
  const [notes,setNotes]=useState<Record<string,Comment[]>>({});
  const [date,setDate]=useState(localToday()); const [title,setTitle]=useState(""); const [story,setStory]=useState(""); const [mood,setMood]=useState(""); const [location,setLocation]=useState(""); const [photo,setPhoto]=useState<File|null>(null); const [draft,setDraft]=useState<Record<string,string>>({});
  const [composer,setComposer]=useState(false); const [editing,setEditing]=useState<Memory|null>(null); const [search,setSearch]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const age=profile?.lmp_date?calculateGestationalAge(profile.lmp_date,date):null;
  const load=useCallback(async()=>{const {data,error:e}=await supabase.from("memories").select("*").eq("workspace_id",workspace.id).is("deleted_at",null).order("memory_date",{ascending:false});if(e){setError(e.message);return;}const all=(data??[]) as Memory[];setRows(all);if(all.length){const {data:cs,error:ce}=await supabase.from("memory_comments").select("*").in("memory_id",all.map(x=>x.id)).is("deleted_at",null).order("created_at");if(ce){setError(ce.message);return;}const grouped:Record<string,Comment[]>={};for(const x of (cs??[]) as Comment[])(grouped[x.memory_id]??=[]).push(x);setNotes(grouped);}else setNotes({});},[workspace.id]);
  useEffect(()=>{void load();},[load]);
  function resetComposer(){setComposer(false);setEditing(null);setDate(localToday());setTitle("");setStory("");setMood("");setLocation("");setPhoto(null);const input=document.getElementById("memory-photo") as HTMLInputElement|null;if(input)input.value="";}
  function openEdit(row:Memory){setEditing(row);setDate(row.memory_date);setTitle(row.title??"");setStory(row.story??"");setMood(row.mood??"");setLocation(row.location??"");setPhoto(null);setComposer(true);}
  async function save(e:FormEvent){e.preventDefault();if(!editing&&!photo){setError("Choose a photo for this memory.");return;}if(photo&&photo.size>10*1024*1024){setError("Photo must be 10 MB or smaller.");return;}setBusy(true);setError("");let newPath:string|null=null;
    try{
      if(photo){newPath=workspace.id+"/memories/"+crypto.randomUUID();const {error:up}=await supabase.storage.from(VAULT_BUCKET).upload(newPath,photo,{contentType:photo.type,upsert:false});if(up)throw up;}
      const payload={memory_date:date,pregnancy_week:age?.weeks??(editing?.pregnancy_week??null),title:title.trim(),story:story.trim(),mood:mood.trim()||null,location:location.trim()||null,...(newPath?{storage_path:newPath,file_name:photo?.name,mime_type:photo?.type}:{})};
      const result=editing?await supabase.from("memories").update(payload).eq("id",editing.id).eq("workspace_id",workspace.id):await supabase.from("memories").insert({workspace_id:workspace.id,created_by:userId,...payload});
      if(result.error)throw result.error;
      if(newPath&&editing?.storage_path)await supabase.storage.from(VAULT_BUCKET).remove([editing.storage_path]);
      resetComposer();await load();
    }catch(err){if(newPath)await supabase.storage.from(VAULT_BUCKET).remove([newPath]);setError(err instanceof Error?err.message:"Unable to save this memory.");}
    finally{setBusy(false);}
  }
  async function removeMemory(row:Memory){if(!window.confirm("Move this memory out of your journal? Its photo will remain in private storage for now."))return;const {error:e}=await supabase.from("memories").update({deleted_at:new Date().toISOString()}).eq("id",row.id).eq("workspace_id",workspace.id);if(e)setError(e.message);else await load();}
  async function addNote(id:string){const body=(draft[id]??"").trim();if(!body)return;const {error:e}=await supabase.from("memory_comments").insert({workspace_id:workspace.id,memory_id:id,created_by:userId,body});if(e)setError(e.message);else{setDraft(v=>({...v,[id]:""}));await load();}}
  const filtered=rows.filter(r=>[r.title,r.story,r.mood,r.location].some(v=>(v??"").toLowerCase().includes(search.toLowerCase())));
  const milestoneWeeks=Array.from(new Set(rows.map(r=>r.pregnancy_week).filter((v):v is number=>v!==null))).sort((a,b)=>a-b);
  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#735E49]">Little moments, kept forever</p><h1 className="serif mt-1 text-3xl text-[#493628]">Pregnancy journal</h1><p className="mt-1 text-sm text-[#735E49]">A private journal for the moments, feelings and milestones you want to remember.</p></div><button className="btn-primary" onClick={()=>{setEditing(null);setDate(localToday());setComposer(true);}}>+ Add memory</button></header>
    <section className="card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#735E49]">Your journal so far</p><h2 className="serif mt-1 text-xl text-[#493628]">{rows.length} saved {rows.length===1?"moment":"moments"}</h2></div><span className="rounded-full bg-[#E8EFE4] px-3 py-1 text-xs text-[#405A3B]">{milestoneWeeks.length} pregnancy weeks captured</span></div>
      {milestoneWeeks.length? <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{milestoneWeeks.map(w=><span key={w} className="shrink-0 rounded-full border border-[#D8C7AE] bg-[#F8F3EC] px-3 py-2 text-xs font-semibold text-[#76583C]">Week {w}</span>)}</div>:<p className="mt-3 text-xs text-[#735E49]">Pregnancy-week highlights will appear here as you save dated memories.</p>}
    </section>
    <label className="block"><span className="field-label">Search your journal</span><input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search titles, stories, moods or places"/></label>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {composer&&<div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-black/40 p-3 sm:items-center"><form onSubmit={save} className="card my-4 w-full max-w-lg space-y-3 p-5"><div className="flex justify-between"><div><p className="text-xs uppercase tracking-wider text-[#735E49]">{editing?"Update a saved moment":"Add to your story"}</p><h2 className="serif text-2xl text-[#493628]">{editing?"Edit memory":"A moment to remember"}</h2></div><button type="button" onClick={resetComposer}>Close</button></div><label className="block"><span className="field-label">Photo {editing?"(optional — choose a replacement)":"(required)"}</span><input id="memory-photo" className="input" type="file" accept="image/*" required={!editing} onChange={e=>setPhoto(e.target.files?.[0]??null)}/></label><label className="block"><span className="field-label">Date</span><input className="input" type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><label className="block"><span className="field-label">Title</span><input className="input" value={title} onChange={e=>setTitle(e.target.value)} maxLength={140} placeholder="Give this moment a little title"/></label><label className="block"><span className="field-label">Your story</span><textarea className="input min-h-28" value={story} onChange={e=>setStory(e.target.value)} maxLength={5000} placeholder="What happened? How did you feel? What would you like to remember?"/></label><div className="grid grid-cols-2 gap-3"><label><span className="field-label">Mood</span><input className="input" value={mood} onChange={e=>setMood(e.target.value)} maxLength={80} placeholder="Excited, grateful…"/></label><label><span className="field-label">Location</span><input className="input" value={location} onChange={e=>setLocation(e.target.value)} maxLength={140} placeholder="Where was this?"/></label></div>{age&&<p className="rounded-lg bg-[#F8F3EC] p-3 text-xs text-[#735E49]">Based on the saved pregnancy date: Week {age.weeks} + {age.days} days on this memory date.</p>}<button className="btn-primary w-full" disabled={busy}>{busy?"Saving securely…":editing?"Save changes":"Save memory"}</button></form></div>}
    {filtered.length===0?<section className="card p-8 text-center"><h2 className="serif text-xl">{rows.length?"No matching memories":"Your story starts here"}</h2><p className="mt-2 text-sm text-[#735E49]">{rows.length?"Try another search term.":"Save bump updates, scan keepsakes and little moments together."}</p>{!rows.length&&<button className="btn-primary mt-4" onClick={()=>setComposer(true)}>Add your first memory</button>}</section>:<div className="mx-auto max-w-2xl space-y-5">{filtered.map(m=><MemoryEntry key={m.id} row={m} comments={notes[m.id]??[]} draft={draft[m.id]??""} setDraft={v=>setDraft(x=>({...x,[m.id]:v}))} onPost={()=>void addNote(m.id)} onEdit={()=>openEdit(m)} onDelete={()=>void removeMemory(m)}/>)}</div>}
  </div>;
}
function MemoryEntry({row,comments,draft,setDraft,onPost,onEdit,onDelete}:{row:Database["public"]["Tables"]["memories"]["Row"];comments:Database["public"]["Tables"]["memory_comments"]["Row"][];draft:string;setDraft:(v:string)=>void;onPost:()=>void;onEdit:()=>void;onDelete:()=>void}) {
 const [url,setUrl]=useState("");useEffect(()=>{let live=true;if(row.storage_path)supabase.storage.from(VAULT_BUCKET).createSignedUrl(row.storage_path,300).then(({data})=>{if(live&&data?.signedUrl)setUrl(data.signedUrl);});return()=>{live=false;};},[row.storage_path]);
 return <article className="card overflow-hidden"><div className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><p className="font-semibold text-[#493628]">{row.title||"A little memory"}</p><p className="text-xs text-[#735E49]">{formatDate(row.memory_date)} · {row.pregnancy_week?"Week "+row.pregnancy_week:"Pregnancy journey"}{row.location?" · "+row.location:""}{row.mood?" · "+row.mood:""}</p></div><div className="flex shrink-0 gap-3"><button type="button" onClick={onEdit} className="text-xs font-semibold text-[#76583C] underline">Edit</button><button type="button" onClick={onDelete} className="text-xs text-[#8A5148] underline">Remove</button></div></div>{url&&<img src={url} alt={row.title||"Pregnancy memory"} className="max-h-[560px] w-full bg-[#F5EFE6] object-contain"/>}<div className="p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-[#594936]">{row.story}</p><div className="mt-4 border-t border-[#EEE5DA] pt-3"><p className="mb-2 text-xs font-semibold text-[#735E49]">Partner notes</p>{comments.map(x=><p key={x.id} className="mb-2 rounded-xl bg-[#F8F3EC] p-3 text-sm">{x.body}</p>)}<div className="flex gap-2"><input className="input" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Add a little note…"/><button type="button" className="btn-secondary" onClick={onPost}>Post</button></div></div></div></article>;
}

function MorePage({ email, workspaceId, onSignOut, darkMode, onToggleTheme }: { email: string; workspaceId: string; onSignOut: () => void; darkMode: boolean; onToggleTheme: () => void }) {
  const [exportBusy,setExportBusy]=useState(false); const [exportError,setExportError]=useState("");
  async function exportBundle(kind:"memory"|"medical"){
    setExportBusy(true);setExportError("");
    try{
      const [mem,vis,exp,doc]=await Promise.all([
        supabase.from("memories").select("*").eq("workspace_id",workspaceId).is("deleted_at",null).order("memory_date"),
        supabase.from("consultations").select("*").eq("workspace_id",workspaceId).is("deleted_at",null).order("consultation_date"),
        supabase.from("expenses").select("*").eq("workspace_id",workspaceId).is("deleted_at",null).order("expense_date"),
        supabase.from("vault_documents").select("*").eq("workspace_id",workspaceId).is("deleted_at",null).order("document_date")
      ]);
      const failure=mem.error||vis.error||exp.error||doc.error;if(failure)throw failure;
      const esc=(v:unknown)=>String(v??"").replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]??ch));
      let body="";
      if(kind==="memory"){
        const entries=await Promise.all((mem.data??[]).map(async row=>{let photo="";if(row.storage_path){const {data}=await supabase.storage.from(VAULT_BUCKET).createSignedUrl(row.storage_path,300);if(data?.signedUrl)photo=`<img src="${esc(data.signedUrl)}" style="max-width:100%;max-height:420px;object-fit:contain;border-radius:12px;margin:12px 0">`;}return `<article><h2>${esc(row.title||"A little memory")}</h2><p class="muted">${esc(formatDate(row.memory_date))} · ${esc(row.pregnancy_week?`Week ${row.pregnancy_week}`:"Pregnancy journey")} ${row.location?"· "+esc(row.location):""}</p>${photo}<p>${esc(row.story)}</p><hr></article>`;}));
        body=`<h1>Our pregnancy memory book</h1>${entries.join("")||"<p>No memories saved yet.</p>"}`;
      }else{
        const visits=(vis.data??[]).map(v=>`<article><h2>${esc(formatDate(v.consultation_date))} · ${esc(v.doctor_name||"Consultation")}</h2><p>${esc(v.hospital)} · Week ${esc(v.pregnancy_week??"—")}</p><p><b>Brief:</b> ${esc(v.day_brief||v.reason||"Not recorded")}</p><p><b>Observations:</b> ${esc(v.notes)} · <b>Advice:</b> ${esc(v.advice)}</p><p><b>Vitals:</b> BP ${esc(v.blood_pressure||"—")}, Weight ${esc(v.weight_kg??"—")} kg, Fetal HR ${esc(v.fetal_heart_rate??"—")} bpm</p><p><b>Medicines:</b> ${esc(Array.isArray(v.medicines)?(v.medicines as unknown as Medicine[]).map(m=>[m.name,m.dosage,m.schedule,m.instructions].filter(Boolean).join(" · ")).join("; "):"—")}</p><p><b>Follow-up:</b> ${esc(v.follow_up_date?formatDate(v.follow_up_date):"—")}</p></article>`);
        const expenses=(exp.data??[]).map(x=>`<li>${esc(formatDate(x.expense_date))} · ${esc(x.category.replaceAll("_"," "))} · ${esc(x.description||x.merchant||"")} · ${esc(formatCurrency(Number(x.amount)))}</li>`).join("");
        const documents=(doc.data??[]).map(x=>`<li>${esc(x.title)} · ${esc(x.category.replaceAll("_"," "))} · ${esc(x.document_date?formatDate(x.document_date):"Date not recorded")}</li>`).join("");
        body=`<h1>Medical & expense dossier</h1><h2>Consultations</h2>${visits.join("")||"<p>No consultations recorded.</p>"}<h2>Expenses</h2><ul>${expenses||"<li>No expenses recorded.</li>"}</ul><h2>Documents on file</h2><ul>${documents||"<li>No documents uploaded.</li>"}</ul>`;
      }
      const win=window.open("","_blank","noopener,noreferrer");if(!win)throw new Error("Allow pop-ups to create the PDF.");
      win.document.open();win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${kind==="memory"?"Memory book":"Medical dossier"}</title><style>body{font:14px Arial,sans-serif;color:#40352c;margin:32px;line-height:1.6}h1,h2{font-family:Georgia,serif;color:#493628}h1{font-size:28px}h2{font-size:19px;margin-top:24px}.muted{color:#786958}article{page-break-inside:avoid;margin:20px 0}hr{border:0;border-top:1px solid #e8ddcf;margin:20px 0}@media print{body{margin:18mm}}</style></head><body>${body}<p class="muted">Generated from records saved in Meena’s Nest. This is an organiser export, not a substitute for original medical records.</p><script>window.onload=()=>window.print()</script></body></html>`);win.document.close();
    }catch(err){setExportError(err instanceof Error?err.message:"Unable to prepare export.");}finally{setExportBusy(false);}
  }
  return <div className="space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#735E49]">A few useful details</p><h1 className="serif mt-1 text-3xl text-[#493628]">Settings</h1></header>
    <section className="card p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E8EFE4] text-[#58704F]"><Settings size={20}/></span><div><p className="font-semibold text-[#493628]">Account</p><p className="text-sm text-[#735E49]">{email}</p></div></div><button onClick={onToggleTheme} className="btn-secondary mt-5 inline-flex items-center gap-2"><Sun size={16}/>{darkMode ? "Switch to light theme" : "Switch to dark theme"}<Moon size={15}/></button><button onClick={onSignOut} className="btn-secondary ml-2 mt-5 inline-flex items-center gap-2"><LogOut size={16}/>Sign out</button></section>
    <section className="card p-5"><h2 className="serif text-xl text-[#493628]">Privacy & care</h2><p className="mt-2 text-sm leading-6 text-[#735E49]">This app is a personal organiser. It does not diagnose, interpret test results or replace advice from your doctor. Pregnancy data is accessible only to signed-in members of your private workspace.</p><p className="mt-3 text-xs text-[#735E49]">Timezone: India Standard Time · Date display: DD-MM-YYYY · Currency: INR</p></section>
    <section className="card p-5"><h2 className="serif text-xl text-[#493628]">Journey backup & export</h2><p className="mt-2 text-sm leading-6 text-[#735E49]">Create printable PDF exports from the records currently saved in your private workspace.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={exportBusy} onClick={()=>void exportBundle("memory")} className="btn-secondary">{exportBusy?"Preparing…":"Memory-book PDF"}</button><button type="button" disabled={exportBusy} onClick={()=>void exportBundle("medical")} className="btn-secondary">Medical & expense PDF</button></div>{exportError&&<p role="alert" className="mt-3 text-sm text-red-800">{exportError}</p>}<p className="mt-3 text-xs text-[#735E49]">Use your browser’s Print dialog and choose “Save as PDF”. Original file ZIP export is not included yet.</p></section>
    <section className="card p-5"><div className="flex items-center gap-3"><CircleHelp className="text-[#735E49]"/><div><p className="font-semibold text-[#493628]">Current foundation</p><p className="text-sm text-[#735E49]">Authentication, shared workspace, pregnancy profile, expenses and private vault.</p></div></div></section>
  </div>;
}

export default function App() {
  const [settingsOpen,setSettingsOpen]=useState(false);
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

  const headerAge = profile?.lmp_date ? calculateGestationalAge(profile.lmp_date, localToday()) : null;
  return <div className="min-h-screen pb-28">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
      <div className="flex items-center gap-3"><img src="/nest-icon.svg" alt="Meena’s Nest logo" className="h-11 w-11 rounded-xl object-cover shadow-sm"/><div><p className="serif text-xl leading-none text-[#493628]">{APP_NAME}</p><p className="mt-1 text-[11px] text-[#735E49]">{headerAge ? "Trimester " + trimesterForWeek(headerAge.weeks) + " · Week " + headerAge.weeks : workspace.name}</p></div></div>
      <div className="flex items-center gap-2"><span className="hidden rounded-full bg-[#E8EFE4] px-3 py-2 text-xs font-semibold text-[#48623F] sm:inline-flex"><ShieldCheck size={14} className="mr-1"/>Private space</span><button onClick={() => setSettingsOpen(true)} aria-label="Open settings" className="grid h-10 w-10 place-items-center rounded-full border border-[#E8DDCF] bg-white text-[#76583C]"><Settings size={18}/></button></div>
    </header>
    <main className="mx-auto max-w-6xl px-4 pb-10 md:px-8">
      {error && <div role="alert" className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={16}/></button></div>}
      {page === "home" && <Dashboard workspace={workspace} profile={profile} userId={session.user.id} onProfileSaved={setProfile} onNavigate={setPage}/>}
      {page === "expenses" && <ExpensePage workspace={workspace} userId={session.user.id}/>}
      {page === "vault" && <VaultPage workspace={workspace} userId={session.user.id}/>}
      {page === "family" && <FamilyPage workspace={workspace} userId={session.user.id}/>}
      {page === "memories" && <MemoriesPage workspace={workspace} userId={session.user.id} profile={profile}/>}
    </main>
    {settingsOpen && <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={()=>setSettingsOpen(false)}><section className="card max-h-[85vh] w-full max-w-xl overflow-y-auto p-5" role="dialog" aria-modal="true" aria-label="Settings" onClick={e=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h2 className="serif text-2xl text-[#493628]">Settings</h2><button onClick={()=>setSettingsOpen(false)} aria-label="Close settings"><X/></button></div><MorePage email={session.user.email ?? ""} workspaceId={workspace.id} onSignOut={() => void signOut()} darkMode={darkMode} onToggleTheme={() => setDarkMode((value) => !value)}/></section></div>}
    <nav aria-label="Main navigation" className="bottom-safe fixed inset-x-0 bottom-0 z-20 border-t border-[#E8DDCF] bg-[#FFFCF7]/95 backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-5 px-2 pt-2">
        {navItems.map((item) => <button key={item.id} onClick={() => setPage(item.id)} aria-current={page === item.id ? "page" : undefined} className={"flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold " + (page === item.id ? "text-[#684B32]" : "text-[#735E49]")}><span className={"grid h-8 w-12 place-items-center rounded-full " + (page === item.id ? "bg-[#F0E4D4]" : "")}><NavGlyph name={item.icon}/></span>{item.label}</button>)}
      </div>
    </nav>
  </div>;
}
