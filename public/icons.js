// === ФІРМОВА НУАРНО-ДЕТЕКТИВНА SVG-СИСТЕМА ІКОНОК MAFIA ONLINE ===
(function () {
  const S = (inner, color = 'currentColor') =>
    `<svg class="mafia-svg-icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

  const ICONS = {
    // === РОЛІ ===
    mafia: S('<path d="M3 10h14l4 2-1 3h-5l-1 5h-4l1-5H7l-1 2H3z" fill="rgba(230,57,70,0.18)"/><circle cx="15" cy="12" r="1"/>', '#e63946'),
    godfather: S('<path d="M3 18h18l-2-10-4.5 4L12 5l-2.5 7L5 8z" fill="rgba(244,162,97,0.22)"/><path d="M4 20h16"/>', '#f4a261'),
    sheriff: S('<polygon points="12 2 14.9 8.2 21.6 9 16.6 13.7 18 20.4 12 17 6 20.4 7.4 13.7 2.4 9 9.1 8.2" fill="rgba(255,209,102,0.2)"/>', '#ffd166'),
    doctor: S('<rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(42,157,143,0.2)"/><path d="M12 7v10M7 12h10" stroke-width="2.4"/>', '#2a9d8f'),
    citizen: S('<path d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" fill="rgba(128,255,219,0.12)"/><circle cx="12" cy="11" r="2.2"/>', '#80ffdb'),
    escort: S('<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" fill="rgba(255,107,107,0.22)"/>', '#ff6b6b'),
    journalist: S('<rect x="3" y="6" width="18" height="13" rx="2" fill="rgba(148,163,184,0.15)"/><circle cx="12" cy="12.5" r="3.2"/><path d="M8 6l1.5-2h5L16 6"/>', '#93c5fd'),
    bodyguard: S('<path d="M12 2l8 3.5v6.5c0 5.2-3.4 8.8-8 10-4.6-1.2-8-4.8-8-10V5.5z" fill="rgba(56,189,248,0.18)"/><path d="M9 12l2 2 4-4"/>', '#38bdf8'),
    vigilante: S('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>', '#f87171'),
    blackmailer: S('<rect x="3" y="5" width="18" height="14" rx="2" fill="rgba(155,93,229,0.16)"/><path d="M3 7l9 6 9-6"/><path d="M9 15h6"/>', '#c084fc'),
    framer: S('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(244,162,97,0.14)"/><path d="M14 2v6h6M9 13l6 6M15 13l-6 6"/>', '#fb923c'),
    consigliere: S('<circle cx="8" cy="14" r="3.5"/><circle cx="16" cy="14" r="3.5"/><path d="M11.5 14h1M4.5 14L6 8h2M19.5 14L18 8h-2"/>', '#e2e8f0'),
    mayor: S('<path d="M14 4l6 6-4 4-6-6z" fill="rgba(255,209,102,0.22)"/><path d="M12 12l-7 7M3 21h9"/>', '#ffd166'),
    jester: S('<path d="M4 15c0-5 3.5-9 8-9s8 4 8 9H4z" fill="rgba(192,132,252,0.2)"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M9 18c1.5 1 4.5 1 6 0"/>', '#c084fc'),
    amnesiac: S('<path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4"/>', '#94a3b8'),
    medium: S('<path d="M12 3c2 2.5 2 4.5 0 6-2-1.5-2-3.5 0-6z" fill="rgba(255,209,102,0.35)"/><rect x="9" y="10" width="6" height="11" rx="1"/>', '#fde68a'),
    cult: S('<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" fill="rgba(192,132,252,0.18)"/><circle cx="12" cy="12" r="2.8"/>', '#a855f7'),
    angel: S('<path d="M12 19c-4-2-8-6-9-11 3.5 1 6.5 2.5 9 6 2.5-3.5 5.5-5 9-6-1 5-5 9-9 11z" fill="rgba(186,230,253,0.2)"/>', '#bae6fd'),
    jailor: S('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16M15 4v16M4 12h16"/>', '#94a3b8'),

    // === ФАЗИ ТА ПОДІЇ ===
    moon: S('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="rgba(147,197,253,0.2)"/>', '#93c5fd'),
    sun: S('<circle cx="12" cy="12" r="4" fill="rgba(255,209,102,0.28)"/><path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>', '#ffd166'),
    vote: S('<rect x="4" y="11" width="16" height="10" rx="2" fill="rgba(244,162,97,0.16)"/><path d="M8 11V5l4-2 4 2v6M9 16l2 2 4-4"/>', '#f4a261'),
    scales: S('<path d="M12 3v18M5 7h14M7 7l-3 7h6zM17 7l-3 7h6zM8 21h8"/>', '#ffd166'),
    skull: S('<circle cx="12" cy="10" r="7" fill="rgba(230,57,70,0.16)"/><circle cx="9.5" cy="9.5" r="1.2"/><circle cx="14.5" cy="9.5" r="1.2"/><path d="M9 17v3h6v-3M11 20v-2M13 20v-2"/>', '#e63946'),
    ghost: S('<path d="M5 20V10a7 7 0 0 1 14 0v10l-2.5-2-2.2 2-2.3-2-2.3 2-2.2-2z" fill="rgba(148,163,184,0.18)"/><circle cx="9.5" cy="10" r="1"/><circle cx="14.5" cy="10" r="1"/>', '#cbd5e1'),
    timer: S('<path d="M6 2h12M6 22h12M7 2v5l5 5-5 5v5M17 2v5l-5 5 5 5v5"/>', '#f4a261'),
    scroll: S('<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="rgba(212,163,115,0.16)"/><path d="M8 9h7M8 13h7M8 17h4"/>', '#d4a373'),
    mask: S('<path d="M3 8c3-2 15-2 18 0v4c0 4-4 7-9 7s-9-3-9-7V8z" fill="rgba(244,162,97,0.18)"/><circle cx="8.5" cy="11.5" r="1.4"/><circle cx="15.5" cy="11.5" r="1.4"/>', '#f4a261'),
    fire: S('<path d="M12 2c3 4 6 6.5 6 11a6 6 0 1 1-12 0c0-2.5 1.3-4.7 3-6.5 0 2 1 3 2 3 .5-2.5 1-5 1-7.5z" fill="rgba(231,111,81,0.28)"/>', '#f97316'),

    // === МЕНЮ ТА ДІЇ ===
    play: S('<polygon points="6 4 20 12 6 20" fill="rgba(255,255,255,0.22)"/>', '#ffffff'),
    admin: S('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5.8 5.8a2 2 0 1 0 2.8 2.8l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.8-2.8z" fill="rgba(244,162,97,0.2)"/>', '#f4a261'),
    friends: S('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14c2.4 0 4.3 1.8 4.5 4.2"/>', '#80ffdb'),
    quests: S('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="#f4a261"/>', '#f4a261'),
    shop: S('<path d="M6 7h12l-1 13H7L6 7z" fill="rgba(255,209,102,0.18)"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>', '#ffd166'),
    rules: S('<path d="M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 1-2-2zM20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 0 2-2z"/>', '#cbd5e1'),
    globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/>', '#38bdf8'),
    trophy: S('<path d="M6 4h12v4a6 6 0 0 1-12 0V4z" fill="rgba(255,215,0,0.25)"/><path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M12 14v5M8 21h8"/>', '#ffd700'),
    settings: S('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>', '#94a3b8'),
    news: S('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6M7 16h10"/>', '#f4a261'),
    dev: S('<polyline points="8 9 4 12 8 15"/><polyline points="16 9 20 12 16 15"/><line x1="13.5" y1="6" x2="10.5" y2="18"/>', '#80ffdb'),
    chat: S('<path d="M4 5h16v11H8l-4 4V5z" fill="rgba(128,255,219,0.14)"/>', '#80ffdb'),
    coin: S('<circle cx="12" cy="12" r="9" fill="rgba(255,215,0,0.22)"/><path d="M12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.5-1 1.5-2.5 2-2.5 1-2.5 2 1 1.5 2.5 1.5 2.5-.5 2.5-1.5"/>', '#ffd700'),
    star: S('<polygon points="12 2 15 9 22 9.5 16.5 14 18 21 12 17.5 6 21 7.5 14 2 9.5 9 9" fill="rgba(244,162,97,0.25)"/>', '#f4a261'),
    bolt: S('<polygon points="13 2 4 14 11 14 10 22 20 10 13 10" fill="rgba(128,255,219,0.22)"/>', '#80ffdb'),
    lock: S('<rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(244,162,97,0.15)"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', '#f4a261'),
    unlock: S('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>', '#80ffdb'),
    bot: S('<rect x="4" y="7" width="16" height="12" rx="3" fill="rgba(148,163,184,0.16)"/><path d="M12 3v4M9 12h.01M15 12h.01M9 16h6"/>', '#93c5fd'),
    flag: S('<path d="M5 3v18M5 4h12l-2 4 2 4H5" fill="rgba(230,57,70,0.22)"/>', '#e63946'),
    gift: S('<rect x="3" y="8" width="18" height="13" rx="2" fill="rgba(255,209,102,0.16)"/><path d="M12 8v13M3 12h18M12 8c-2-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3-2-5 1z"/>', '#ffd166'),
    mute: S('<path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 9V5a3 3 0 0 0-5.6-1.5M5 11a7 7 0 0 0 11.4 5.4M12 19v3M3 3l18 18"/>', '#f4a261'),
    unmute: S('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>', '#80ffdb'),
    ban: S('<circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/>', '#e63946'),
    hammer: S('<path d="M14 4l6 6-3 3-6-6z" fill="rgba(230,57,70,0.2)"/><path d="M11 10l-7 7 3 3 7-7"/>', '#f4a261'),
    link: S('<path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 0 1 5.6 5.6l-1.5 1.5M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 0 1-5.6-5.6l1.5-1.5"/>', '#cbd5e1'),
    door: S('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', '#cbd5e1'),
    refresh: S('<polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.6-9.5L23 10"/>', '#cbd5e1'),
    search: S('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/>', 'currentColor'),
    trash: S('<polyline points="3 6 5 6 21 6"/><path d="M8 6V4h8v2M6 6l1 14h10l1-14"/>', '#ff6b6b'),
    warn: S('<path d="M12 3L2 20h20z" fill="rgba(244,162,97,0.2)"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17.5" r="0.8" fill="#f4a261"/>', '#f4a261'),
    check: S('<circle cx="12" cy="12" r="9" fill="rgba(42,157,143,0.2)"/><path d="M8 12l3 3 5-6"/>', '#2a9d8f'),
    dotGreen: S('<circle cx="12" cy="12" r="5" fill="#2a9d8f"/>', '#2a9d8f'),
    dotRed: S('<circle cx="12" cy="12" r="5" fill="#e63946"/>', '#e63946'),
    plus: S('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', '#ffffff'),
    chart: S('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>', '#80ffdb'),
    skip: S('<polygon points="5 4 14 12 5 20" fill="rgba(192,132,252,0.25)"/><polygon points="13 4 22 12 13 20" fill="rgba(192,132,252,0.25)"/>', '#c084fc'),
    mail: S('<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>', '#ffd166'),
    pin: S('<path d="M12 21s-6-5.7-6-11a6 6 0 1 1 12 0c0 5.3-6 11-6 11z" fill="rgba(244,162,97,0.2)"/><circle cx="12" cy="10" r="2"/>', '#f4a261'),
    megaphone: S('<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" fill="rgba(42,157,143,0.2)"/><path d="M17 9a4 4 0 0 1 0 6"/>', '#80ffdb'),
    shush: S('<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M12 13v5M9.5 15h5"/>', '#e63946'),
    question: S('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4"/><circle cx="12" cy="17" r="0.8" fill="currentColor"/>', '#cbd5e1'),
    thumbUp: S('<path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H7"/>', '#2a9d8f'),
    thumbDown: S('<path d="M7 13V4H4v9zM7 13l4 7a2 2 0 0 0 3-2l-1-5h6a2 2 0 0 0 2-2l-1-6a2 2 0 0 0-2-2H7"/>', '#e63946'),

    // === ПОДАРУНКИ ТА ЕФЕКТИ ===
    coffee: S('<path d="M4 9h11v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" fill="rgba(212,163,115,0.22)"/><path d="M15 10h2a2.5 2.5 0 0 1 0 5h-2M7 5c0-1 1-1.5 1-2.5M11 5c0-1 1-1.5 1-2.5"/>', '#d4a373'),
    rose: S('<path d="M12 11a4 4 0 1 0-4-4c0 2.5 4 4 4 4zM12 11a4 4 0 1 1 4-4c0 2.5-4 4-4 4z" fill="rgba(230,57,70,0.32)"/><path d="M12 11v10M12 16c-2.5 0-4-1.5-4-3M12 18c2.5 0 4-1.5 4-3" stroke="#2a9d8f"/>', '#e63946'),
    dice: S('<rect x="4" y="4" width="16" height="16" rx="3" fill="rgba(255,255,255,0.12)"/><circle cx="8.5" cy="8.5" r="1.2" fill="#ffd166"/><circle cx="15.5" cy="8.5" r="1.2" fill="#ffd166"/><circle cx="12" cy="12" r="1.2" fill="#ffd166"/><circle cx="8.5" cy="15.5" r="1.2" fill="#ffd166"/><circle cx="15.5" cy="15.5" r="1.2" fill="#ffd166"/>', '#f8fafc'),
    cigar: S('<rect x="3" y="13" width="15" height="4" rx="1.5" fill="rgba(212,163,115,0.24)"/><path d="M15 13v4M19 10c1-1.5.5-3-1-4M21 12c1-1.5 1-3-.5-4.5" stroke="#94a3b8"/>', '#f4a261'),
    whiskey: S('<path d="M5 7h14l-1.5 13h-11z" fill="rgba(244,162,97,0.2)"/><path d="M6 13h12M9 15l2 2 2-2" stroke="#ffd166"/>', '#f4a261'),
    fedora: S('<path d="M2 16h20M6 16l1.5-8L12 9.5 16.5 8 18 16z" fill="rgba(244,162,97,0.2)"/><path d="M6.8 13h10.4" stroke="#e63946"/>', '#f4a261'),
    champagne: S('<path d="M9 3h6l1 6v12H8V9z" fill="rgba(128,255,219,0.18)"/><path d="M10 3V1h4v2M8 13h8" stroke="#ffd166"/>', '#80ffdb'),
    blackmark: S('<path d="M5 3v18M5 4h14l-3 4 3 4H5z" fill="rgba(230,57,70,0.35)"/><line x1="9" y1="6" x2="13" y2="10"/><line x1="13" y1="6" x2="9" y2="10"/>', '#e63946'),
    dagger: S('<path d="M19 3l-8 8 2 2 8-8z" fill="rgba(248,113,113,0.25)"/><path d="M9 11l4 4M5 19l4-4M4 16l4 4"/>', '#f87171'),
    ring: S('<circle cx="12" cy="14" r="6" fill="rgba(255,209,102,0.15)"/><polygon points="12 3 15 6 12 9 9 6" fill="#80ffdb" stroke="#80ffdb"/>', '#ffd166'),
    diamond: S('<polygon points="6 4 18 4 22 9 12 21 2 9" fill="rgba(128,255,219,0.24)"/><path d="M2 9h20M6 4l3 5 3 12 3-12 3-5"/>', '#80ffdb'),
    briefcase: S('<rect x="3" y="7" width="18" height="13" rx="2" fill="rgba(244,162,97,0.2)"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18M11 13v2h2v-2"/>', '#ffd166'),
    sax: S('<path d="M14 3c2 0 3 1 3 3l-5 11a3 3 0 1 1-5.5-2.2M7 10v2M10 12v2M13 14v2" fill="rgba(255,209,102,0.16)"/>', '#ffd166'),
    cards: S('<rect x="5" y="4" width="10" height="15" rx="2" fill="rgba(230,57,70,0.2)"/><path d="M15 6l4 1-2.5 13-3.5-.7"/><path d="M10 9.5l1.5 2-1.5 2-1.5-2z" fill="#e63946"/>', '#f8fafc'),
    car: S('<path d="M3 13l2-5h14l2 5v5H3z" fill="rgba(244,162,97,0.2)"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M5 13h14"/>', '#f4a261'),
    cheers: S('<path d="M5 4h5l-.5 6a2.5 2.5 0 0 1-5 0zM14 4h5l-.5 6a2.5 2.5 0 0 1-5 0z" fill="rgba(255,209,102,0.25)"/><path d="M7 13v7M5 20h4M16.5 13v7M14.5 20h4M12 2v3"/>', '#ffd166'),
    crystal: S('<circle cx="12" cy="10" r="7" fill="rgba(168,85,247,0.25)"/><path d="M7 19h10l-1-3H8zM9.5 8.5c1-1 3-1 4 0"/>', '#c084fc'),
    spotlight: S('<path d="M4 5l6 2-2 5-6-2z" fill="rgba(255,209,102,0.35)"/><polygon points="9 8 22 14 19 20 8 11" fill="rgba(255,209,102,0.12)"/><path d="M4 5v15"/>', '#ffd166'),
    wiltedRose: S('<path d="M13 6a3.5 3.5 0 0 1 5 3c0 2-2 3-3.5 3S12 10 13 6z" fill="rgba(230,57,70,0.28)"/><path d="M13 11c-2 2-3 5-2 10M11 16c-2 0-3-1-3-2" stroke="#94a3b8"/>', '#e63946'),
    emerald: S('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="rgba(42,157,143,0.3)"/>', '#2a9d8f'),

    // === ДОДАТКОВІ ІКОНКИ ІНТЕРФЕЙСУ ===
    key: S('<circle cx="8" cy="15" r="4" fill="rgba(255,209,102,0.2)"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>', '#ffd166'),
    handshake: S('<path d="M3 12l4-4 5 5 5-5 4 4-6 6a2.5 2.5 0 0 1-3.5 0L9 15.5"/>', '#f4a261'),
    flask: S('<path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 17l-5-9V3" fill="rgba(128,255,219,0.2)"/><path d="M7.5 15h9"/>', '#80ffdb'),
    bell: S('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" fill="rgba(255,209,102,0.2)"/><path d="M10 20a2 2 0 0 0 4 0"/>', '#ffd166'),
    bellOff: S('<path d="M18 8a6 6 0 0 0-9.3-5M6 8c0 7-3 9-3 9h14M10 20a2 2 0 0 0 4 0M2 2l20 20"/>', '#94a3b8'),
    snake: S('<path d="M4 18c0-3 3-3 5-3s4-1 4-4-2-4-5-4h8a4 4 0 0 1 4 4c0 2-1.5 3-3 3"/><circle cx="17" cy="9" r="0.8" fill="#80ffdb"/>', '#2a9d8f'),
    blocks: S('<rect x="3" y="13" width="6" height="6" rx="1" fill="rgba(155,93,229,0.28)"/><rect x="9" y="13" width="6" height="6" rx="1" fill="rgba(42,157,143,0.28)"/><rect x="15" y="13" width="6" height="6" rx="1" fill="rgba(244,162,97,0.28)"/><rect x="9" y="7" width="6" height="6" rx="1" fill="rgba(230,57,70,0.28)"/>', '#cbd5e1'),
    boom: S('<polygon points="12 2 14.5 8 21 6 17 12 22 17 15 16.5 12 22 9 16.5 2 17 7 12 3 6 9.5 8" fill="rgba(249,115,22,0.28)"/>', '#f97316'),
    arrowUp: S('<circle cx="12" cy="12" r="9" fill="rgba(42,157,143,0.2)"/><path d="M12 16V8M8 12l4-4 4 4"/>', '#80ffdb'),
    phone: S('<rect x="6" y="2" width="12" height="20" rx="2.5" fill="rgba(128,255,219,0.14)"/><line x1="10" y1="18" x2="14" y2="18"/>', '#80ffdb'),
    medalSilver: S('<circle cx="12" cy="14" r="6" fill="rgba(226,232,240,0.25)"/><path d="M8 3l4 6 4-6"/>', '#e2e8f0'),
    medalBronze: S('<circle cx="12" cy="14" r="6" fill="rgba(217,119,6,0.28)"/><path d="M8 3l4 6 4-6"/>', '#f59e0b'),
    male: S('<circle cx="10" cy="14" r="5" fill="rgba(56,189,248,0.18)"/><path d="M14 10l6-6M15 4h5v5"/>', '#38bdf8'),
    female: S('<circle cx="12" cy="9" r="5" fill="rgba(251,113,133,0.18)"/><path d="M12 14v7M9 18h6"/>', '#fb7185'),
    trendUp: S('<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>', '#2a9d8f'),
    trendDown: S('<polyline points="3 7 9 13 13 9 21 17"/><polyline points="15 17 21 17 21 11"/>', '#e63946'),
    pause: S('<circle cx="12" cy="12" r="9" fill="rgba(148,163,184,0.16)"/><line x1="10" y1="8.5" x2="10" y2="15.5"/><line x1="14" y1="8.5" x2="14" y2="15.5"/>', '#cbd5e1'),
    checkedBox: S('<rect x="3" y="3" width="18" height="18" rx="3" fill="rgba(42,157,143,0.22)"/><path d="M8 12l3 3 5-6"/>', '#80ffdb'),
    loveLetter: S('<rect x="3" y="5" width="18" height="14" rx="2" fill="rgba(244,162,97,0.18)"/><path d="M3 7l9 6 9-6"/>', '#ffd166'),
    palette: S('<path d="M12 3a9 9 0 1 0 0 18 2.5 2.5 0 0 0 2.5-2.5c0-.7-.3-1.2-.7-1.6-.4-.4-.7-.9-.7-1.4a1.5 1.5 0 0 1 1.5-1.5H17a4 4 0 0 0 4-4c0-3.9-4-7-9-7z" fill="rgba(244,162,97,0.18)"/><circle cx="7.5" cy="11.5" r="1" fill="#e63946"/><circle cx="10.5" cy="7.5" r="1" fill="#ffd166"/><circle cx="15" cy="8" r="1" fill="#2a9d8f"/>', '#f4a261'),
    user: S('<circle cx="12" cy="8" r="4" fill="rgba(148,163,184,0.2)"/><path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>', '#cbd5e1'),
    save: S('<path d="M5 3h11l3 3v15H5z" fill="rgba(56,189,248,0.16)"/><rect x="8" y="3" width="7" height="5"/><rect x="8" y="13" width="8" height="8"/>', '#38bdf8'),
    folder: S('<path d="M3 6h6l2 2h10v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="rgba(244,162,97,0.2)"/>', '#f4a261'),
    broom: S('<path d="M14 3l7 7M12 12l5-5M5 19l7-7 4 4-7 7-4-4z" fill="rgba(255,209,102,0.16)"/>', '#ffd166'),
    speak: S('<path d="M4 6h12v9H8l-4 3V6z" fill="rgba(128,255,219,0.16)"/><path d="M18 8a4 4 0 0 1 0 6"/>', '#80ffdb'),
    cocktail: S('<path d="M4 4h16l-8 8v8M8 20h8" fill="rgba(244,162,97,0.2)"/>', '#f4a261'),
    bank: S('<polygon points="12 3 3 8 21 8" fill="rgba(255,209,102,0.2)"/><path d="M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>', '#ffd166'),
    radio: S('<rect x="3" y="8" width="18" height="12" rx="2" fill="rgba(148,163,184,0.16)"/><path d="M7 8l10-5M8 14h.01M13 13h5M13 16h5"/>', '#80ffdb'),
    shades: S('<rect x="2" y="9" width="8" height="6" rx="2" fill="rgba(15,23,42,0.65)"/><rect x="14" y="9" width="8" height="6" rx="2" fill="rgba(15,23,42,0.65)"/><path d="M10 12h4"/>', '#cbd5e1'),
    siren: S('<path d="M6 17a6 6 0 0 1 12 0H6z" fill="rgba(230,57,70,0.35)"/><path d="M4 20h16M12 4v3M5 7l2 2M19 7l-2 2"/>', '#e63946'),
    hand: S('<path d="M7 13V6a1 1 0 0 1 2 0v5M9 11V4a1 1 0 0 1 2 0v7M11 11V5a1 1 0 0 1 2 0v6M13 11V7a1 1 0 0 1 2 0v6c0 4-2.5 7-6 7s-5-2.5-5-6v-3a1 1 0 0 1 2 0v2"/>', '#ffd166'),
    info: S('<circle cx="12" cy="12" r="9" fill="rgba(56,189,248,0.16)"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.8" fill="#38bdf8"/>', '#38bdf8'),
    edit: S('<path d="M16.5 3.5l4 4L8 20H4v-4z" fill="rgba(244,162,97,0.2)"/>', '#f4a261'),
    box: S('<path d="M12 2l9 5v10l-9 5-9-5V7z" fill="rgba(244,162,97,0.16)"/><path d="M3 7l9 5 9-5M12 12v10"/>', '#f4a261'),
    ticket: S('<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" fill="rgba(255,209,102,0.18)"/><line x1="9" y1="6" x2="9" y2="18" stroke-dasharray="2 2"/>', '#ffd166'),
    card: S('<rect x="2" y="5" width="20" height="14" rx="2" fill="rgba(128,255,219,0.16)"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>', '#80ffdb'),
    eye: S('<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" fill="rgba(148,163,184,0.16)"/><circle cx="12" cy="12" r="3"/>', '#cbd5e1'),
    city: S('<path d="M3 21V9l5-3v15M8 21V5l7-2v18M15 21v-9l6 2v7M2 21h20" fill="rgba(128,255,219,0.14)"/>', '#80ffdb'),
    rain: S('<path d="M6 15a4 4 0 0 1 1-7.8A5 5 0 0 1 16.5 8 3.5 3.5 0 0 1 18 15H6z" fill="rgba(147,197,253,0.2)"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>', '#93c5fd'),
    cookie: S('<circle cx="12" cy="12" r="9" fill="rgba(212,163,115,0.22)"/><circle cx="9" cy="10" r="1" fill="#f4a261"/><circle cx="14" cy="9" r="1" fill="#f4a261"/><circle cx="15" cy="14" r="1" fill="#f4a261"/><circle cx="10" cy="15" r="1" fill="#f4a261"/>', '#d4a373'),
    sparkles: S('<path d="M12 3l1.8 4.8L18.5 9.5l-4.7 1.7L12 16l-1.8-4.8L5.5 9.5l4.7-1.7z" fill="rgba(255,209,102,0.32)"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>', '#ffd166'),
    dotYellow: S('<circle cx="12" cy="12" r="5" fill="#ffd166"/>', '#ffd166')
  };

  // Карта заміни стандартних системних емодзі на фірмові нуарні SVG-іконки
  const EMOJI_MAP = {
    '🎭': 'mask', '🔫': 'mafia', '💉': 'doctor', '🩺': 'doctor', '✚': 'doctor',
    '🕵️': 'sheriff', '🕵': 'sheriff', '🔍': 'search', '📸': 'journalist',
    '🛡️': 'bodyguard', '🛡': 'bodyguard', '🎯': 'quests', '👑': 'godfather',
    '❤️': 'escort', '❤': 'escort', '🕯️': 'medium', '🕯': 'medium',
    '🧠': 'amnesiac', '🪽': 'angel', '⚖️': 'scales', '⚖': 'scales',
    '🗳️': 'vote', '🗳': 'vote', '💀': 'skull', '👻': 'ghost',
    '🌙': 'moon', '☀️': 'sun', '☀': 'sun', '🌅': 'sun', '⏳': 'timer',
    '📜': 'scroll', '🔥': 'fire', '🎮': 'play', '▶️': 'play', '▶': 'play',
    '🛠️': 'admin', '🛠': 'admin', '👥': 'friends', '🛒': 'shop',
    '📖': 'rules', '🌍': 'globe', '🌐': 'globe', '🏆': 'trophy', '⚙️': 'settings', '⚙': 'settings',
    '📰': 'news', '🗞️': 'news', '🗞': 'news', '👨‍💻': 'dev', '💬': 'chat',
    '🪙': 'coin', '⭐': 'star', '⚡': 'bolt', '🔒': 'lock', '🔓': 'unlock',
    '🤖': 'bot', '🚩': 'flag', '🎁': 'gift', '🔇': 'mute', '🔊': 'unmute',
    '🚫': 'ban', '🔨': 'hammer', '🔗': 'link', '🚪': 'door', '🔄': 'refresh',
    '🗑️': 'trash', '🗑': 'trash', '⚠️': 'warn', '⚠': 'warn',
    '✅': 'check', '🟢': 'dotGreen', '🔴': 'dotRed', '🟡': 'dotYellow', '➕': 'plus',
    '📊': 'chart', '⏩': 'skip', '✉️': 'mail', '✉': 'mail', '📩': 'mail',
    '📌': 'pin', '📢': 'megaphone', '🤫': 'shush', '❓': 'question',
    '👍': 'thumbUp', '👎': 'thumbDown', '🎉': 'trophy', '✨': 'sparkles',
    '🏅': 'trophy', '🥈': 'medalSilver', '🥉': 'medalBronze', '🥇': 'trophy', '🎖️': 'trophy', '🎖': 'trophy',
    '⚜️': 'godfather', '⚜': 'godfather',
    '🤐': 'mute', '🏃': 'door', '🤷': 'question', '📋': 'scroll', '🖼️': 'journalist', '🖼': 'journalist',
    '🚀': 'play', '😱': 'warn', '📅': 'timer', '💡': 'sparkles', '🔧': 'admin',
    '☕': 'coffee', '🌹': 'rose', '🎲': 'dice', '🚬': 'cigar', '🥃': 'whiskey',
    '⛓️': 'jailor', '⛓': 'jailor', '📁': 'framer', '🎩': 'fedora', '🍾': 'champagne',
    '🏴': 'blackmark', '🗡️': 'dagger', '🗡': 'dagger', '💍': 'ring', '💎': 'diamond',
    '💼': 'briefcase', '🎷': 'sax', '🃏': 'cards', '🚘': 'car', '🥂': 'cheers',
    '🔮': 'crystal', '🔦': 'spotlight', '🥀': 'wiltedRose', '💚': 'emerald',
    '🔑': 'key', '🔐': 'key', '🤝': 'handshake', '🧪': 'flask', '🔔': 'bell', '🔕': 'bellOff',
    '🐍': 'snake', '🧱': 'blocks', '💥': 'boom', '⬆️': 'arrowUp', '⬆': 'arrowUp', '📲': 'phone',
    '👨': 'male', '👩': 'female', '📈': 'trendUp', '📉': 'trendDown',
    '⏸️': 'pause', '⏸': 'pause', '☑️': 'checkedBox', '☑': 'checkedBox',
    '💌': 'loveLetter', '🎨': 'palette', '👤': 'user', '💾': 'save', '📂': 'folder',
    '🧹': 'broom', '🗣️': 'speak', '🗣': 'speak', '🍸': 'cocktail', '🏦': 'bank',
    '📻': 'radio', '🕶️': 'shades', '🕶': 'shades', '🚨': 'siren', '🏗️': 'admin', '🏗': 'admin',
    '✋': 'hand', 'ℹ️': 'info', 'ℹ': 'info', '✏️': 'edit', '✏': 'edit', '📦': 'box',
    '🎫': 'ticket', '💳': 'card', '👁️': 'eye', '👁': 'eye', '🏙️': 'city', '🏙': 'city',
    '🌧️': 'rain', '🌧': 'rain', '🍪': 'cookie', '💱': 'coin'
  };

  // Сортуємо ключі за довжиною (щоб складені емодзі з variation selector замінювались першими)
  const sortedKeys = Object.keys(EMOJI_MAP).sort((a, b) => b.length - a.length);
  const escapedKeys = sortedKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const EMOJI_PATTERN = '(' + escapedKeys.join('|') + ')';
  const EMOJI_TEST_REGEX = new RegExp(EMOJI_PATTERN);
  const EMOJI_REGEX = new RegExp(EMOJI_PATTERN, 'g');

  window.MAFIA_ICONS = ICONS;
  window.ico = function (name) {
    return ICONS[name] || ICONS.mask;
  };

  window.replaceEmojisInNode = function (root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !EMOJI_TEST_REGEX.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        const p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'OPTION' || tag === 'TITLE') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const toReplace = [];
    let current;
    while ((current = walker.nextNode())) {
      toReplace.push(current);
    }
    toReplace.forEach(textNode => {
      const val = textNode.nodeValue;
      EMOJI_REGEX.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let m;
      while ((m = EMOJI_REGEX.exec(val)) !== null) {
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(val.slice(lastIdx, m.index)));
        }
        const key = EMOJI_MAP[m[1]];
        const span = document.createElement('span');
        span.className = 'mafia-ico-wrap';
        span.innerHTML = ICONS[key] || m[1];
        frag.appendChild(span);
        lastIdx = m.index + m[0].length;
      }
      if (lastIdx < val.length) {
        frag.appendChild(document.createTextNode(val.slice(lastIdx)));
      }
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(frag, textNode);
      }
    });
  };

  // Автоматичне перетворення будь-яких емодзі в DOM (і статики, і динамічних повідомлень з сервера)
  let iconRafPending = false;
  function scheduleIconUpgrade() {
    if (iconRafPending) return;
    iconRafPending = true;
    requestAnimationFrame(() => {
      iconRafPending = false;
      window.replaceEmojisInNode(document.body);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.replaceEmojisInNode(document.body);
    const observer = new MutationObserver(() => scheduleIconUpgrade());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
