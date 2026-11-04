import type { ReactNode } from "react";

type Props = { kind?: "nest" | "empty" | "vault" | "leaf" | "fruit"; week?: number; className?: string };

export function Illustration({ kind = "nest", week = 0, className = "" }: Props) {

  if (kind === "fruit") {
    const fruit = week < 9 ? "berry" : week < 13 ? "lime" : week < 17 ? "avocado" : week < 21 ? "banana" : week < 25 ? "papaya" : week < 29 ? "eggplant" : week < 33 ? "coconut" : week < 37 ? "pineapple" : "watermelon";
    return (
      <svg viewBox="0 0 150 116" role="img" aria-label={"Illustration of a " + fruit + " for a general pregnancy size comparison"} className={className}>
        <ellipse cx="75" cy="101" rx="42" ry="7" fill="#8B6B4A" opacity=".10"/>
        {fruit === "berry" && <g><circle cx="59" cy="58" r="17" fill="#A9B3C8" stroke="#68758B" strokeWidth="2"/><circle cx="82" cy="51" r="18" fill="#BAC4D8" stroke="#68758B" strokeWidth="2"/><circle cx="88" cy="73" r="16" fill="#9DAAC2" stroke="#68758B" strokeWidth="2"/><path d="m66 39 7-7 5 8M86 32l7-7 5 9" fill="none" stroke="#71866A" strokeWidth="3" strokeLinecap="round"/></g>}
        {fruit === "lime" && <g><circle cx="75" cy="59" r="31" fill="#B7C996" stroke="#71866A" strokeWidth="2.5"/><path d="M75 28c-3-12 6-17 14-15-1 9-6 14-14 15Z" fill="#71866A"/><path d="M57 52c8-12 20-17 32-14" stroke="#E5F0D3" strokeWidth="5" strokeLinecap="round" fill="none"/></g>}
        {fruit === "avocado" && <g><path d="M75 19c-16 0-24 19-29 36-8 26 6 45 29 45s37-19 29-45C99 38 91 19 75 19Z" fill="#91AC79" stroke="#627A55" strokeWidth="2.5"/><path d="M75 39c-11 0-16 15-20 29-6 18 3 29 20 29s26-11 20-29C91 54 86 39 75 39Z" fill="#DBE4B8"/><circle cx="75" cy="77" r="13" fill="#B78551" stroke="#8B6B4A" strokeWidth="2"/><path d="M75 20c-1-9 6-13 13-12" stroke="#71866A" strokeWidth="3" strokeLinecap="round"/></g>}
        {fruit === "banana" && <g><path d="M34 43c16 30 43 43 83 26-7 25-28 36-51 30C43 91 28 68 34 43Z" fill="#E7C76A" stroke="#A88742" strokeWidth="2.5"/><path d="M36 42c3-6 9-7 14-3M112 69l7 4" stroke="#8B6B4A" strokeWidth="3" strokeLinecap="round"/><path d="M53 66c16 14 35 18 56 8" stroke="#F8E8A9" strokeWidth="4" fill="none" strokeLinecap="round"/></g>}
        {fruit === "papaya" && <g><path d="M75 17c-18 3-33 24-31 49 2 23 14 37 31 37s29-14 31-37C108 41 93 20 75 17Z" fill="#EAAE73" stroke="#A97648" strokeWidth="2.5"/><path d="M75 23c-12 4-23 23-21 43 1 19 9 31 21 32 12-1 20-13 21-32 2-20-9-39-21-43Z" fill="#F6D49A"/><ellipse cx="75" cy="73" rx="9" ry="18" fill="#E38B55"/><g fill="#6F5238"><ellipse cx="75" cy="62" rx="2.2" ry="3"/><ellipse cx="70" cy="70" rx="2.2" ry="3"/><ellipse cx="80" cy="71" rx="2.2" ry="3"/><ellipse cx="75" cy="80" rx="2.2" ry="3"/></g></g>}
        {fruit === "eggplant" && <g><path d="M49 30c-4 14 5 26 18 34 19 11 16 29 4 38 25-1 48-21 38-48-8-22-37-32-60-24Z" fill="#8875A1" stroke="#66547E" strokeWidth="2.5"/><path d="M49 31c-7-2-12-8-10-16 8 0 13 4 15 11 10-7 19-5 25 0-6 10-20 11-30 5Z" fill="#7A9867" stroke="#58734E" strokeWidth="2"/><path d="M74 48c12 5 20 17 19 30" stroke="#B9A8CC" strokeWidth="4" strokeLinecap="round" fill="none"/></g>}
        {fruit === "coconut" && <g><ellipse cx="75" cy="61" rx="35" ry="38" fill="#9D754F" stroke="#745033" strokeWidth="3"/><path d="M49 42c-10-12-3-24 8-25 0 11 6 16 18 18-4-15 9-22 17-17-5 11-2 20 8 27" fill="#B6946B" stroke="#745033" strokeWidth="2.5"/><ellipse cx="75" cy="65" rx="25" ry="27" fill="#FBF0D7"/><circle cx="67" cy="53" r="3" fill="#745033"/><circle cx="83" cy="53" r="3" fill="#745033"/></g>}
        {fruit === "pineapple" && <g><path d="M75 28c-20 0-29 14-27 41 2 22 11 34 27 34s25-12 27-34c2-27-7-41-27-41Z" fill="#E6BD65" stroke="#A88742" strokeWidth="2.5"/><path d="M75 30c-7-14-4-24 3-29 8 11 8 20 3 28 6-15 17-20 23-16-1 12-12 19-22 20 14-8 27-5 30 3-9 8-23 6-32-1Z" fill="#8DA47B" stroke="#637E5D" strokeWidth="2"/><path d="m55 45 40 40M95 45 55 85M52 62h46" stroke="#B78F4F" strokeWidth="2" opacity=".7"/></g>}
        {fruit === "watermelon" && <g><path d="M37 76a38 38 0 0 1 76 0Z" fill="#8EAE79" stroke="#55774E" strokeWidth="2.5"/><path d="M45 75a30 30 0 0 1 60 0Z" fill="#F0B5A9"/><path d="M53 74a22 22 0 0 1 44 0Z" fill="#D86F67"/><g fill="#654B35"><ellipse cx="65" cy="62" rx="2" ry="4"/><ellipse cx="77" cy="56" rx="2" ry="4"/><ellipse cx="87" cy="65" rx="2" ry="4"/></g></g>}
        <path d="M24 100c20 7 82 7 102 0" fill="none" stroke="#DCCDBB" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
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
