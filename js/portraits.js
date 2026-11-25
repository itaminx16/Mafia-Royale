// =====================================================================
//  PORTRAITS — процедурні SVG-портрети карт і веж (viewBox 0 0 100 100)
//  Стиль: нуарний комікс, товстий контур 3px #111, фон за рідкістю
// =====================================================================
import { RARITY, CARD_MAP, TOWER_MAP } from './data.js';

const O = 'stroke="#111" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

function bg(rarity, uid) {
  const r = RARITY[rarity] || RARITY.common;
  if (rarity === 'legendary') {
    return `<defs><radialGradient id="g${uid}" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#fbbf24"/><stop offset=".55" stop-color="#D97706"/><stop offset="1" stop-color="#78350f"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g${uid})"/>`;
  }
  return `<defs><radialGradient id="g${uid}" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${r.color}"/><stop offset="1" stop-color="${r.color2}"/></radialGradient></defs>
  <rect width="100" height="100" fill="url(#g${uid})"/>`;
}

// Спільні частини
const fedora = (cx, cy, s, col = '#1c1c1c', band = '#7f1d1d') => `
  <ellipse cx="${cx}" cy="${cy + 6 * s}" rx="${30 * s}" ry="${7 * s}" fill="${col}" ${O}/>
  <path d="M${cx - 18 * s} ${cy + 6 * s} Q${cx - 17 * s} ${cy - 14 * s} ${cx} ${cy - 14 * s} Q${cx + 17 * s} ${cy - 14 * s} ${cx + 18 * s} ${cy + 6 * s} Z" fill="${col}" ${O}/>
  <path d="M${cx - 17.5 * s} ${cy + 1 * s} L${cx + 17.5 * s} ${cy + 1 * s}" stroke="${band}" stroke-width="${5 * s}"/>
  <path d="M${cx - 6 * s} ${cy - 13 * s} Q${cx} ${cy - 8 * s} ${cx + 6 * s} ${cy - 13 * s}" fill="none" stroke="#000" stroke-width="2" opacity=".5"/>`;
const face = (cx, cy, s, skin = '#e0b48f') => `<ellipse cx="${cx}" cy="${cy}" rx="${16 * s}" ry="${18 * s}" fill="${skin}" ${O}/>`;
const shoulders = (col, extra = '') => `<path d="M14 100 Q16 72 50 70 Q84 72 86 100 Z" fill="${col}" ${O}/>${extra}`;
const eyes = (cx, cy, s, angry = true) => `
  <circle cx="${cx - 6 * s}" cy="${cy}" r="${2 * s}" fill="#111"/><circle cx="${cx + 6 * s}" cy="${cy}" r="${2 * s}" fill="#111"/>
  ${angry ? `<path d="M${cx - 10 * s} ${cy - 5 * s} L${cx - 3 * s} ${cy - 3 * s} M${cx + 10 * s} ${cy - 5 * s} L${cx + 3 * s} ${cy - 3 * s}" stroke="#111" stroke-width="2.5"/>` : ''}`;

const ART = {
  unit_bouncer: () => `
    ${shoulders('#2b2b2b', '<path d="M42 72 L50 86 L58 72" fill="#eee" stroke="#111" stroke-width="2"/>')}
    <rect x="34" y="20" width="32" height="46" rx="14" fill="#c99a76" ${O}/>
    <rect x="33" y="36" width="34" height="9" rx="3" fill="#111"/>
    <path d="M42 56 Q50 52 58 56" fill="none" stroke="#111" stroke-width="3"/>
    <circle cx="18" cy="76" r="11" fill="#b91c1c" ${O}/><circle cx="82" cy="76" r="11" fill="#b91c1c" ${O}/>
    <path d="M36 28 Q50 22 64 28" fill="none" stroke="#000" stroke-width="2" opacity=".4"/>`,
  unit_thugs: () => `
    <rect x="66" y="14" width="8" height="58" rx="4" fill="#a16207" transform="rotate(25 70 43)" ${O}/>
    <g transform="translate(-14 6) scale(.8)">${shoulders('#57534e')}${face(50, 52, 1, '#d8a982')}<path d="M32 44 Q50 22 68 44 Z" fill="#525252" ${O}/><rect x="30" y="40" width="44" height="7" rx="3" fill="#404040" ${O}/>${eyes(50, 54, 1)}</g>
    <g transform="translate(24 14) scale(.8)">${shoulders('#6b4e2e')}${face(50, 52, 1, '#c99a76')}<path d="M32 44 Q50 22 68 44 Z" fill="#7c2d12" ${O}/><rect x="26" y="40" width="44" height="7" rx="3" fill="#9a3412" ${O}/>${eyes(50, 54, 1)}<path d="M42 64 L58 64" stroke="#111" stroke-width="3"/></g>`,
  unit_hitman: () => `
    ${shoulders('#2d2a26', '<path d="M50 70 L44 100 M50 70 L56 100" stroke="#111" stroke-width="3"/>')}
    ${face(50, 50, 1)}
    <path d="M38 58 Q50 64 62 58" fill="none" stroke="#111" stroke-width="2"/>
    ${fedora(50, 30, 1, '#1c1c1c', '#111')}
    <rect x="32" y="40" width="36" height="5" fill="#111"/>
    <g opacity=".9"><circle cx="76" cy="76" r="16" fill="none" stroke="#ef4444" stroke-width="3"/><path d="M76 56 V96 M56 76 H96" stroke="#ef4444" stroke-width="2.5"/><circle cx="76" cy="76" r="3" fill="#ef4444"/></g>`,
  unit_tommy: () => `
    ${shoulders('#4a3b5c', '<path d="M30 72 V100 M40 71 V100 M60 71 V100 M70 72 V100" stroke="#2e2440" stroke-width="2"/>')}
    ${face(50, 46, 1, '#d9a77f')}${eyes(50, 46, 1)}
    <path d="M42 56 Q50 60 58 56" fill="none" stroke="#111" stroke-width="2.5"/>
    ${fedora(50, 26, 1, '#3a2d1f', '#111')}
    <g transform="rotate(-18 50 82)"><rect x="14" y="76" width="70" height="10" rx="3" fill="#3f3f46" ${O}/><circle cx="40" cy="90" r="10" fill="#27272a" ${O}/><rect x="70" y="72" width="16" height="18" rx="3" fill="#7c2d12" ${O}/><rect x="6" y="78" width="10" height="5" fill="#3f3f46" ${O}/></g>`,
  unit_swat: () => `
    ${shoulders('#1f2a3a')}
    ${face(50, 46, 1, '#c99a76')}
    <path d="M30 44 Q30 20 50 20 Q70 20 70 44 L66 44 Q64 30 50 30 Q36 30 34 44 Z" fill="#111827" ${O}/>
    <rect x="34" y="40" width="32" height="8" rx="3" fill="#0ea5e9" opacity=".8" ${O}/>
    <path d="M18 54 L48 54 L48 96 Q33 92 18 80 Z" fill="#334155" ${O}/>
    <rect x="22" y="62" width="22" height="6" fill="#94a3b8" stroke="#111" stroke-width="1.5"/>
    <text x="33" y="84" font-family="Impact,Arial Black,sans-serif" font-size="11" text-anchor="middle" fill="#e2e8f0">SWAT</text>`,
  unit_medic: () => `
    ${shoulders('#e8e4da', '<path d="M44 70 L50 84 L56 70" fill="#9ca3af" stroke="#111" stroke-width="2"/>')}
    ${face(50, 46, 1)}${eyes(50, 46, 1, false)}
    <path d="M34 36 Q50 22 66 36 L66 30 Q50 16 34 30 Z" fill="#555" ${O}/>
    <circle cx="44" cy="46" r="6" fill="none" stroke="#111" stroke-width="2"/><circle cx="56" cy="46" r="6" fill="none" stroke="#111" stroke-width="2"/>
    <rect x="58" y="70" width="32" height="24" rx="4" fill="#7f1d1d" ${O}/>
    <path d="M74 75 V89 M67 82 H81" stroke="#fff" stroke-width="5"/>`,
  unit_armored_van: () => `
    <rect x="12" y="34" width="76" height="42" rx="8" fill="#4b5d43" ${O}/>
    <rect x="62" y="40" width="22" height="18" rx="3" fill="#7dd3fc" ${O}/>
    <rect x="16" y="56" width="44" height="7" fill="#d4af37" stroke="#111" stroke-width="2"/>
    <text x="38" y="52" font-family="Impact,Arial Black,sans-serif" font-size="12" text-anchor="middle" fill="#e5e7eb">$ CASH</text>
    <circle cx="28" cy="78" r="9" fill="#18181b" ${O}/><circle cx="72" cy="78" r="9" fill="#18181b" ${O}/>
    <circle cx="28" cy="78" r="3" fill="#a1a1aa"/><circle cx="72" cy="78" r="3" fill="#a1a1aa"/>
    <path d="M88 48 L96 44 M88 56 L97 56" stroke="#fde047" stroke-width="3"/>`,
  unit_don: () => `
    ${shoulders('#111', '<path d="M44 70 L50 90 L56 70" fill="#f5f5f4" stroke="#111" stroke-width="2"/><path d="M47 72 L50 76 L53 72 L50 92 Z" fill="#111"/>')}
    ${face(50, 48, 1, '#d2a07a')}
    <path d="M38 44 L46 46 M62 44 L54 46" stroke="#111" stroke-width="3"/>
    <circle cx="43" cy="49" r="2" fill="#111"/><circle cx="57" cy="49" r="2" fill="#111"/>
    <path d="M40 58 Q50 54 60 58 Q50 62 40 58" fill="#3f3f46" stroke="#111" stroke-width="1.5"/>
    <rect x="58" y="58" width="16" height="4" rx="2" fill="#a16207" stroke="#111" stroke-width="1.5"/><circle cx="76" cy="58" r="2.5" fill="#f97316"/>
    ${fedora(50, 28, 1.05, '#f2efe6', '#111')}
    <circle cx="28" cy="82" r="6" fill="#dc2626" ${O}/><path d="M28 88 L30 96" stroke="#166534" stroke-width="3"/>`,
  unit_detective: () => `
    ${shoulders('#8a7350', '<path d="M50 70 L36 100 M50 70 L64 100" stroke="#5b4a33" stroke-width="4"/><path d="M30 74 L40 70 L46 84 Z M70 74 L60 70 L54 84 Z" fill="#a08660" stroke="#111" stroke-width="2"/>')}
    ${face(50, 50, 1)}
    <path d="M36 50 L64 50" stroke="#111" stroke-width="2"/>
    <rect x="34" y="46" width="12" height="7" rx="2" fill="#111"/><rect x="54" y="46" width="12" height="7" rx="2" fill="#111"/>
    ${fedora(50, 30, 1, '#5b4a33', '#2b2117')}
    <circle cx="78" cy="30" r="9" fill="none" stroke="#c4b5fd" stroke-width="3" stroke-dasharray="4 3"/>
    <text x="78" y="35" font-family="Impact,sans-serif" font-size="13" text-anchor="middle" fill="#c4b5fd">?</text>`,
  unit_biker: () => `
    <path d="M18 74 L82 74" stroke="#111" stroke-width="4"/>
    <circle cx="22" cy="76" r="12" fill="#18181b" ${O}/><circle cx="78" cy="76" r="12" fill="#18181b" ${O}/>
    <path d="M28 70 L44 56 L66 56 L76 70 Z" fill="#b91c1c" ${O}/>
    <path d="M66 56 L72 42" stroke="#111" stroke-width="4"/>
    <circle cx="50" cy="34" r="12" fill="#222" ${O}/><rect x="44" y="30" width="16" height="6" rx="2" fill="#f59e0b"/>
    <g transform="rotate(-20 30 46)"><rect x="18" y="40" width="7" height="18" fill="#dc2626" ${O}/><rect x="25" y="40" width="7" height="18" fill="#dc2626" ${O}/><path d="M24 40 Q22 30 30 26" fill="none" stroke="#111" stroke-width="2"/><circle cx="30" cy="25" r="3" fill="#fde047"/></g>`,
  unit_drone: () => `
    <path d="M24 30 L76 70 M76 30 L24 70" stroke="#111" stroke-width="7"/>
    <path d="M24 30 L76 70 M76 30 L24 70" stroke="#334155" stroke-width="3"/>
    <ellipse cx="24" cy="30" rx="16" ry="5" fill="#cbd5e1" opacity=".75" ${O}/><ellipse cx="76" cy="30" rx="16" ry="5" fill="#cbd5e1" opacity=".75" ${O}/>
    <ellipse cx="24" cy="70" rx="16" ry="5" fill="#cbd5e1" opacity=".75" ${O}/><ellipse cx="76" cy="70" rx="16" ry="5" fill="#cbd5e1" opacity=".75" ${O}/>
    <rect x="36" y="40" width="28" height="20" rx="6" fill="#1e293b" ${O}/>
    <circle cx="44" cy="44" r="3" fill="#3b82f6"/><circle cx="56" cy="44" r="3" fill="#ef4444"/>
    <rect x="46" y="58" width="8" height="14" fill="#3f3f46" ${O}/>`,
  unit_lawyer: () => `
    ${shoulders('#3b4a6b', '<path d="M44 70 L50 80 L56 70" fill="#f8fafc" stroke="#111" stroke-width="2"/><path d="M48 76 L52 76 L54 98 L50 100 L46 98 Z" fill="#b91c1c" stroke="#111" stroke-width="1.5"/>')}
    ${face(50, 44, 1, '#e6bf9c')}
    <path d="M34 36 Q38 22 52 24 Q66 24 66 38 Q60 30 50 30 Q40 30 34 36 Z" fill="#2b2b2b" ${O}/>
    <path d="M40 44 L46 44 M54 44 L60 44" stroke="#111" stroke-width="3"/>
    <path d="M42 54 Q52 58 60 52" fill="none" stroke="#111" stroke-width="2.5"/>
    <g transform="translate(64 66)"><path d="M14 0 V22 M2 6 H26" stroke="#d4af37" stroke-width="3"/><path d="M2 6 L-4 16 H8 Z M26 6 L20 16 H32 Z" fill="#fde68a" stroke="#111" stroke-width="2"/></g>`,
  unit_k9: () => `
    <path d="M20 96 Q22 70 50 64 Q78 70 80 96 Z" fill="#7a5230" ${O}/>
    <path d="M30 40 L24 14 L42 30 Z M70 40 L76 14 L58 30 Z" fill="#3b2412" ${O}/>
    <ellipse cx="50" cy="46" rx="22" ry="20" fill="#7a5230" ${O}/>
    <path d="M36 40 Q50 30 64 40 L60 48 Q50 44 40 48 Z" fill="#2a1a0e"/>
    <ellipse cx="50" cy="60" rx="12" ry="9" fill="#c49a6c" ${O}/>
    <ellipse cx="50" cy="55" rx="5" ry="3.5" fill="#111"/>
    <circle cx="41" cy="44" r="3" fill="#fde047" stroke="#111" stroke-width="1.5"/><circle cx="59" cy="44" r="3" fill="#fde047" stroke="#111" stroke-width="1.5"/>
    <path d="M30 72 Q50 80 70 72" fill="none" stroke="#1e3a5f" stroke-width="6"/>
    <circle cx="50" cy="78" r="4" fill="#d4af37" stroke="#111" stroke-width="1.5"/>`,
  spell_molotov: () => `
    <path d="M50 8 Q62 22 56 32 Q66 26 64 14 Q78 30 64 44 L36 44 Q24 30 38 18 Q38 28 46 30 Q40 20 50 8 Z" fill="#f97316" ${O}/>
    <path d="M50 20 Q56 30 52 38 L46 38 Q42 30 50 20 Z" fill="#fde047"/>
    <rect x="43" y="40" width="14" height="14" fill="#e5e7eb" ${O}/>
    <path d="M36 54 L64 54 L70 92 Q50 98 30 92 Z" fill="#15803d" opacity=".9" ${O}/>
    <path d="M38 70 Q50 64 62 70 L66 90 Q50 94 34 90 Z" fill="#f59e0b" opacity=".85"/>
    <path d="M40 58 L42 86" stroke="#bbf7d0" stroke-width="3" opacity=".7"/>`,
  spell_bribe: () => `
    <g transform="rotate(-12 50 60)"><rect x="18" y="52" width="64" height="30" rx="3" fill="#15803d" ${O}/><rect x="24" y="57" width="52" height="20" rx="2" fill="none" stroke="#bbf7d0" stroke-width="1.5"/><circle cx="50" cy="67" r="8" fill="#bbf7d0" stroke="#111" stroke-width="1.5"/><text x="50" y="72" font-family="Impact,sans-serif" font-size="12" text-anchor="middle" fill="#14532d">$</text></g>
    <g transform="rotate(8 50 40)"><rect x="20" y="28" width="64" height="30" rx="3" fill="#16a34a" ${O}/><rect x="26" y="33" width="52" height="20" rx="2" fill="none" stroke="#bbf7d0" stroke-width="1.5"/><circle cx="52" cy="43" r="8" fill="#bbf7d0" stroke="#111" stroke-width="1.5"/><text x="52" y="48" font-family="Impact,sans-serif" font-size="12" text-anchor="middle" fill="#14532d">$</text></g>
    <rect x="44" y="20" width="12" height="70" fill="#d4af37" opacity=".95" ${O}/>
    <path d="M70 12 L74 20 L82 22 L74 24 L70 32 L66 24 L58 22 L66 20 Z" fill="#a5f3fc"/>`,
  spell_sniper_shot: () => `
    <path d="M0 100 L0 66 L30 66 L30 56 L58 56 L58 70 L100 70 L100 100 Z" fill="#1f2937" ${O}/>
    <rect x="8" y="74" width="8" height="8" fill="#fde047"/><rect x="40" y="64" width="8" height="8" fill="#fde047"/><rect x="72" y="80" width="8" height="8" fill="#334155"/>
    <circle cx="52" cy="34" r="24" fill="rgba(255,255,255,.1)" stroke="#ef4444" stroke-width="3.5"/>
    <path d="M52 6 V62 M24 34 H80" stroke="#ef4444" stroke-width="2.5"/>
    <circle cx="52" cy="34" r="4" fill="#ef4444"/>
    <path d="M52 34 L90 6" stroke="#fde047" stroke-width="2" stroke-dasharray="4 3"/>`,
  bldg_barricade: () => `
    <ellipse cx="26" cy="74" rx="18" ry="10" fill="#a8a29e" ${O}/><ellipse cx="62" cy="74" rx="18" ry="10" fill="#a8a29e" ${O}/>
    <ellipse cx="44" cy="60" rx="18" ry="10" fill="#d6d3d1" ${O}/><ellipse cx="80" cy="62" rx="16" ry="9" fill="#d6d3d1" ${O}/>
    <ellipse cx="20" cy="58" rx="14" ry="8" fill="#c8c2bc" ${O}/>
    <rect x="40" y="36" width="44" height="9" rx="3" fill="#27272a" ${O} transform="rotate(-15 44 40)"/>
    <rect x="34" y="38" width="16" height="16" rx="3" fill="#3f3f46" ${O}/>
    <path d="M42 54 L36 66 M42 54 L50 66" stroke="#111" stroke-width="3"/>
    <path d="M88 22 L94 18 M88 28 L96 28" stroke="#fde047" stroke-width="3"/>`,
  bldg_casino_spawner: () => `
    <rect x="14" y="30" width="72" height="58" fill="#3f0d12" ${O}/>
    <rect x="20" y="14" width="60" height="18" rx="3" fill="#111" ${O}/>
    <text x="50" y="28" font-family="Impact,Arial Black,sans-serif" font-size="13" text-anchor="middle" fill="#f43f5e">CLUB</text>
    <rect x="40" y="58" width="20" height="30" fill="#111" ${O}/>
    <rect x="22" y="40" width="14" height="12" fill="#fde047" opacity=".85" ${O}/><rect x="64" y="40" width="14" height="12" fill="#fde047" opacity=".85" ${O}/>
    <g transform="rotate(15 76 74)"><rect x="66" y="64" width="20" height="20" rx="4" fill="#f8fafc" ${O}/><circle cx="71" cy="69" r="2" fill="#111"/><circle cx="81" cy="79" r="2" fill="#111"/><circle cx="76" cy="74" r="2" fill="#111"/></g>`,

  // ---- 8 Нових карт ----
  unit_arsonist: () => `
    <rect x="14" y="46" width="16" height="36" rx="6" fill="#ea580c" ${O}/>
    ${shoulders('#7c2d12')}
    <ellipse cx="50" cy="46" rx="17" ry="19" fill="#292524" ${O}/>
    <circle cx="43" cy="43" r="5" fill="#fde047" ${O}/><circle cx="57" cy="43" r="5" fill="#fde047" ${O}/>
    <circle cx="50" cy="56" r="7" fill="#52525b" ${O}/>
    <rect x="52" y="70" width="32" height="8" rx="2" fill="#27272a" ${O}/>
    <path d="M84 74 Q94 60 96 72 Q98 84 84 76 Z" fill="#f97316" ${O}/>
    <circle cx="90" cy="73" r="4" fill="#fde047"/>`,
  unit_heli: () => `
    <rect x="10" y="20" width="80" height="5" rx="2" fill="#cbd5e1" ${O}/>
    <rect x="47" y="24" width="6" height="12" fill="#334155" ${O}/>
    <path d="M22 52 Q26 34 56 34 Q82 34 84 54 Q84 68 58 68 L26 68 Z" fill="#1e3a8a" ${O}/>
    <path d="M56 38 Q76 38 78 52 L56 52 Z" fill="#7dd3fc" ${O}/>
    <rect x="10" y="50" width="20" height="7" fill="#1e3a8a" ${O}/>
    <circle cx="10" cy="53" r="7" fill="#94a3b8" opacity=".8" ${O}/>
    <path d="M32 76 H76 M42 68 V76 M66 68 V76" stroke="#111" stroke-width="4"/>
    <circle cx="44" cy="44" r="4" fill="#ef4444"/><circle cx="36" cy="44" r="4" fill="#3b82f6"/>`,
  spell_teargas: () => `
    <circle cx="32" cy="40" r="18" fill="#84cc16" opacity=".65"/>
    <circle cx="66" cy="38" r="20" fill="#a3e635" opacity=".6"/>
    <circle cx="50" cy="28" r="18" fill="#bef264" opacity=".65"/>
    <rect x="38" y="42" width="24" height="44" rx="5" fill="#3f6212" ${O}/>
    <rect x="42" y="34" width="16" height="9" rx="2" fill="#71717a" ${O}/>
    <rect x="38" y="58" width="24" height="10" fill="#fde047" stroke="#111" stroke-width="2"/>
    <text x="50" y="66" font-family="Impact,sans-serif" font-size="9" text-anchor="middle" fill="#111">GAS</text>`,
  unit_bulldozer: () => `
    <rect x="14" y="66" width="54" height="18" rx="8" fill="#27272a" ${O}/>
    <circle cx="24" cy="75" r="5" fill="#71717a"/><circle cx="41" cy="75" r="5" fill="#71717a"/><circle cx="58" cy="75" r="5" fill="#71717a"/>
    <rect x="18" y="38" width="46" height="30" rx="4" fill="#eab308" ${O}/>
    <rect x="24" y="24" width="26" height="18" rx="3" fill="#ca8a04" ${O}/>
    <rect x="34" y="28" width="13" height="10" fill="#7dd3fc" stroke="#111" stroke-width="2"/>
    <path d="M68 42 L86 38 L88 84 L68 82 Z" fill="#94a3b8" ${O}/>
    <path d="M62 60 L72 60" stroke="#111" stroke-width="5"/>`,
  unit_croupier: () => `
    ${shoulders('#18181b', '<path d="M44 70 L50 84 L56 70" fill="#f8fafc" stroke="#111" stroke-width="2"/><path d="M48 74 L52 74 L53 90 L47 90 Z" fill="#dc2626"/>')}
    ${face(50, 48, 1, '#e6bf9c')}${eyes(50, 48, 1)}
    <path d="M30 38 Q50 28 70 38 L74 44 Q50 38 26 44 Z" fill="#16a34a" ${O}/>
    <g transform="rotate(-18 78 68)"><rect x="66" y="54" width="22" height="30" rx="3" fill="#f8fafc" ${O}/><text x="77" y="74" font-family="Georgia,serif" font-size="16" text-anchor="middle" fill="#111">♠</text></g>`,
  unit_shotgun: () => `
    ${shoulders('#374151')}
    ${face(50, 46, 1, '#d2a07a')}
    <path d="M32 38 Q50 20 68 38 Z" fill="#111827" ${O}/><rect x="28" y="35" width="44" height="6" rx="2" fill="#1f2937" ${O}/>
    <rect x="36" y="42" width="28" height="7" rx="2" fill="#09090b"/>
    <g transform="rotate(-12 52 78)"><rect x="14" y="72" width="58" height="9" rx="2" fill="#27272a" ${O}/><rect x="64" y="70" width="24" height="15" rx="3" fill="#7c2d12" ${O}/><rect x="34" y="79" width="16" height="5" rx="2" fill="#7c2d12" ${O}/></g>`,
  unit_limo: () => `
    <rect x="8" y="42" width="84" height="30" rx="7" fill="#111827" ${O}/>
    <path d="M20 42 L30 28 H72 L82 42 Z" fill="#1f2937" ${O}/>
    <rect x="30" y="32" width="14" height="9" fill="#38bdf8" opacity=".6"/><rect x="47" y="32" width="12" height="9" fill="#38bdf8" opacity=".6"/><rect x="62" y="32" width="12" height="9" fill="#38bdf8" opacity=".6"/>
    <rect x="10" y="56" width="80" height="4" fill="#f59e0b"/>
    <circle cx="24" cy="74" r="8" fill="#18181b" ${O}/><circle cx="76" cy="74" r="8" fill="#18181b" ${O}/>
    <circle cx="24" cy="74" r="3" fill="#f59e0b"/><circle cx="76" cy="74" r="3" fill="#f59e0b"/>`,
  spell_vendetta: () => `
    <circle cx="50" cy="50" r="36" fill="#7f1d1d" opacity=".7" ${O}/>
    <path d="M24 76 L76 24 M76 76 L24 24" stroke="#e5e7eb" stroke-width="6" stroke-linecap="round"/>
    <path d="M24 76 L76 24 M76 76 L24 24" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <circle cx="50" cy="48" r="18" fill="#dc2626" ${O}/>
    <text x="50" y="55" font-family="Impact,Arial Black,sans-serif" font-size="16" text-anchor="middle" fill="#fde047">+40%</text>`,

  // ---- 10 нових карт (v0.5.0) ----
  spell_ricochet: () => `
    <path d="M15 75 L38 35 L62 60 L85 22" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="85" cy="22" r="6" fill="#fde047" ${O}/>
    <circle cx="38" cy="35" r="4" fill="#f59e0b"/>
    <circle cx="62" cy="60" r="4" fill="#f59e0b"/>
    <path d="M85 10 L85 34 M73 22 L97 22" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  bldg_police_spikes: () => `
    <rect x="8" y="52" width="84" height="28" rx="3" fill="#1f2937" ${O}/>
    <path d="M14 52 L20 32 L26 52 M30 52 L36 32 L42 52 M46 52 L52 32 L58 52 M62 52 L68 32 L74 52 M78 52 L82 34 L86 52" fill="#9ca3af" stroke="#111" stroke-width="2"/>
    <rect x="18" y="20" width="10" height="14" rx="2" fill="#ef4444" ${O}/>
    <rect x="28" y="20" width="10" height="14" rx="2" fill="#3b82f6" ${O}/>`,
  spell_manhole_ambush: () => `
    <ellipse cx="50" cy="68" rx="36" ry="16" fill="#09090b" ${O}/>
    <ellipse cx="50" cy="40" rx="32" ry="13" fill="#3f3f46" stroke="#18181b" stroke-width="3" transform="rotate(-15 50 40)"/>
    <path d="M30 68 Q50 55 70 68" stroke="#a1a1aa" stroke-width="2" fill="none"/>
    <rect x="36" y="56" width="28" height="6" fill="#71717a" rx="1"/>
    <circle cx="44" cy="62" r="3.5" fill="#ef4444"/><circle cx="56" cy="62" r="3.5" fill="#ef4444"/>
    <text x="50" y="30" font-family="Impact,Arial Black,sans-serif" font-size="14" text-anchor="middle" fill="#facc15">BANG!</text>`,
  bldg_counterfeit_press: () => `
    <rect x="16" y="38" width="68" height="48" rx="4" fill="#1e293b" ${O}/>
    <circle cx="34" cy="54" r="13" fill="#475569" stroke="#111" stroke-width="2"/>
    <circle cx="66" cy="54" r="13" fill="#475569" stroke="#111" stroke-width="2"/>
    <rect x="24" y="50" width="52" height="8" fill="#10b981" ${O}/>
    <g transform="rotate(-12 60 28)"><rect x="44" y="16" width="30" height="18" rx="2" fill="#22c55e" stroke="#14532d" stroke-width="1.5"/><text x="59" y="29" font-family="Georgia,serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#052e16">$</text></g>
    <rect x="20" y="70" width="60" height="12" fill="#ef4444" rx="2"/><text x="50" y="79" font-family="Impact,sans-serif" font-size="10" text-anchor="middle" fill="#fff">FAKE</text>`,
  unit_contraband_blimp: () => `
    <ellipse cx="50" cy="46" rx="42" ry="24" fill="#292524" ${O}/>
    <path d="M12 46 Q50 30 88 46 Q50 62 12 46 Z" fill="#44403c"/>
    <path d="M8 38 L2 30 L6 46 L2 62 L8 54 Z" fill="#1c1917" ${O}/>
    <rect x="36" y="70" width="28" height="12" rx="3" fill="#f59e0b" ${O}/>
    <circle cx="50" cy="46" r="10" fill="#dc2626" ${O}/>
    <text x="50" y="50" font-family="Impact,sans-serif" font-size="11" text-anchor="middle" fill="#fff">M</text>`,
  unit_aa_truck: () => `
    <rect x="12" y="52" width="76" height="26" rx="4" fill="#334155" ${O}/>
    <rect x="14" y="40" width="28" height="16" rx="3" fill="#1e293b" ${O}/>
    <circle cx="28" cy="78" r="9" fill="#111" ${O}/><circle cx="72" cy="78" r="9" fill="#111" ${O}/>
    <path d="M54 52 L78 22 M58 52 L82 22" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="56" cy="52" r="7" fill="#64748b" ${O}/>
    <circle cx="83" cy="20" r="4" fill="#f59e0b"/>`,
  unit_toxin_chemist: () => `
    ${shoulders('#1e3a5f', '<rect x="38" y="70" width="24" height="22" fill="#3f6212" stroke="#111" stroke-width="2"/>')}
    <circle cx="50" cy="45" r="18" fill="#14532d" ${O}/>
    <circle cx="42" cy="43" r="6" fill="#84cc16" stroke="#111" stroke-width="1.5"/><circle cx="58" cy="43" r="6" fill="#84cc16" stroke="#111" stroke-width="1.5"/>
    <path d="M46 54 L54 54 L50 62 Z" fill="#365314" ${O}/>
    <path d="M72 65 L84 82 L70 82 Z" fill="#84cc16" stroke="#111" stroke-width="2"/>
    <circle cx="77" cy="72" r="2" fill="#fff"/>`,
  unit_police_patrol: () => `
    ${shoulders('#1e3a8a', '<path d="M44 70 L50 82 L56 70" fill="#f8fafc" stroke="#111" stroke-width="1.5"/><rect x="48" y="74" width="4" height="16" fill="#172554"/>')}
    ${face(50, 48, 1, '#d2a07a')}${eyes(50, 48, 1)}
    <path d="M26 36 Q50 26 74 36 L70 42 Q50 36 30 42 Z" fill="#172554" ${O}/>
    <path d="M30 36 Q50 18 70 36 Z" fill="#1e3a8a" ${O}/>
    <path d="M50 28 L53 33 L50 36 L47 33 Z" fill="#facc15" stroke="#111" stroke-width="1"/>
    <line x1="78" y1="55" x2="88" y2="80" stroke="#111" stroke-width="5" stroke-linecap="round"/>`,
  unit_police_chief: () => `
    ${shoulders('#0f172a', '<path d="M42 68 L50 84 L58 68" fill="#f8fafc" stroke="#111" stroke-width="2"/><path d="M48 72 L52 72 L53 90 L47 90 Z" fill="#b91c1c"/>')}
    ${face(50, 46, 1.15, '#d2a07a')}${eyes(50, 46, 1.15)}
    <path d="M22 36 Q50 24 78 36 L74 42 Q50 36 26 42 Z" fill="#0f172a" ${O}/>
    <path d="M26 36 Q50 14 74 36 Z" fill="#1e293b" ${O}/>
    <circle cx="50" cy="27" r="5" fill="#facc15" stroke="#111" stroke-width="1.5"/>
    <path d="M30 72 L36 78 L30 84 L24 78 Z" fill="#facc15" stroke="#111" stroke-width="1.5"/>
    <path d="M72 74 L86 70 L86 78 L78 80 Z" fill="#475569" stroke="#111" stroke-width="1.5"/>`,
  spell_car_crash: () => `
    <rect x="18" y="44" width="64" height="28" rx="4" fill="#b91c1c" ${O}/>
    <path d="M26 44 L38 28 L62 28 L72 44 Z" fill="#7f1d1d" ${O}/>
    <path d="M44 26 L56 60 M52 30 L40 56" stroke="#facc15" stroke-width="3"/>
    <circle cx="50" cy="46" r="16" fill="none" stroke="#ef4444" stroke-width="4" stroke-dasharray="6 4"/>
    <text x="50" y="86" font-family="Impact,Arial Black,sans-serif" font-size="14" text-anchor="middle" fill="#facc15">CRASH!</text>`,

  // ---- 5 нових карт (v0.6.0) ----
  unit_swat_wall: () => `
    ${shoulders('#1e293b', '')}
    ${face(50, 42, 0.95, '#d2a07a')}
    <path d="M28 38 Q50 18 72 38 Z" fill="#0f172a" ${O}/>
    <rect x="20" y="46" width="60" height="44" rx="5" fill="#1e293b" stroke="#000" stroke-width="3"/>
    <rect x="28" y="52" width="44" height="12" rx="2" fill="#38bdf8" opacity="0.7" stroke="#000" stroke-width="1.5"/>
    <text x="50" y="80" font-family="Impact,sans-serif" font-size="13" text-anchor="middle" fill="#fff">SWAT</text>`,
  spell_metro_heist: () => `
    <ellipse cx="50" cy="65" rx="34" ry="16" fill="#09090b" ${O}/>
    <ellipse cx="50" cy="65" rx="26" ry="11" fill="#18181b" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 3"/>
    <path d="M35 55 L42 32 L58 32 L65 55 Z" fill="#27272a" ${O}/>
    <circle cx="44" cy="42" r="3" fill="#fde047"/><circle cx="56" cy="42" r="3" fill="#fde047"/>
    <text x="50" y="25" font-family="Impact,sans-serif" font-size="13" text-anchor="middle" fill="#f59e0b">METRO</text>`,
  spell_toxic_barrel: () => `
    <rect x="24" y="24" width="52" height="58" rx="8" fill="#365314" ${O}/>
    <rect x="24" y="34" width="52" height="8" fill="#1a2e05"/><rect x="24" y="62" width="52" height="8" fill="#1a2e05"/>
    <circle cx="50" cy="52" r="11" fill="#a3e635" ${O}/>
    <text x="50" y="57" font-family="Arial,sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#1a2e05">☢</text>`,
  unit_protected_witness: () => `
    ${shoulders('#0f172a', '<rect x="22" y="68" width="16" height="22" fill="#fef3c7" stroke="#111" stroke-width="2"/>')}
    ${face(38, 48, 0.9, '#e6bf9c')}${eyes(38, 48, 0.9)}
    ${face(65, 44, 0.95, '#d2a07a')}<rect x="53" y="37" width="24" height="6" rx="2" fill="#111"/>
    <text x="50" y="24" font-family="Impact,sans-serif" font-size="12" text-anchor="middle" fill="#38bdf8">FBI ESCORT</text>`,
  unit_safecracker: () => `
    ${shoulders('#18181b', '<rect x="44" y="72" width="12" height="18" fill="#3f3f46" stroke="#111" stroke-width="1.5"/>')}
    ${face(50, 44, 1.05, '#d2a07a')}${eyes(50, 44, 1.05)}
    <path d="M28 34 Q50 22 72 34 Z" fill="#09090b" ${O}/>
    <path d="M72 56 L92 50 L92 62 Z" fill="#f59e0b" ${O}/>
    <circle cx="88" cy="56" r="4" fill="#ef4444"/>`,

  // ---- Вежі ----
  tower_mafia_mansion: () => `
    <path d="M10 46 L50 18 L90 46 Z" fill="#5b3a29" ${O}/>
    <rect x="16" y="46" width="68" height="44" fill="#e7dcc8" ${O}/>
    <rect x="24" y="50" width="6" height="36" fill="#d6c7ab" stroke="#111" stroke-width="2"/><rect x="70" y="50" width="6" height="36" fill="#d6c7ab" stroke="#111" stroke-width="2"/>
    <rect x="42" y="62" width="16" height="28" fill="#5b3a29" ${O}/>
    <rect x="34" y="52" width="8" height="8" fill="#fde047"/><rect x="58" y="52" width="8" height="8" fill="#fde047"/>
    <circle cx="50" cy="36" r="6" fill="#d4af37" stroke="#111" stroke-width="2"/>`,
  tower_police_precinct: () => `
    <rect x="12" y="34" width="76" height="56" fill="#2b3f5c" ${O}/>
    <rect x="12" y="34" width="76" height="12" fill="#e5e7eb" ${O}/>
    <text x="50" y="44" font-family="Impact,Arial Black,sans-serif" font-size="10" text-anchor="middle" fill="#1e3a8a">POLICE</text>
    <rect x="40" y="16" width="10" height="16" fill="#ef4444" ${O}/><rect x="50" y="16" width="10" height="16" fill="#3b82f6" ${O}/>
    <rect x="20" y="54" width="14" height="12" fill="#bfdbfe" ${O}/><rect x="66" y="54" width="14" height="12" fill="#bfdbfe" ${O}/>
    <rect x="42" y="64" width="16" height="26" fill="#111827" ${O}/>
    <path d="M50 52 L54 58 L50 62 L46 58 Z" fill="#facc15" stroke="#111" stroke-width="1.5"/>`,
  tower_underground_casino: () => `
    <rect x="12" y="30" width="76" height="60" fill="#3d0a12" ${O}/>
    <rect x="18" y="14" width="64" height="20" rx="4" fill="#111" ${O}/>
    <text x="50" y="29" font-family="Impact,Arial Black,sans-serif" font-size="12" text-anchor="middle" fill="#f43f5e">ROYAL</text>
    <path d="M50 44 L58 56 L50 68 L42 56 Z" fill="#f43f5e" ${O}/>
    <circle cx="26" cy="76" r="9" fill="#16a34a" ${O}/><circle cx="26" cy="76" r="4" fill="#fde047"/>
    <circle cx="74" cy="76" r="9" fill="#111" ${O}/><circle cx="74" cy="76" r="4" fill="#f43f5e"/>`,
  tower_armored_bank: () => `
    <path d="M8 40 L50 14 L92 40 Z" fill="#9ca3af" ${O}/>
    <rect x="12" y="40" width="76" height="8" fill="#6b7280" ${O}/>
    <rect x="18" y="48" width="8" height="34" fill="#d1d5db" stroke="#111" stroke-width="2"/><rect x="38" y="48" width="8" height="34" fill="#d1d5db" stroke="#111" stroke-width="2"/>
    <rect x="54" y="48" width="8" height="34" fill="#d1d5db" stroke="#111" stroke-width="2"/><rect x="74" y="48" width="8" height="34" fill="#d1d5db" stroke="#111" stroke-width="2"/>
    <rect x="8" y="82" width="84" height="10" fill="#6b7280" ${O}/>
    <circle cx="50" cy="30" r="7" fill="#facc15" stroke="#111" stroke-width="2"/><text x="50" y="34" font-family="Impact,sans-serif" font-size="10" text-anchor="middle" fill="#713f12">$</text>`,
};

let UID = 0;
export function portraitSVG(id) {
  const def = CARD_MAP[id] || TOWER_MAP[id];
  const rarity = def && def.rarity ? def.rarity : (TOWER_MAP[id] ? 'legendary_tower' : 'common');
  const uid = ++UID;
  let back;
  if (rarity === 'legendary_tower') {
    back = `<defs><radialGradient id="g${uid}" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#475569"/><stop offset="1" stop-color="#0f172a"/></radialGradient></defs><rect width="100" height="100" fill="url(#g${uid})"/>`;
  } else back = bg(rarity, uid);
  const art = ART[id] ? ART[id]() : `<text x="50" y="60" font-size="30" text-anchor="middle">?</text>`;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="portrait">${back}
    <g>${art}</g>
    <rect x="1.5" y="1.5" width="97" height="97" rx="8" fill="none" stroke="#111" stroke-width="3"/>
  </svg>`;
}
