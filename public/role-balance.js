(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RoleBalance = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  function getMaxMafiaCount(n) {
    const count = Math.max(3, Math.floor(Number(n) || 5));
    if (count <= 5) return 1;
    if (count <= 9) return 2;
    if (count <= 13) return 3;
    if (count <= 17) return 4;
    return Math.min(6, Math.max(4, Math.round(count * 0.25)));
  }

  function shuffleCopy(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function getRoleCap(roleId, n) {
    const count = Math.max(3, Math.floor(Number(n) || 5));
    switch (roleId) {
      case 'godfather': return 1;
      case 'mafioso': return getMaxMafiaCount(count);
      case 'blackmailer':
      case 'framer':
      case 'consigliere':
        return 1;
      case 'doctor': return count >= 16 ? 3 : (count >= 8 ? 2 : 1);
      case 'escort': return count >= 15 ? 2 : 1;
      case 'sheriff': return count >= 16 ? 2 : 1;
      case 'bodyguard':
      case 'vigilante':
        return count >= 16 ? 2 : 1;
      case 'citizen': return count;
      default: return 1;
    }
  }

  function validateSelectedRoles(selectedRoles, rolesMap, mode) {
    const validMode = mode === 'legend' ? 'legend' : 'classic';
    const raw = Array.isArray(selectedRoles) ? selectedRoles : [];
    const seen = new Set();
    const validRoles = [];

    raw.forEach(id => {
      if (rolesMap && rolesMap[id] && !seen.has(id)) {
        if (validMode === 'classic' && rolesMap[id].mode === 'legend') return;
        seen.add(id);
        validRoles.push(id);
      }
    });

    if (validRoles.length === 0) {
      return {
        ok: false,
        error: 'Оберіть ролі для обох сторін (Мирних та Мафії)!',
        errorEn: 'Select roles for both teams (Town and Mafia)!',
        validRoles: []
      };
    }

    const hasMafia = validRoles.some(id => rolesMap[id].team === 'mafia');
    const hasTown = validRoles.some(id => rolesMap[id].team === 'town');

    if (!hasMafia) {
      return {
        ok: false,
        error: 'Неможливо створити кімнату без жодної ролі Мафії (оберіть Мафіозі або Дона)!',
        errorEn: 'Cannot create a room without any Mafia role (select Mafioso or Godfather)!',
        validRoles
      };
    }
    if (!hasTown) {
      return {
        ok: false,
        error: 'Неможливо створити кімнату лише з ролей Мафії (додайте хоча б 1 Мирну роль)!',
        errorEn: 'Cannot create a room with only Mafia roles (add at least 1 Town role)!',
        validRoles
      };
    }

    return { ok: true, error: '', errorEn: '', validRoles };
  }

  function computeRoleDistribution(playerCount, selectedRoles, rolesMap, mode, opts = {}) {
    const n = Math.max(3, Math.floor(Number(playerCount) || 5));
    const check = validateSelectedRoles(selectedRoles, rolesMap, mode);
    if (!check.ok) {
      return {
        ok: false,
        error: check.error,
        errorEn: check.errorEn || check.error,
        rolesArray: [],
        counts: {},
        teamCounts: { mafia: 0, town: 0, neutral: 0, cult: 0 },
        mafiaTarget: 0,
        hasOverflow: false
      };
    }

    const valid = check.validRoles;
    const mafiaTarget = Math.min(getMaxMafiaCount(n), Math.max(1, n - 2));
    const assignedMafia = [];

    const hasGodfather = valid.includes('godfather');
    const hasMafioso = valid.includes('mafioso');
    const selectedSupports = ['consigliere', 'framer', 'blackmailer'].filter(id => valid.includes(id));

    if (hasGodfather) assignedMafia.push('godfather');
    else if (hasMafioso) assignedMafia.push('mafioso');

    const supportCap = Math.max(0, mafiaTarget - 1);
    let supportsAdded = 0;
    selectedSupports.forEach(id => {
      if (assignedMafia.length < mafiaTarget && (supportsAdded < supportCap || mafiaTarget === 1)) {
        assignedMafia.push(id);
        supportsAdded++;
      }
    });

    while (assignedMafia.length < mafiaTarget) {
      assignedMafia.push('mafioso');
    }

    const neutralAndCult = valid.filter(id => rolesMap[id].team.includes('neutral') || rolesMap[id].team === 'cult');
    const desiredNeutrals = n < 7 ? 0 : (n <= 10 ? 1 : (n <= 14 ? 2 : (n <= 18 ? 3 : 4)));
    const maxFairNeutrals = Math.max(0, Math.floor((n - (mafiaTarget * 2) - 1) / 2));
    const neutralTarget = Math.min(neutralAndCult.length, desiredNeutrals, maxFairNeutrals);
    const neutralPool = (opts && opts.randomizeOverflow && neutralAndCult.length > neutralTarget)
      ? shuffleCopy(neutralAndCult)
      : neutralAndCult.slice();
    const assignedNeutrals = neutralPool.slice(0, neutralTarget);

    const townSlots = Math.max(0, n - assignedMafia.length - assignedNeutrals.length);
    const hasCitizen = valid.includes('citizen');
    const minCitizens = (hasCitizen && townSlots >= 2) ? 1 : 0;

    const assignedTown = [];
    const townSpecials = valid.filter(id => rolesMap[id].team === 'town' && id !== 'citizen');
    const maxSpecialSlots = Math.max(0, townSlots - minCitizens);
    const specialsPool = (opts && opts.randomizeOverflow && townSpecials.length > maxSpecialSlots)
      ? shuffleCopy(townSpecials)
      : townSpecials.slice();

    const countInTown = (id) => assignedTown.filter(x => x === id).length;

    // 1. По одній копії кожної вибраної мирної спецролі
    specialsPool.forEach(id => {
      if (townSlots - assignedTown.length > minCitizens) {
        assignedTown.push(id);
      }
    });

    // 2. Лише якщо лишаються слоти — масштабування дублікатів (Лікар >=8 -> 2 / >=16 -> 3, Коханка >=15 -> 2, Шериф >=16 -> 2 і т.д.)
    const scalableIds = ['doctor', 'escort', 'sheriff', 'bodyguard', 'vigilante'];
    let addedScale = true;
    while (addedScale && (townSlots - assignedTown.length > minCitizens)) {
      addedScale = false;
      for (let i = 0; i < scalableIds.length; i++) {
        const id = scalableIds[i];
        if (!townSpecials.includes(id)) continue;
        if (townSlots - assignedTown.length <= minCitizens) break;
        if (countInTown(id) < getRoleCap(id, n)) {
          assignedTown.push(id);
          addedScale = true;
        }
      }
    }

    // 3. Решту місць заповнюємо Мирними жителями для справедливого балансу без перекосу спецролей
    const fillerTown = 'citizen';
    while (assignedTown.length < townSlots) {
      assignedTown.push(fillerTown);
    }

    const rolesArray = assignedMafia.concat(assignedTown, assignedNeutrals);
    const counts = {};
    const teamCounts = { mafia: 0, town: 0, neutral: 0, cult: 0 };
    rolesArray.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
      const rObj = rolesMap[id];
      const tm = rObj ? rObj.team : 'town';
      if (tm === 'mafia') teamCounts.mafia++;
      else if (tm === 'cult') teamCounts.cult++;
      else if (tm.includes('neutral')) teamCounts.neutral++;
      else teamCounts.town++;
    });

    const hasOverflow = (townSpecials.length > maxSpecialSlots) || (neutralAndCult.length > neutralTarget);

    return { ok: true, error: '', errorEn: '', rolesArray, counts, teamCounts, mafiaTarget, hasOverflow };
  }

  return {
    getMaxMafiaCount,
    getRoleCap,
    validateSelectedRoles,
    computeRoleDistribution
  };
}));
