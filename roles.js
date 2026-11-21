const ROLES = {
  // === КЛАСИКА ===
  citizen: {
    id: 'citizen', mode: 'classic', team: 'town', priority: 0, actionIcon: '',
    names: { ua: 'Мирний житель', en: 'Citizen' },
    desc: 'Вночі спить. Вдень бере участь в обговоренні (60 с) та голосуванні (30 с), щоб вигнати Мафію.',
    descEn: 'Sleeps at night. Participates in daytime discussion (60s) and voting (30s) to exile the Mafia.'
  },
  sheriff: {
    id: 'sheriff', mode: 'classic', team: 'town', priority: 3, actionIcon: '🔍',
    names: { ua: 'Шериф', en: 'Sheriff' },
    desc: 'Прокидається вночі (фаза вибору цілей — 30 с) і перевіряє одного гравця: дізнається, чи він Мафія (Дон здається мирним).',
    descEn: 'Wakes up at night (action phase — 30s) to investigate one player and learn if they are Mafia (the Godfather appears innocent).'
  },
  doctor: {
    id: 'doctor', mode: 'classic', team: 'town', priority: 2, actionIcon: '✚',
    names: { ua: 'Лікар', en: 'Doctor' },
    desc: 'Прокидається у 2-му етапі ночі та обирає іншого гравця, рятуючи його від нападу Мафії або Месника. Себе лікувати та лікувати одного й того самого гравця дві ночі поспіль не можна.',
    descEn: 'Wakes up in Night phase 2 to heal another player, saving them from a Mafia or Vigilante attack. Cannot heal self or the same target two nights in a row.'
  },
  escort: {
    id: 'escort', mode: 'classic', team: 'town', priority: 1, actionIcon: '❤️',
    names: { ua: 'Коханка', en: 'Escort' },
    desc: 'Прокидається першою вночі та відволікає іншого гравця (не себе), повністю блокуючи його нічну дію.',
    descEn: 'Acts first at night to distract another player (never self), completely blocking their night action.'
  },
  mafioso: {
    id: 'mafioso', mode: 'classic', team: 'mafia', priority: 3, actionIcon: '🔫',
    names: { ua: 'Мафіозі', en: 'Mafioso' },
    desc: 'Вночі спілкується у чаті Мафії (30 с), а потім обирає жертву (30 с). Якщо Дон живий, головний удар завдає Дон.',
    descEn: 'Discusses in the secret Mafia chat at night (30s), then votes on a target (30s). If the Godfather is alive, the Godfather leads the hit.'
  },
  godfather: {
    id: 'godfather', mode: 'classic', team: 'mafia', priority: 3, actionIcon: '🎯',
    names: { ua: 'Дон Мафії', en: 'Godfather' },
    desc: 'Голова клану. Спілкується у нічному чаті Мафії та визначає головну ціль для усунення. Для Шерифа виглядає як мирний.',
    descEn: 'Head of the crime family. Chats with the Mafia at night and chooses the final kill target. Appears innocent to the Sheriff.'
  },

  // === ЛЕГЕНДА ===
  bodyguard: {
    id: 'bodyguard', mode: 'legend', team: 'town', priority: 2, actionIcon: '🛡️',
    names: { ua: 'Охоронець', en: 'Bodyguard' },
    desc: 'Вночі охороняє іншого гравця від будь-яких нападів (Мафії чи Месника): Охоронець вбиває нападника, але гине сам.',
    descEn: 'Protects another player at night from any attack (Mafia or Vigilante): the Bodyguard kills the attacker but dies in the process.'
  },
  jailor: {
    id: 'jailor', mode: 'legend', team: 'town', priority: 1, actionIcon: '⛓️',
    names: { ua: 'Тюремник', en: 'Jailor' },
    desc: 'Вночі саджає обраного гравця за ґрати: ціль захищена від нападів, але її нічна дія заблокована.',
    descEn: 'Locks a chosen player in jail for the night: the prisoner is protected from attacks, but their night action is blocked.'
  },
  journalist: {
    id: 'journalist', mode: 'legend', team: 'town', priority: 4, actionIcon: '📸',
    names: { ua: 'Репортер', en: 'Journalist' },
    desc: 'Вночі обирає ДВОХ гравців. Вранці автоматично публікує в газету/чат зведення: чи належать ці два гравці до ОДНІЄЇ команди, чи до РІЗНИХ.',
    descEn: 'Selects TWO players at night. In the morning, automatically publishes whether those two players belong to the SAME team or DIFFERENT teams.'
  },
  medium: {
    id: 'medium', mode: 'legend', team: 'town', priority: 4, actionIcon: '',
    names: { ua: 'Медіум', en: 'Medium' },
    desc: 'Вночі підслуховує таємний чат Мафії в реальному часі (імена мафіозі приховані як Інкогніто), а також чує чат привидів.',
    descEn: 'Overhears the secret Mafia night chat anonymously in real time, and can also read the Ghost chat.'
  },
  mayor: {
    id: 'mayor', mode: 'legend', team: 'town', priority: 0, actionIcon: '',
    names: { ua: 'Мер міста', en: 'Mayor' },
    desc: 'Вночі спить. На денному голосуванні його голос автоматично рахується за 2 голоси.',
    descEn: 'Sleeps at night. During day voting, their vote automatically counts as 2 votes.'
  },
  vigilante: {
    id: 'vigilante', mode: 'legend', team: 'town', priority: 3, actionIcon: '💥',
    names: { ua: 'Месник', en: 'Vigilante' },
    desc: 'Вночі може вистрілити в підозрюваного. Якщо застрелить мирного жителя — гине сам від докорів сумління.',
    descEn: 'Can shoot a suspect at night. If they shoot an innocent Town player, they die of guilt as well.'
  },
  framer: {
    id: 'framer', mode: 'legend', team: 'mafia', priority: 1, actionIcon: '📁',
    names: { ua: 'Адвокат', en: 'Framer' },
    desc: 'Вночі підкидає фальшиві докази обраному мирному гравцю: якщо цієї ночі його перевірить Шериф або порівняє Репортер, він покажеться як МАФІЯ!',
    descEn: 'Plants fake evidence on a player at night: if investigated by the Sheriff or compared by the Journalist that night, they show up as MAFIA!'
  },
  blackmailer: {
    id: 'blackmailer', mode: 'legend', team: 'mafia', priority: 1, actionIcon: '🤐',
    names: { ua: 'Шантажист', en: 'Blackmailer' },
    desc: 'Вночі залякує гравця, забороняючи йому писати в денний чат наступного дня.',
    descEn: 'Intimidates a target at night, silencing them from speaking in the next daytime chat.'
  },
  consigliere: {
    id: 'consigliere', mode: 'legend', team: 'mafia', priority: 3, actionIcon: '🕵️',
    names: { ua: 'Консильєре', en: 'Consigliere' },
    desc: 'Шпигун Мафії. Вночі дізнається точну роль обраного гравця.',
    descEn: 'Mafia spy. Investigates a player at night to reveal their exact role.'
  },
  guardian_angel: {
    id: 'guardian_angel', mode: 'legend', team: 'neutral_good', priority: 1, actionIcon: '🪽',
    names: { ua: 'Янгол-Охоронець', en: 'Guardian Angel' },
    desc: 'Вночі оберігає обраного гравця від смерті та шантажу. Перемагає разом із містом або якщо виживе.',
    descEn: 'Watches over a chosen player at night, shielding them from death and blackmail. Wins with Town or by surviving to the end.'
  },
  cult_leader: {
    id: 'cult_leader', mode: 'legend', team: 'cult', priority: 3, actionIcon: '🕯️',
    names: { ua: 'Лідер Культу', en: 'Cult Leader' },
    desc: 'Щоночі навертає одного мирного гравця у Культ. Навернені стають культистами (бачать одне одного, але самі не можуть вербувати інших). Перемагають, коли Культ стає більшістю.',
    descEn: 'Converts one unprotected Town player into a Cultist each night. Converted Cultists see each other but cannot convert others. Wins when the Cult becomes the majority.'
  },
  amnesiac: {
    id: 'amnesiac', mode: 'legend', team: 'neutral', priority: 4, actionIcon: '🧠',
    names: { ua: 'Амнезіак', en: 'Amnesiac' },
    desc: 'У 1-шу ніч (поки ніхто не вибув) спить. Щойно хтось вибуде, Амнезіак вночі обирає вибулого гравця та переймає його точну роль і команду (мирних, мафії або культу).',
    descEn: 'Sleeps on Night 1 while no one has died. Once someone dies, chooses an eliminated player at night to assume their exact role and team.'
  },
  jester: {
    id: 'jester', mode: 'legend', team: 'neutral_chaos', priority: 0, actionIcon: '',
    names: { ua: 'Джокер', en: 'Jester' },
    desc: 'Мета — змусити місто стратити саме його на денному голосуванні. Якщо це станеться, Джокер здобуває особисту перемогу, а гра триває між іншими командами.',
    descEn: 'Goal: trick the Town into executing you during the day vote. If executed, the Jester achieves a personal victory while the match continues between the other teams.'
  }
};

module.exports = ROLES;
