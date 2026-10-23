(() => {
  "use strict";

  const STORAGE_KEY = "custo-por-km:v1";
  const APP_VERSION = "1.1.2";
  const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000;
  const UPDATE_CHECK_THROTTLE = 60 * 1000;

  const CURRENCIES = {
    BRL: { locale: "pt-BR" },
    USD: { locale: "en-US" },
    EUR: { locale: "de-DE" },
    GBP: { locale: "en-GB" },
    ARS: { locale: "es-AR" },
    MXN: { locale: "es-MX" },
    CLP: { locale: "es-CL" },
    COP: { locale: "es-CO" },
    CAD: { locale: "en-CA" },
    AUD: { locale: "en-AU" },
    JPY: { locale: "ja-JP" },
    INR: { locale: "en-IN" }
  };

  const DEFAULT_VALUES = {
    ethanolPrice: "3,59",
    gasolinePrice: "6,09",
    electricPrice: "0,91",
    ethanolConsumption: "11,00",
    gasolineConsumption: "14,00",
    electricConsumption: "7,45",
    dailyDistance: "",
    daysPerWeek: "5"
  };

  const MASKED_KEYS = [
    "ethanolPrice",
    "gasolinePrice",
    "electricPrice",
    "ethanolConsumption",
    "gasolineConsumption",
    "electricConsumption"
  ];

  const DEFAULT_NUMBERS = {
    ethanolPrice: 3.59,
    gasolinePrice: 6.09,
    electricPrice: 0.91,
    ethanolConsumption: 11,
    gasolineConsumption: 14,
    electricConsumption: 7.45,
    dailyDistance: 0,
    daysPerWeek: 5
  };

  const WEEKS_PER_YEAR = 52;
  const WEEKS_PER_MONTH = WEEKS_PER_YEAR / 12;

  const DEFAULT_UNITS = {
    ethanol: "km/L",
    gasoline: "km/L",
    electric: "km/kWh"
  };

  const UNITS_BY_FUEL = {
    ethanol: ["km/L", "L/100km"],
    gasoline: ["km/L", "L/100km"],
    electric: ["km/kWh", "kWh/100km"]
  };

  const FUELS = [
    {
      id: "ethanol",
      name: "Etanol",
      icon: "leaf",
      priceKey: "ethanolPrice",
      consumptionKey: "ethanolConsumption",
      unitKey: "ethanolUnit"
    },
    {
      id: "gasoline",
      name: "Gasolina",
      icon: "fuel",
      priceKey: "gasolinePrice",
      consumptionKey: "gasolineConsumption",
      unitKey: "gasolineUnit"
    },
    {
      id: "electric",
      name: "Elétrico",
      icon: "bolt",
      priceKey: "electricPrice",
      consumptionKey: "electricConsumption",
      unitKey: "electricUnit"
    }
  ];

  const ICONS = {
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    fuel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/><path d="M3 22h12"/><path d="M5 9h8"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>'
  };

  const els = {
    currency: document.getElementById("currency"),
    themeToggle: document.getElementById("themeToggle"),
    themeColor: document.getElementById("themeColor"),
    form: document.getElementById("calcForm"),
    resetBtn: document.getElementById("resetBtn"),
    resultList: document.getElementById("resultList"),
    insights: document.getElementById("insights"),
    calcDetails: document.getElementById("calcDetails"),
    fuelFilter: document.getElementById("fuelFilter"),
    fuelToggles: Array.from(document.querySelectorAll("[data-fuel-toggle]")),
    toast: document.getElementById("toast"),
    ethanolPrice: document.getElementById("ethanolPrice"),
    gasolinePrice: document.getElementById("gasolinePrice"),
    electricPrice: document.getElementById("electricPrice"),
    ethanolConsumption: document.getElementById("ethanolConsumption"),
    gasolineConsumption: document.getElementById("gasolineConsumption"),
    electricConsumption: document.getElementById("electricConsumption"),
    dailyDistance: document.getElementById("dailyDistance"),
    daysPerWeek: document.getElementById("daysPerWeek"),
    ethanolUnit: document.getElementById("ethanolUnit"),
    gasolineUnit: document.getElementById("gasolineUnit"),
    electricUnit: document.getElementById("electricUnit"),
    settingsBtn: document.getElementById("settingsBtn"),
    settingsDialog: document.getElementById("settingsDialog"),
    closeSettings: document.getElementById("closeSettings"),
    doneSettings: document.getElementById("doneSettings"),
    settingsSummary: document.getElementById("settingsSummary"),
    daysSummary: document.getElementById("daysSummary"),
    updateBanner: document.getElementById("updateBanner"),
    updateNow: document.getElementById("updateNow"),
    updateLater: document.getElementById("updateLater"),
    checkUpdate: document.getElementById("checkUpdate"),
    appVersion: document.getElementById("appVersion")
  };

  const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  let saveTimer = null;
  let toastTimer = null;
  let separators = getSeparators("pt-BR");
  let state = loadState();
  let draftUnits = { ...state.units };
  let hadController = false;
  let refreshing = false;
  let lastUpdateCheck = 0;
  let manualCheckTimer = null;

  init();

  function init() {
    bindEvents();
    if (els.appVersion) els.appVersion.textContent = APP_VERSION;
    hadController = Boolean("serviceWorker" in navigator && navigator.serviceWorker.controller);
    separators = getSeparators(currentLocale());
    syncForm();
    state.values = collectValues();
    state.units = collectUnits();
    applyTheme(state.theme, false);
    els.currency.value = state.currency;
    updateCurrencySymbols();
    syncFuelToggles();
    render();
    registerServiceWorker();
  }

  function bindEvents() {
    els.form.addEventListener("submit", (event) => event.preventDefault());
    els.form.addEventListener("input", handleFormChange);
    els.form.addEventListener("change", handleFormChange);

    els.fuelFilter.addEventListener("change", handleFuelToggleChange);
    els.settingsDialog.addEventListener("input", handleSettingsDraftChange);
    els.settingsDialog.addEventListener("change", handleSettingsDraftChange);
    els.settingsDialog.addEventListener("keydown", handleMaskedKeydown);
    els.settingsBtn.addEventListener("click", openSettings);
    els.closeSettings.addEventListener("click", cancelSettings);
    els.doneSettings.addEventListener("click", commitSettings);
    els.settingsDialog.addEventListener("click", (event) => {
      if (event.target === els.settingsDialog) cancelSettings();
    });
    els.settingsDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      cancelSettings();
    });
    els.settingsDialog.addEventListener("close", () => {
      document.documentElement.classList.remove("dialog-open");
    });

    els.currency.addEventListener("change", () => {
      const next = els.currency.value;
      if (!CURRENCIES[next] || next === state.currency) return;

      const parsed = {};
      Object.keys(DEFAULT_VALUES).forEach((key) => {
        parsed[key] = parseNumber(els[key].value);
      });

      state.currency = next;
      separators = getSeparators(currentLocale());

      Object.keys(DEFAULT_VALUES).forEach((key) => {
        if (!Number.isFinite(parsed[key]) || !els[key] || els[key].tagName !== "INPUT") return;
        els[key].value = MASKED_KEYS.includes(key)
          ? formatMaskedNumber(parsed[key])
          : formatInputNumber(parsed[key], key === "dailyDistance" ? 2 : 4);
      });

      state.values = collectValues();
      updateCurrencySymbols();
      render();
      persist();
    });

    els.themeToggle.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next, true);
      persist();
    });

    if (els.updateNow) els.updateNow.addEventListener("click", applyUpdate);
    if (els.updateLater) els.updateLater.addEventListener("click", hideUpdateBanner);
    if (els.checkUpdate) {
      els.checkUpdate.addEventListener("click", () => checkForUpdate({ manual: true }));
    }

    els.resetBtn.addEventListener("click", () => {
      const values = {};
      Object.keys(DEFAULT_VALUES).forEach((key) => {
        if (key === "dailyDistance") {
          values[key] = "";
        } else if (key === "daysPerWeek") {
          values[key] = String(DEFAULT_NUMBERS[key]);
        } else {
          values[key] = formatInputNumber(DEFAULT_NUMBERS[key], 4);
        }
      });
      state.values = values;
      state.units = { ...DEFAULT_UNITS };
      state.enabledFuels = { ethanol: true, gasoline: true, electric: true };
      syncForm();
      state.values = collectValues();
      state.units = collectUnits();
      syncFuelToggles();
      render();
      persist();
      showToast("Valores padrão restaurados");
    });

    if (typeof themeMedia.addEventListener === "function") {
      themeMedia.addEventListener("change", () => {
        if (!state.theme) applyTheme(null, false);
      });
    }
  }

  function handleFormChange() {
    state.values = collectValues();
    state.units = collectUnits();
    render();
    scheduleSave();
  }

  function handleFuelToggleChange(event) {
    const toggle = event.target.closest("[data-fuel-toggle]");
    if (!toggle) return;
    state.enabledFuels[toggle.dataset.fuelToggle] = toggle.checked;
    render();
    persist();
  }

  function syncFuelToggles() {
    els.fuelToggles.forEach((toggle) => {
      toggle.checked = state.enabledFuels[toggle.dataset.fuelToggle] !== false;
    });
  }

  function handleSettingsDraftChange(event) {
    const target = event && event.target;
    if (!target) return;

    if (target.matches && target.matches('input[data-mask="decimal"]')) {
      applyInputMask(target);
    }

    if (target.classList && target.classList.contains("unit-select")) {
      convertDraftUnit(target);
    }

    updateDaysSummary();
  }

  function handleMaskedKeydown(event) {
    const target = event.target;
    if (!target || !target.matches || !target.matches('input[data-mask="decimal"]')) return;
    if (event.key !== "Backspace" && event.key !== "Delete") return;
    if (typeof target.selectionStart === "number" && target.selectionStart !== target.selectionEnd) return;

    event.preventDefault();
    removeLastMaskedDigit(target);
  }

  function convertDraftUnit(select) {
    const fuelId = select.id.replace(/Unit$/, "");
    const oldUnit = draftUnits[fuelId];
    if (!oldUnit) {
      draftUnits[fuelId] = select.value;
      return;
    }
    if (oldUnit === select.value) return;

    const input = els[`${fuelId}Consumption`];
    if (!input) return;

    const value = parseNumber(input.value);
    if (Number.isFinite(value) && value > 0) {
      input.value = formatMaskedNumber(100 / value);
    }

    draftUnits[fuelId] = select.value;
  }

  function formatMaskedNumber(value) {
    if (!Number.isFinite(value)) return "";
    try {
      return new Intl.NumberFormat(currentLocale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return value.toFixed(2);
    }
  }

  function normalizeMaskedDigits(value) {
    return String(value == null ? "" : value)
      .replace(/\D/g, "")
      .replace(/^0+(?=\d)/, "");
  }

  function placeCaretAtEnd(input) {
    if (typeof input.setSelectionRange !== "function") return;
    const end = input.value.length;
    try {
      input.setSelectionRange(end, end);
    } catch (error) {
      return;
    }
  }

  function setMaskedDigits(input, digits) {
    if (!digits) {
      input.value = "";
    } else {
      input.value = formatMaskedNumber(Number(digits) / 100);
    }
    placeCaretAtEnd(input);
  }

  function applyInputMask(input) {
    setMaskedDigits(input, normalizeMaskedDigits(input.value));
  }

  function removeLastMaskedDigit(input) {
    const digits = normalizeMaskedDigits(input.value);
    setMaskedDigits(input, digits.slice(0, -1));
  }

  function collectValues() {
    const values = {};
    Object.keys(DEFAULT_VALUES).forEach((key) => {
      values[key] = els[key].value;
    });
    return values;
  }

  function collectUnits() {
    return {
      ethanol: els.ethanolUnit.value,
      gasoline: els.gasolineUnit.value,
      electric: els.electricUnit.value
    };
  }

  function syncForm() {
    Object.keys(DEFAULT_VALUES).forEach((key) => {
      const element = els[key];
      if (!element) return;
      const raw = typeof state.values[key] === "string" ? state.values[key] : DEFAULT_VALUES[key];

      if (MASKED_KEYS.includes(key)) {
        const parsed = parseNumber(raw);
        element.value = Number.isFinite(parsed) ? formatMaskedNumber(parsed) : "";
      } else {
        element.value = raw;
      }
    });
    if (!/^[1-7]$/.test(els.daysPerWeek.value)) els.daysPerWeek.value = "5";
    els.ethanolUnit.value = state.units.ethanol;
    els.gasolineUnit.value = state.units.gasoline;
    els.electricUnit.value = state.units.electric;
  }

  function currentLocale() {
    return (CURRENCIES[state.currency] || CURRENCIES.BRL).locale;
  }

  function getSeparators(locale) {
    try {
      const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
      return {
        group: (parts.find((part) => part.type === "group") || {}).value || ",",
        decimal: (parts.find((part) => part.type === "decimal") || {}).value || "."
      };
    } catch (error) {
      return { group: ",", decimal: "." };
    }
  }

  function parseNumber(raw) {
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : NaN;
    const text = String(raw == null ? "" : raw).trim();
    if (!text) return NaN;

    let cleaned = text.replace(/[^\d.,-]/g, "");
    if (!cleaned) return NaN;

    const group = separators.group;
    const decimal = separators.decimal;
    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");
    let normalized = cleaned;

    if (hasComma && hasDot) {
      const lastComma = cleaned.lastIndexOf(",");
      const lastDot = cleaned.lastIndexOf(".");
      normalized = lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(/,/g, ".")
        : cleaned.replace(/,/g, "");
    } else if (hasComma || hasDot) {
      const sep = hasComma ? "," : ".";
      const pieces = cleaned.split(sep);
      const count = pieces.length - 1;
      const last = pieces[pieces.length - 1];

      if (sep === decimal) {
        if (count > 1) {
          normalized = pieces.slice(0, -1).join("") + "." + last;
        } else {
          normalized = cleaned.replace(sep, ".");
        }
      } else if (sep === group) {
        const looksGrouped = pieces.length === 2 && last.length === 3 && /^\d{1,3}$/.test(pieces[0]);
        normalized = count > 1 || looksGrouped ? pieces.join("") : cleaned.replace(sep, ".");
      } else {
        normalized = cleaned.replace(sep, ".");
      }
    }

    const value = Number(normalized);
    return Number.isFinite(value) ? value : NaN;
  }

  function computeCostPerKm(fuel, price, consumption, unit) {
    if (fuel.id === "electric") {
      return unit === "kWh/100km" ? (consumption / 100) * price : price / consumption;
    }
    return unit === "L/100km" ? (consumption / 100) * price : price / consumption;
  }

  function toKmPerLiter(consumption, unit) {
    return unit === "L/100km" ? 100 / consumption : consumption;
  }

  function unitLabel(unit) {
    if (unit === "L/100km") return "L/100 km";
    if (unit === "kWh/100km") return "kWh/100 km";
    return unit;
  }

  function getDaysPerWeek() {
    const value = Number(els.daysPerWeek.value);
    return Number.isInteger(value) && value >= 1 && value <= 7 ? value : 5;
  }

  function render() {
    const dailyDistance = parseNumber(els.dailyDistance.value);
    const dailyValid = Number.isFinite(dailyDistance) && dailyDistance >= 0;
    const safeDaily = dailyValid ? dailyDistance : 0;
    const hasDistance = dailyValid && dailyDistance > 0;
    const daysPerWeek = getDaysPerWeek();

    const results = FUELS.map((fuel) => {
      const price = parseNumber(els[fuel.priceKey].value);
      const consumption = parseNumber(els[fuel.consumptionKey].value);
      const unit = els[fuel.unitKey].value;
      const valid = Number.isFinite(price) && price > 0 && Number.isFinite(consumption) && consumption > 0;
      const cost = valid ? computeCostPerKm(fuel, price, consumption, unit) : NaN;

      return {
        ...fuel,
        price,
        consumption,
        unit,
        valid,
        cost,
        cost100: valid ? cost * 100 : NaN,
        daily: valid ? cost * safeDaily : NaN,
        weekly: valid ? cost * safeDaily * daysPerWeek : NaN,
        monthly: valid ? cost * safeDaily * daysPerWeek * WEEKS_PER_MONTH : NaN,
        annual: valid ? cost * safeDaily * daysPerWeek * WEEKS_PER_YEAR : NaN,
        isWinner: false,
        deltaPct: NaN
      };
    });

    const enabledResults = results.filter((result) => state.enabledFuels[result.id] !== false);

    if (!enabledResults.length) {
      els.resultList.innerHTML = '<p class="result-empty">Ative ao menos um combustível para comparar.</p>';
      els.calcDetails.hidden = true;
      els.insights.innerHTML = "";
      updateSettingsSummary();
      return;
    }

    els.calcDetails.hidden = false;

    const validResults = enabledResults.filter((result) => result.valid);
    const best = validResults.reduce((acc, item) => (!acc || item.cost < acc.cost ? item : acc), null);
    const maxCost = validResults.reduce((acc, item) => Math.max(acc, item.cost), 0);

    if (best) {
      enabledResults.forEach((result) => {
        if (!result.valid) return;
        const tolerance = Math.max(best.cost * 0.001, 1e-9);
        result.isWinner = Math.abs(result.cost - best.cost) <= tolerance;
        result.deltaPct = ((result.cost - best.cost) / best.cost) * 100;
      });
    }

    renderCards(enabledResults, maxCost, hasDistance, daysPerWeek);
    renderInsights(enabledResults);
    updateSettingsSummary();
  }

  function renderCards(results, maxCost, hasDistance, daysPerWeek) {
    const dayWord = daysPerWeek === 1 ? "dia" : "dias";
    const sortedResults = [...results].sort((a, b) => {
      if (a.valid && b.valid) return a.cost - b.cost;
      if (a.valid) return -1;
      if (b.valid) return 1;
      return 0;
    });

    els.resultList.innerHTML = sortedResults.map((result) => {
      const width = result.valid && maxCost > 0 ? Math.max(6, (result.cost / maxCost) * 100) : 0;
      const consumption = result.valid
        ? `${formatNumber(result.consumption, 2)} ${unitLabel(result.unit)}`
        : "Dados incompletos";

      let trailing = "";
      if (result.valid) {
        if (result.isWinner) {
          trailing = '<span class="badge">Mais econômico</span>';
        } else {
          const delta = Math.max(0, result.deltaPct);
          const deltaText = delta < 0.5 ? "quase igual" : `+${formatNumber(delta, 0)}%`;
          trailing = `<span class="delta" title="Custo em relação à opção mais econômica"><span>${deltaText}</span><small>vs. melhor</small></span>`;
        }
      }

      return `
        <article class="result-card${result.isWinner ? " is-winner" : ""}" data-fuel="${result.id}">
          <div class="result-head">
            <span class="fuel-icon">${ICONS[result.icon]}</span>
            <div class="fuel-name">
              <h3>${result.name}</h3>
              <span class="fuel-sub">${consumption}</span>
            </div>
            ${trailing}
          </div>
          <div class="cost">
            <span class="cost-value">${result.valid ? formatMoney(result.cost, 3) : "—"}</span>
            <span class="cost-unit">/km</span>
          </div>
          <div class="bar" aria-hidden="true"><span style="width:${width}%"></span></div>
          <dl class="metrics">
            <div>
              <dt>Por dia</dt>
              <dd>${result.valid && hasDistance ? formatMoneyShort(result.daily) : "—"}</dd>
            </div>
            <div>
              <dt>Por semana (${daysPerWeek} ${dayWord})</dt>
              <dd>${result.valid && hasDistance ? formatMoneyShort(result.weekly) : "—"}</dd>
            </div>
            <div>
              <dt>Por mês</dt>
              <dd>${result.valid && hasDistance ? formatMoneyShort(result.monthly) : "—"}</dd>
            </div>
            <div>
              <dt>Por ano</dt>
              <dd>${result.valid && hasDistance ? formatMoneyShort(result.annual) : "—"}</dd>
            </div>
          </dl>
        </article>
      `;
    }).join("");
  }

  function renderInsights(results) {
    const ethanol = results.find((result) => result.id === "ethanol");
    const gasoline = results.find((result) => result.id === "gasoline");
    const electric = results.find((result) => result.id === "electric");
    const cards = [];

    if (ethanol && gasoline && ethanol.valid && gasoline.valid) {
      const ethanolKmL = toKmPerLiter(ethanol.consumption, ethanol.unit);
      const gasolineKmL = toKmPerLiter(gasoline.consumption, gasoline.unit);
      const ratio = (ethanolKmL / gasolineKmL) * 100;
      const breakEven = gasoline.price * (ethanolKmL / gasolineKmL);
      const currentRatio = (ethanol.price / gasoline.price) * 100;
      const worth = ethanol.price <= breakEven * 1.000001;
      const fill = clamp(currentRatio, 0, 100);
      const mark = clamp(ratio, 0, 100);

      cards.push(`
        <div class="insight">
          <div class="insight-head">
            <span class="insight-icon">${ICONS.leaf}</span>
            <h3>Etanol x gasolina</h3>
            <span class="status ${worth ? "good" : "warn"}">${worth ? "Etanol vale a pena" : "Gasolina vale a pena"}</span>
          </div>
          <p>O etanol compensa se o litro custar até <strong>${formatMoney(breakEven, 2)}</strong>. Hoje ele está em <strong>${formatMoney(ethanol.price, 2)}</strong>, ${worth ? "abaixo" : "acima"} desse limite.</p>
          <div class="parity-bar" aria-hidden="true">
            <span class="parity-fill${worth ? "" : " over"}" style="width:${fill}%"></span>
            <i class="parity-mark" style="left:calc(${mark}% - 1px)"></i>
          </div>
          <div class="parity-legend">
            <span>Etanol = ${formatNumber(currentRatio, 0)}% da gasolina</span>
            <span>Limite: ${formatNumber(ratio, 0)}%</span>
          </div>
        </div>
      `);
    }

    if (electric && gasoline && electric.valid && gasoline.valid) {
      const pct = (electric.cost / gasoline.cost) * 100;
      const diff100 = Math.abs(gasoline.cost100 - electric.cost100);
      const cheaper = pct < 100;

      cards.push(`
        <div class="insight">
          <div class="insight-head">
            <span class="insight-icon">${ICONS.bolt}</span>
            <h3>Elétrico x gasolina</h3>
            <span class="status ${cheaper ? "good" : "warn"}">${cheaper ? "Elétrico mais barato" : "Gasolina mais barata"}</span>
          </div>
          <p>O custo por km do elétrico equivale a <strong>${formatNumber(pct, 0)}%</strong> do custo da gasolina. A cada 100 km, a diferença é de <strong>${formatMoney(diff100, 2)}</strong> ${cheaper ? "a favor do elétrico" : "a favor da gasolina"}.</p>
        </div>
      `);
    }

    if (!cards.length) {
      const message = results.length < 2
        ? "Ative pelo menos dois combustíveis e preencha os valores para ver as análises comparativas."
        : "Preencha preços e consumos para ver a paridade etanol/gasolina e a economia do carro elétrico.";

      cards.push(`
        <div class="insight">
          <div class="insight-head">
            <span class="insight-icon">${ICONS.spark}</span>
            <h3>Análises automáticas</h3>
          </div>
          <p>${message}</p>
        </div>
      `);
    }

    els.insights.innerHTML = cards.join("");
  }

  function updateDaysSummary() {
    if (!els.daysSummary) return;
    const days = getDaysPerWeek();
    const dayWord = days === 1 ? "dia" : "dias";
    const monthlyDays = days * WEEKS_PER_MONTH;
    const annualDays = days * WEEKS_PER_YEAR;
    els.daysSummary.textContent = `Semana = ${days} ${dayWord} · Mês ≈ ${formatNumber(monthlyDays, 1)} dias · Ano = ${formatNumber(annualDays, 0)} dias de uso.`;
  }

  function updateSettingsSummary() {
    const days = getDaysPerWeek();
    const dayWord = days === 1 ? "dia" : "dias";

    if (els.settingsSummary) {
      els.settingsSummary.textContent = `Preços, consumo e ${days} ${dayWord} por semana`;
    }

    updateDaysSummary();
  }

  function hideSettingsDialog() {
    if (typeof els.settingsDialog.close === "function") {
      els.settingsDialog.close();
    } else {
      els.settingsDialog.removeAttribute("open");
    }
    document.documentElement.classList.remove("dialog-open");
  }

  function openSettings() {
    if (!els.settingsDialog) return;
    separators = getSeparators(currentLocale());
    syncForm();
    draftUnits = { ...state.units };
    updateDaysSummary();
    document.documentElement.classList.add("dialog-open");
    if (typeof els.settingsDialog.showModal === "function") {
      if (!els.settingsDialog.open) els.settingsDialog.showModal();
    } else {
      els.settingsDialog.setAttribute("open", "");
    }
  }

  function cancelSettings() {
    if (!els.settingsDialog) return;
    syncForm();
    draftUnits = { ...state.units };
    updateDaysSummary();
    hideSettingsDialog();
  }

  function commitSettings() {
    state.values = collectValues();
    state.units = collectUnits();
    draftUnits = { ...state.units };
    render();
    persist();
    hideSettingsDialog();
    showToast("Configurações salvas");
  }

  function updateCurrencySymbols() {
    const symbol = currencySymbol();
    document.querySelectorAll("[data-symbol]").forEach((element) => {
      element.textContent = symbol;
    });
  }

  function currencySymbol() {
    try {
      const parts = new Intl.NumberFormat(currentLocale(), {
        style: "currency",
        currency: state.currency
      }).formatToParts(0);
      const part = parts.find((item) => item.type === "currency");
      return part ? part.value : state.currency;
    } catch (error) {
      return state.currency;
    }
  }

  function formatMoney(value, digits) {
    if (!Number.isFinite(value)) return "—";
    try {
      return new Intl.NumberFormat(currentLocale(), {
        style: "currency",
        currency: state.currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }).format(value);
    } catch (error) {
      return "—";
    }
  }

  function formatMoneyShort(value) {
    if (!Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    if (abs >= 1000000) {
      try {
        return new Intl.NumberFormat(currentLocale(), {
          style: "currency",
          currency: state.currency,
          notation: "compact",
          maximumFractionDigits: 1
        }).format(value);
      } catch (error) {
        return formatMoney(value, 0);
      }
    }
    return formatMoney(value, abs >= 1000 ? 0 : 2);
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return "—";
    try {
      return new Intl.NumberFormat(currentLocale(), {
        maximumFractionDigits: digits
      }).format(value);
    } catch (error) {
      return String(value);
    }
  }

  function formatInputNumber(value, maxDigits) {
    if (!Number.isFinite(value)) return "";
    try {
      return new Intl.NumberFormat(currentLocale(), {
        useGrouping: true,
        maximumFractionDigits: maxDigits
      }).format(value);
    } catch (error) {
      return String(value);
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function applyTheme(theme, save) {
    const explicit = theme === "light" || theme === "dark";
    const resolved = explicit ? theme : (themeMedia.matches ? "dark" : "light");
    state.theme = explicit ? theme : null;
    document.documentElement.dataset.theme = resolved;

    if (els.themeColor) {
      els.themeColor.setAttribute("content", resolved === "dark" ? "#0b1310" : "#f2f6f1");
    }

    const label = resolved === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
    els.themeToggle.setAttribute("aria-label", label);
    els.themeToggle.title = label;

    if (save) persist();
  }

  function loadState() {
    const base = {
      currency: "BRL",
      theme: null,
      values: { ...DEFAULT_VALUES },
      units: { ...DEFAULT_UNITS },
      enabledFuels: { ethanol: true, gasoline: true, electric: true }
    };

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return base;

      if (CURRENCIES[saved.currency]) base.currency = saved.currency;
      if (saved.theme === "light" || saved.theme === "dark") base.theme = saved.theme;

      if (saved.values && typeof saved.values === "object") {
        Object.keys(DEFAULT_VALUES).forEach((key) => {
          if (typeof saved.values[key] === "string") base.values[key] = saved.values[key];
        });
      }

      if (!/^[1-7]$/.test(base.values.daysPerWeek)) base.values.daysPerWeek = "5";

      if (saved.enabledFuels && typeof saved.enabledFuels === "object") {
        ["ethanol", "gasoline", "electric"].forEach((id) => {
          if (typeof saved.enabledFuels[id] === "boolean") base.enabledFuels[id] = saved.enabledFuels[id];
        });
      }

      if (saved.units && typeof saved.units === "object") {
        Object.keys(UNITS_BY_FUEL).forEach((key) => {
          if (UNITS_BY_FUEL[key].includes(saved.units[key])) base.units[key] = saved.units[key];
        });
      }
    } catch (error) {
      return base;
    }

    return base;
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persist, 250);
  }

  function persist() {
    window.clearTimeout(saveTimer);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      return;
    }
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2200);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") return;

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdate();
    });

    window.addEventListener("pageshow", (event) => {
      if (event.persisted) checkForUpdate();
    });

    window.addEventListener("online", () => checkForUpdate());

    window.setInterval(() => {
      if (document.visibilityState === "visible") checkForUpdate();
    }, UPDATE_CHECK_INTERVAL);

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js", { updateViaCache: "none" })
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            if (!worker) return;

            worker.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                showUpdateBanner();
              }
            });
          });

          checkForUpdate();
        })
        .catch(() => {});
    });
  }

  function handleControllerChange() {
    if (!hadController) {
      hadController = true;
      return;
    }

    if (refreshing) return;
    showUpdateBanner();
  }

  function showUpdateBanner() {
    if (!els.updateBanner || !els.updateBanner.hidden) return;
    els.updateBanner.hidden = false;
    document.body.classList.add("has-update-banner");
  }

  function hideUpdateBanner() {
    if (!els.updateBanner) return;
    els.updateBanner.hidden = true;
    document.body.classList.remove("has-update-banner");
  }

  function applyUpdate() {
    hideUpdateBanner();
    refreshing = true;

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          window.setTimeout(() => window.location.reload(), 3000);
          return;
        }

        window.location.reload();
      })
      .catch(() => window.location.reload());
  }

  async function checkForUpdate({ manual = false } = {}) {
    if (!("serviceWorker" in navigator)) {
      if (manual) showToast("Atualização não disponível neste navegador");
      return;
    }

    if (location.protocol === "file:") {
      if (manual) showToast("Atualização indisponível ao abrir o arquivo diretamente");
      return;
    }

    const now = Date.now();
    if (!manual && now - lastUpdateCheck < UPDATE_CHECK_THROTTLE) return;
    lastUpdateCheck = now;

    let registration = null;
    try {
      registration = await navigator.serviceWorker.getRegistration();
    } catch (error) {
      registration = null;
    }

    if (!registration) {
      if (manual) showToast("O modo offline ainda não está ativo");
      return;
    }

    if (registration.waiting && navigator.serviceWorker.controller) {
      showUpdateBanner();
      if (manual) showToast("Atualização disponível");
      return;
    }

    let found = false;
    window.clearTimeout(manualCheckTimer);

    const onUpdateFound = () => {
      found = true;
    };

    registration.addEventListener("updatefound", onUpdateFound);

    try {
      await registration.update();
    } catch (error) {
      registration.removeEventListener("updatefound", onUpdateFound);
      if (manual) showToast("Não foi possível verificar agora");
      return;
    }

    if (!manual) {
      window.setTimeout(() => {
        registration.removeEventListener("updatefound", onUpdateFound);
      }, 5000);
      return;
    }

    manualCheckTimer = window.setTimeout(() => {
      registration.removeEventListener("updatefound", onUpdateFound);
      if (found || registration.installing || registration.waiting) return;
      showToast("Você está na versão mais recente do app");
    }, 2500);
  }
})();
