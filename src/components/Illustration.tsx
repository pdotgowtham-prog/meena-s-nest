import type { ReactNode } from "react";

type Props = { kind?: "nest" | "empty" | "vault" | "leaf"; week?: number; className?: string };

export function Illustration({ kind = "nest", week = 0, className = "" }: Props) {
  if (kind === "vault") return (
    <svg viewBox="0 0 180 140" role="img" aria-label="A small folder resting in a nest" className={className}>
      <path d="M32 106c28 18 88 18 116 0M42 97c24 14 72 14 96 0" fill="none" stroke="#8B6B4A" strokeWidth="5" strokeLinecap="round"/>
      <rect x="56" y="42" width="69" height="54" rx="10" fill="#E7CBA7" stroke="#8B6B4A" strokeWidth="3"/>
      <path d="M56 56h27l8 9h34v31H56z" fill="#F8E9D3" stroke="#8B6B4A" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M73 69h35M73 79h27" stroke="#B99A76" strokeWidth="3" strokeLinecap="round"/>
      <path d="M39 42c-8-12-4-21 5-24 8 11 7 18-5 24ZM137 38c7-11 16-10 20-3-5 9-12 11-20 3Z" fill="#A8B99A"/>
    </svg>
  );
  if (kind === "empty") return (
    <svg viewBox="0 0 180 140" role="img" aria-label="An empty little nest" className={className}>
      <path d="M29 96c30 24 92 24 122 0M38 85c25 19 79 19 104 0M49 74c20 13 62 13 82 0" fill="none" stroke="#8B6B4A" strokeWidth="5" strokeLinecap="round"/>
      <path d="M88 61c-14-18-6-31 1-38 14 16 15 28-1 38Z" fill="#A8B99A" stroke="#71866A" strokeWidth="2"/>
      <path d="M88 66v19" stroke="#8B6B4A" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
  if (kind === "leaf") return (
    <svg viewBox="0 0 180 140" role="img" aria-label="A soft sage leaf" className={className}>
      <path d="M90 119C27 95 30 30 137 21c8 70-19 92-47 98Z" fill="#B8C9A7" stroke="#71866A" strokeWidth="3"/>
      <path d="M49 95c25-24 46-43 78-62M75 73l-3-24M92 59l25 5" fill="none" stroke="#71866A" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
  const trimester = week < 14 ? 1 : week < 28 ? 2 : 3;
  return (
    <svg viewBox="0 0 260 190" role="img" aria-label={trimester === 1 ? "A small nest of bare twigs" : trimester === 2 ? "A nest with soft lining and leaves" : "A cosy nest with a glowing egg"} className={className}>
      <ellipse cx="130" cy="157" rx="91" ry="13" fill="#8B6B4A" opacity=".10"/>
      {trimester >= 2 && <>
        <path d="M69 119c-28-26-27-53-11-64 22 11 26 38 11 64ZM190 112c28-24 29-51 13-61-22 10-27 36-13 61Z" fill="#A8B99A" stroke="#71866A" strokeWidth="2"/>
        <path d="M60 93c11 8 18 17 22 27M197 89c-11 8-18 17-22 27" stroke="#71866A" strokeWidth="2" fill="none"/>
      </>}
      <g className="nest-sway">
        <path d="M46 116c24 35 144 35 168 0M53 106c26 28 128 28 154 0M64 96c25 22 107 22 132 0M76 86c24 17 84 17 108 0" fill="none" stroke="#8B6B4A" strokeWidth="5" strokeLinecap="round"/>
        <path d="M59 120c30 24 112 24 142 0M68 129c30 20 94 20 124 0" fill="none" stroke="#B48D63" strokeWidth="3" strokeLinecap="round"/>
        {trimester >= 2 && <path d="M78 109c19 13 84 14 104 0" stroke="#E6C7A1" strokeWidth="8" fill="none" strokeLinecap="round"/>}
        {trimester === 3 && <path d="M90 108c17 15 63 15 80 0" stroke="#F2C9C0" strokeWidth="7" fill="none" strokeLinecap="round"/>}
        {trimester === 3 && <>
          <ellipse className="egg-glow" cx="130" cy="78" rx="42" ry="42" fill="#E3B565" opacity=".15"/>
          <ellipse cx="130" cy="80" rx="25" ry="33" fill="#FFF0C9" stroke="#C89B53" strokeWidth="3"/>
          <path d="M122 58c-8 9-8 22-3 31" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity=".9"/>
          <path d="M93 90c-9-9-13-20-8-29M166 89c9-9 13-20 8-29" stroke="#F7E6D2" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </>}
      </g>
      {trimester === 1 && <path d="M86 87c-8-18-3-29 9-33M174 87c8-18 3-29-9-33" stroke="#8B6B4A" strokeWidth="3" fill="none" strokeLinecap="round"/>}
      {trimester >= 2 && <g fill="#F2C9C0" opacity=".9"><circle cx="94" cy="75" r="3"/><circle cx="165" cy="68" r="3"/><circle cx="74" cy="103" r="2.5"/></g>}
      <path d="M39 117c-11-12-12-24-4-31 11 9 14 18 4 31ZM221 116c11-12 12-24 4-31-11 9-14 18-4 31Z" fill="#A8B99A" stroke="#71866A" strokeWidth="2"/>
    </svg>
  );
}

export function EmptyState({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
    <Illustration kind="empty" className="mb-2 h-32 w-44" />
    <h3 className="serif text-xl text-[#4A3829]">{title}</h3>
    <p className="mt-1 max-w-sm text-sm leading-6 text-[#796856]">{body}</p>
    {children}
  </div>;
}
