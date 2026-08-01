/**
 * =============================================================
 * Программа питания — форма, превью A4 landscape, PDF / JPG
 * Этап 1: макет · Этап 2: импорт TXT из Health-Diet
 * =============================================================
 */

(() => {
  "use strict";

  /* ===========================================================
     БЛОК 1. КОНСТАНТЫ
     =========================================================== */
  const MEAL_ORDER = ["breakfast", "snack1", "lunch", "snack2", "dinner"];

  const MEAL_LABELS = {
    breakfast: "Завтрак",
    snack1: "Утренний перекус",
    lunch: "Обед",
    snack2: "Дневной перекус",
    dinner: "Ужин",
  };

  /** Сопоставление заголовков Health-Diet → ключи формы */
  const HD_MEAL_MAP = {
    завтрак: "breakfast",
    "утренний перекус": "snack1",
    "перекус утром": "snack1",
    обед: "lunch",
    "дневной перекус": "snack2",
    полдник: "snack2",
    "перекус днем": "snack2",
    "перекус днём": "snack2",
    ужин: "dinner",
  };

  /** Порядковые для месяца (м.р.) и недели (ж.р.) */
  const MONTH_ORD = [
    "",
    "Первый",
    "Второй",
    "Третий",
    "Четвёртый",
    "Пятый",
    "Шестой",
    "Седьмой",
    "Восьмой",
    "Девятый",
    "Десятый",
    "Одиннадцатый",
    "Двенадцатый",
    "Тринадцатый",
    "Четырнадцатый",
    "Пятнадцатый",
    "Шестнадцатый",
    "Семнадцатый",
    "Восемнадцатый",
    "Девятнадцатый",
    "Двадцатый",
  ];

  const WEEK_ORD = [
    "",
    "Первая",
    "Вторая",
    "Третья",
    "Четвёртая",
    "Пятая",
    "Шестая",
    "Седьмая",
    "Восьмая",
    "Девятая",
    "Десятая",
    "Одиннадцатая",
    "Двенадцатая",
    "Тринадцатая",
    "Четырнадцатая",
    "Пятнадцатая",
    "Шестнадцатая",
    "Семнадцатая",
    "Восемнадцатая",
    "Девятнадцатая",
    "Двадцатая",
  ];

  const FOOTER_BLOCKS = [
    {
      title: "ПИТЬЕВОЙ РЕЖИМ",
      items: [
        "Дневная норма воды — 2 литра.",
        "Каждый час 200–250 мл небольшими глотками.",
        "Основной объём — до 18:30, далее по жажде.",
        "Зелёный чай без сахара входит в объём.",
        "На чашку кофе дополнительно 100 мл воды.",
        "При нагрузках дополнительно 0,2–0,5 л.",
      ],
    },
    {
      title: "РЕЖИМ ПИТАНИЯ",
      items: [
        "Рекомендуемый вес порции — до 250 г.",
        "Если еды больше, разделите порцию.",
        "Вторую часть съешьте позже.",
        "Особенно это касается обедов.",
        "Интервал между приёмами пищи — 3–3,5 часа.",
      ],
    },
    {
      title: "РАЗРЕШЁННЫЕ НАПИТКИ",
      items: [
        "Вода.",
        "Зелёный чай.",
        "Травяной чай.",
        "Ромашковый чай.",
        "Чёрный кофе без сахара.",
        "Тёплая вода с лимоном.",
      ],
    },
  ];

  const AUTHOR_LINE = "Авторская программа питания Ольги Башаран";

  /** Сколько дней-колонок комфортно на одном листе */
  const DAYS_PER_PAGE = 7;

  const DRAFT_STORAGE_KEY = "nutrition-menu-draft-v2";

  /* ===========================================================
     БЛОК 2. DOM
     =========================================================== */
  const els = {
    lastname: document.getElementById("client-lastname"),
    firstname: document.getElementById("client-firstname"),
    genitive: document.getElementById("client-genitive"),
    month: document.getElementById("month-number"),
    week: document.getElementById("week-number"),
    mealToggles: document.getElementById("meal-toggles"),
    daysContainer: document.getElementById("days-container"),
    printRoot: document.getElementById("print-root"),
    btnAddDay: document.getElementById("btn-add-day"),
    btnReset: document.getElementById("btn-reset"),
    btnPdf: document.getElementById("btn-pdf"),
    btnJpg: document.getElementById("btn-jpg"),
    importFile: document.getElementById("import-file"),
    btnImportPaste: document.getElementById("btn-import-paste"),
    importStatus: document.getElementById("import-status"),
    tplDay: document.getElementById("day-card-template"),
    tplMeal: document.getElementById("meal-slot-template"),
    tplProduct: document.getElementById("product-item-template"),
  };

  /* ===========================================================
     БЛОК 3. ПРИЁМЫ ПИЩИ И ПАДЕЖИ
     =========================================================== */
  function getActiveMeals() {
    const active = [];
    MEAL_ORDER.forEach((key) => {
      const input = els.mealToggles.querySelector(`input[data-meal="${key}"]`);
      if (input && input.checked) active.push(key);
    });
    return active;
  }

  function monthPhrase(n) {
    const num = parseInt(n, 10);
    if (!num || num < 1) return "";
    if (MONTH_ORD[num]) return `${MONTH_ORD[num]} месяц сопровождения`;
    return `${num} месяц сопровождения`;
  }

  function weekPhrase(n) {
    const num = parseInt(n, 10);
    if (!num || num < 1) return "";
    if (WEEK_ORD[num]) return `${WEEK_ORD[num]} неделя`;
    return `${num} неделя`;
  }

  function periodLine(month, week) {
    const parts = [monthPhrase(month), weekPhrase(week)].filter(Boolean);
    return parts.join(" · ");
  }

  /** ФИО для шапки: ИМЯ ФАМИЛИЯ в верхнем регистре, как в эталоне */
  function clientHeaderName(lastname, firstname) {
    return [firstname, lastname]
      .filter(Boolean)
      .join(" ")
      .trim()
      .toUpperCase();
  }

  /* ===========================================================
     БЛОК 4. ЭЛЕМЕНТЫ ФОРМЫ
     =========================================================== */
  function addProduct(itemsList, name = "", weight = "") {
    const node = els.tplProduct.content.cloneNode(true);
    const row = node.querySelector(".item-row");
    row.querySelector(".item-name").value = name;
    row.querySelector(".item-weight").value = weight;
    row.querySelector(".btn-remove-item").addEventListener("click", () => {
      row.remove();
      notifyFormChange();
    });
    itemsList.appendChild(node);
  }

  function createMealSlot(mealKey) {
    const node = els.tplMeal.content.cloneNode(true);
    const slot = node.querySelector(".meal-slot");
    slot.dataset.mealKey = mealKey;
    slot.querySelector(".meal-slot__title").textContent = MEAL_LABELS[mealKey];

    const itemsList = slot.querySelector(".items-list");
    slot.querySelector(".btn-add-product").addEventListener("click", () => {
      addProduct(itemsList);
      notifyFormChange();
    });

    return slot;
  }

  function fillMealSlot(slot, mealData) {
    if (!mealData) return;
    slot.querySelector(".meal-dish-name").value = mealData.dishName || "";
    const itemsList = slot.querySelector(".items-list");
    itemsList.innerHTML = "";
    (mealData.products || []).forEach((p) => {
      addProduct(itemsList, p.name || "", p.weight || "");
    });
    slot.querySelector(".meal-comment").value = mealData.comment || "";
  }

  function collectMealFromSlot(slot) {
    const products = [];
    slot.querySelectorAll(".item-row").forEach((row) => {
      const name = row.querySelector(".item-name").value.trim();
      const weight = row.querySelector(".item-weight").value.trim();
      if (!name && !weight) return;
      products.push({ name, weight });
    });
    return {
      dishName: slot.querySelector(".meal-dish-name").value.trim(),
      products,
      comment: slot.querySelector(".meal-comment").value.trim(),
    };
  }

  function collectMealFromSlotDraft(slot) {
    const products = [];
    slot.querySelectorAll(".item-row").forEach((row) => {
      products.push({
        name: row.querySelector(".item-name").value,
        weight: row.querySelector(".item-weight").value,
      });
    });
    return {
      dishName: slot.querySelector(".meal-dish-name").value,
      products,
      comment: slot.querySelector(".meal-comment").value,
    };
  }

  function collectMealSlotsData(dayCard) {
    const data = {};
    dayCard.querySelectorAll(".meal-slot").forEach((slot) => {
      data[slot.dataset.mealKey] = collectMealFromSlotDraft(slot);
    });
    return data;
  }

  function rebuildMealSlots(dayCard) {
    const container = dayCard.querySelector(".day-card__meals");
    const prev = collectMealSlotsData(dayCard);
    container.innerHTML = "";
    getActiveMeals().forEach((key) => {
      const slot = createMealSlot(key);
      container.appendChild(slot);
      if (prev[key]) fillMealSlot(slot, prev[key]);
    });
  }

  function renumberDays() {
    els.daysContainer.querySelectorAll(".day-card").forEach((card, i) => {
      card.querySelector(".day-card__num").textContent = String(i + 1);
    });
  }

  function addDay(prefillMeals) {
    const node = els.tplDay.content.cloneNode(true);
    const card = node.querySelector(".day-card");

    card.querySelector(".btn-remove-day").addEventListener("click", () => {
      card.remove();
      if (!els.daysContainer.children.length) addDay();
      renumberDays();
      notifyFormChange();
    });

    rebuildMealSlots(card);

    if (prefillMeals) {
      card.querySelectorAll(".meal-slot").forEach((slot) => {
        fillMealSlot(slot, prefillMeals[slot.dataset.mealKey]);
      });
    }

    els.daysContainer.appendChild(card);
    renumberDays();
    return card;
  }

  /* ===========================================================
     БЛОК 5. СБОР ДАННЫХ
     =========================================================== */
  function collectFormData() {
    const lastname = els.lastname.value.trim();
    const firstname = els.firstname.value.trim();
    // Читаем поле заново из DOM — надёжнее при кэше/перезагрузке
    const genitiveEl = document.getElementById("client-genitive");
    const genitive = (genitiveEl ? genitiveEl.value : "").trim();
    const month = els.month.value.trim();
    const week = els.week.value.trim();
    const activeMeals = getActiveMeals();

    const days = [];
    els.daysContainer.querySelectorAll(".day-card").forEach((card, i) => {
      const meals = {};
      card.querySelectorAll(".meal-slot").forEach((slot) => {
        meals[slot.dataset.mealKey] = collectMealFromSlot(slot);
      });
      days.push({ dayIndex: i + 1, meals });
    });

    return { lastname, firstname, genitive, month, week, activeMeals, days };
  }

  /* ===========================================================
     БЛОК 6. РЕНДЕР ЯЧЕЙКИ И ТАБЛИЦЫ
     =========================================================== */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Нормализация граммовки к виду «40 г» */
  function formatWeight(weight) {
    const w = String(weight).trim();
    if (!w) return "";
    if (/[а-яА-Яa-zA-Z]/.test(w)) return w;
    return `${w} г`;
  }

  function renderMealCell(mealData) {
    if (!mealData) return '<div class="cell-empty"></div>';

    const parts = [];

    if (mealData.dishName) {
      parts.push(`<div class="cell-dish">${escapeHtml(mealData.dishName)}</div>`);
    }

    (mealData.products || []).forEach((p) => {
      const name = escapeHtml(p.name || "");
      const weight = escapeHtml(formatWeight(p.weight || ""));
      if (!name && !weight) return;
      const line = name && weight ? `${name} ${weight}` : name || weight;
      parts.push(`<div class="cell-product">${line}</div>`);
    });

    if (mealData.comment) {
      parts.push(`<div class="cell-comment">${escapeHtml(mealData.comment)}</div>`);
    }

    if (!parts.length) return '<div class="cell-empty"></div>';
    return parts.join("");
  }

  function buildHeaderHtml(data) {
    const name = clientHeaderName(data.lastname, data.firstname);
    const period = periodLine(data.month, data.week);
    return `
      <p class="sheet__name">${escapeHtml(name)}</p>
      <p class="sheet__program">Программа питания</p>
      <p class="sheet__period">${escapeHtml(period)}</p>
    `;
  }

  function buildFooterHtml(data) {
    const cards = FOOTER_BLOCKS.map(
      (block) => `
      <div class="footer-card">
        <h4 class="footer-card__title">${escapeHtml(block.title)}</h4>
        <ul class="footer-card__list">
          ${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>`
    ).join("");

    // Только из поля «родительный падеж»; имя/фамилию сюда НЕ подставляем
    const personal = (data.genitive || "").trim();
    const personalHtml = personal
      ? `<p class="sheet-sign__personal">Программа составлена индивидуально для ${escapeHtml(personal)}.</p>`
      : "";

    return `
      <div class="sheet-footer">${cards}</div>
      <div class="sheet-sign">
        <p class="sheet-sign__author">${escapeHtml(AUTHOR_LINE)}</p>
        ${personalHtml}
      </div>
    `;
  }

  /**
   * Таблица: строки = приёмы пищи, столбцы = дни
   */
  function buildTableHtml(data, daySlice) {
    const headDays = daySlice
      .map((d) => `<th>День ${d.dayIndex}</th>`)
      .join("");

    const rows = data.activeMeals
      .map((mealKey) => {
        const cells = daySlice
          .map(
            (day) =>
              `<td class="col-day">${renderMealCell(day.meals[mealKey])}</td>`
          )
          .join("");
        return `
          <tr>
            <td class="col-meal">${escapeHtml(MEAL_LABELS[mealKey])}</td>
            ${cells}
          </tr>`;
      })
      .join("");

    return `
      <table class="menu-table">
        <thead>
          <tr>
            <th class="col-meal">Приём пищи</th>
            ${headDays}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function createSheet(data, daySlice, { withFooter }) {
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.innerHTML =
      buildHeaderHtml(data) +
      buildTableHtml(data, daySlice) +
      (withFooter ? buildFooterHtml(data) : "");
    return sheet;
  }

  function fitFontSize(sheet) {
    const min = 7.5;
    const max = 12;
    let size = max;
    sheet.style.fontSize = size + "px";

    while (size > min) {
      const table = sheet.querySelector(".menu-table");
      if (!table) break;
      if (table.scrollWidth <= sheet.clientWidth + 1) break;
      size -= 0.5;
      sheet.style.fontSize = size + "px";
    }
  }

  function paginate(data) {
    const pages = [];
    const days = data.days.length ? data.days : [];
    if (!days.length) return pages;

    for (let i = 0; i < days.length; i += DAYS_PER_PAGE) {
      const slice = days.slice(i, i + DAYS_PER_PAGE);
      const isLast = i + DAYS_PER_PAGE >= days.length;
      const sheet = createSheet(data, slice, { withFooter: isLast });
      pages.push(sheet);
    }

    return pages;
  }

  function renderPreview() {
    const data = collectFormData();
    els.printRoot.innerHTML = "";

    if (!data.activeMeals.length) {
      els.printRoot.innerHTML =
        '<p style="color:#666">Выберите хотя бы один приём пищи.</p>';
      return data;
    }

    if (!data.days.length) {
      els.printRoot.innerHTML =
        '<p style="color:#666">Добавьте хотя бы один день.</p>';
      return data;
    }

    const measureHost = document.createElement("div");
    measureHost.style.cssText =
      "position:absolute;left:-9999px;top:0;visibility:hidden;";
    document.body.appendChild(measureHost);

    const pages = paginate(data);
    pages.forEach((sheet) => {
      measureHost.appendChild(sheet);
      fitFontSize(sheet);
      const clone = sheet.cloneNode(true);
      clone.style.fontSize = sheet.style.fontSize;
      els.printRoot.appendChild(clone);
    });

    measureHost.remove();
    return data;
  }

  /* ===========================================================
     БЛОК 7. PDF / JPG
     =========================================================== */
  function downloadPdf() {
    renderPreview();
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 100);
    });
  }

  async function downloadJpg() {
    renderPreview();

    if (typeof html2canvas !== "function") {
      alert("Библиотека html2canvas не загрузилась. Проверьте интернет.");
      return;
    }

    const sheets = els.printRoot.querySelectorAll(".sheet");
    if (!sheets.length) {
      alert("Нет данных для сохранения.");
      return;
    }

    const data = collectFormData();
    const baseName =
      [data.lastname, data.firstname, data.month ? `мес-${data.month}` : "", data.week ? `нед-${data.week}` : ""]
        .filter(Boolean)
        .join("_") || "programma-pitaniya";

    for (let i = 0; i < sheets.length; i++) {
      const canvas = await html2canvas(sheets[i], {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      const suffix = sheets.length > 1 ? `_стр${i + 1}` : "";
      link.download = `${baseName}${suffix}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      if (sheets.length > 1) await new Promise((r) => setTimeout(r, 300));
    }
  }

  /* ===========================================================
     БЛОК 8. ЧЕРНОВИК
     =========================================================== */
  function collectDraftData() {
    const mealsEnabled = {};
    MEAL_ORDER.forEach((key) => {
      const input = els.mealToggles.querySelector(`input[data-meal="${key}"]`);
      mealsEnabled[key] = input ? input.checked : true;
    });

    const days = [];
    els.daysContainer.querySelectorAll(".day-card").forEach((card) => {
      const meals = {};
      card.querySelectorAll(".meal-slot").forEach((slot) => {
        meals[slot.dataset.mealKey] = collectMealFromSlotDraft(slot);
      });
      days.push({ meals });
    });

    return {
      version: 2,
      lastname: els.lastname.value,
      firstname: els.firstname.value,
      genitive: (document.getElementById("client-genitive") || {}).value || "",
      month: els.month.value,
      week: els.week.value,
      mealsEnabled,
      days,
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(collectDraftData()));
    } catch (err) {
      console.warn("Не удалось сохранить черновик:", err);
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem("nutrition-menu-draft-v1");
    } catch (err) {
      console.warn("Не удалось удалить черновик:", err);
    }
  }

  function loadDraft() {
    let raw;
    try {
      raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    } catch (err) {
      return false;
    }
    if (!raw) return false;

    let draft;
    try {
      draft = JSON.parse(raw);
    } catch (err) {
      clearDraft();
      return false;
    }

    els.lastname.value = draft.lastname || "";
    els.firstname.value = draft.firstname || "";
    const genitiveEl = document.getElementById("client-genitive");
    if (genitiveEl) genitiveEl.value = draft.genitive || "";
    els.month.value = draft.month || "";
    els.week.value = draft.week || "";

    if (draft.mealsEnabled) {
      MEAL_ORDER.forEach((key) => {
        const input = els.mealToggles.querySelector(`input[data-meal="${key}"]`);
        if (!input || input.disabled) return;
        if (typeof draft.mealsEnabled[key] === "boolean") {
          input.checked = draft.mealsEnabled[key];
        }
      });
    }

    els.daysContainer.innerHTML = "";
    const days =
      Array.isArray(draft.days) && draft.days.length
        ? draft.days
        : [{ meals: {} }];

    days.forEach((day) => addDay(day.meals || {}));
    return true;
  }

  function notifyFormChange() {
    renderPreview();
    saveDraft();
  }

  /* ===========================================================
     БЛОК 9. ИМПОРТ TXT ИЗ HEALTH-DIET
     =========================================================== */
  function setImportStatus(message, kind) {
    if (!els.importStatus) return;
    els.importStatus.textContent = message || "";
    els.importStatus.className =
      "import-status" +
      (kind === "ok" ? " import-status--ok" : "") +
      (kind === "err" ? " import-status--err" : "");
  }

  function normalizeHdMealTitle(raw) {
    return String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function mapHdMealKey(title) {
    const n = normalizeHdMealTitle(title);
    if (HD_MEAL_MAP[n]) return HD_MEAL_MAP[n];
    // Частичные совпадения
    if (n.includes("утренн") && n.includes("перекус")) return "snack1";
    if (n.includes("дневн") && n.includes("перекус")) return "snack2";
    if (n === "перекус") return "snack1";
    if (n.includes("завтрак")) return "breakfast";
    if (n.includes("обед")) return "lunch";
    if (n.includes("ужин")) return "dinner";
    if (n.includes("полдник")) return "snack2";
    return null;
  }

  /**
   * Парсит экспорт Health-Diet (.txt).
   * Возвращает { days: [{ date, meals }], skippedMeals: string[] }
   */
  function parseHealthDietTxt(text) {
    const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/);
    const days = [];
    const skippedMeals = new Set();

    let currentDay = null;
    let currentMealKey = null;
    let inNutrients = false;

    const dayRe = /^#\s*Дневник питания за\s+(.+)$/i;
    const mealRe = /^##\s+(.+?)\s*-\s*ккал\b/i;
    const productRe = /^\s*\d+\.\s*(.+?):\s*([\d.,]+)\s*г\b/i;
    const metaRe = /^##\s*(Цель|Вес|Возраст|Рост)\b/i;

    function ensureDay() {
      if (!currentDay) {
        currentDay = { date: "", meals: {} };
        days.push(currentDay);
      }
      return currentDay;
    }

    function ensureMeal(key) {
      const day = ensureDay();
      if (!day.meals[key]) {
        day.meals[key] = { dishName: "", products: [], comment: "" };
      }
      return day.meals[key];
    }

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const dayMatch = trimmed.match(dayRe);
      if (dayMatch) {
        currentDay = { date: dayMatch[1].trim(), meals: {} };
        days.push(currentDay);
        currentMealKey = null;
        inNutrients = false;
        return;
      }

      if (/^Нутриенты:/i.test(trimmed) || /^Итого за день/i.test(trimmed)) {
        currentMealKey = null;
        inNutrients = true;
        return;
      }

      if (metaRe.test(trimmed)) {
        currentMealKey = null;
        inNutrients = true;
        return;
      }

      if (inNutrients && !trimmed.startsWith("##") && !trimmed.startsWith("#")) {
        return;
      }

      const mealMatch = trimmed.match(mealRe);
      if (mealMatch) {
        inNutrients = false;
        const title = mealMatch[1].trim();
        const key = mapHdMealKey(title);
        if (!key) {
          skippedMeals.add(title);
          currentMealKey = null;
          return;
        }
        currentMealKey = key;
        ensureMeal(key);
        return;
      }

      if (!currentMealKey) return;

      const productMatch = trimmed.match(productRe);
      if (productMatch) {
        const name = productMatch[1].trim();
        const amount = productMatch[2].replace(",", ".").trim();
        const weight = `${amount} г`;
        ensureMeal(currentMealKey).products.push({ name, weight });
      }
    });

    // Убрать дни без продуктов
    const nonEmptyDays = days.filter((day) =>
      Object.values(day.meals).some((m) => m.products && m.products.length)
    );

    return {
      days: nonEmptyDays,
      skippedMeals: Array.from(skippedMeals),
    };
  }

  function applyHealthDietImport(parsed) {
    if (!parsed.days.length) {
      throw new Error("В файле не найдено ни одного дня с продуктами.");
    }

    const usedMeals = new Set();
    parsed.days.forEach((day) => {
      Object.keys(day.meals).forEach((key) => {
        if (day.meals[key].products.length) usedMeals.add(key);
      });
    });

    // Перекусы включаем только если они есть в импорте
    const snack1 = els.mealToggles.querySelector('input[data-meal="snack1"]');
    const snack2 = els.mealToggles.querySelector('input[data-meal="snack2"]');
    if (snack1) snack1.checked = usedMeals.has("snack1");
    if (snack2) snack2.checked = usedMeals.has("snack2");

    els.daysContainer.innerHTML = "";
    parsed.days.forEach((day) => {
      addDay(day.meals);
    });

    notifyFormChange();

    const snackNote = [];
    if (!usedMeals.has("snack1")) snackNote.push("утренний перекус выключен");
    if (!usedMeals.has("snack2")) snackNote.push("дневной перекус выключен");

    let msg = `Импортировано дней: ${parsed.days.length}`;
    if (snackNote.length) msg += ` (${snackNote.join(", ")})`;
    if (parsed.skippedMeals.length) {
      msg += `. Пропущены приёмы: ${parsed.skippedMeals.join(", ")}`;
    }
    return msg;
  }

  async function importFromText(text, sourceLabel) {
    try {
      const hasContent = els.daysContainer.querySelector(".item-name, .meal-dish-name");
      const filled =
        hasContent &&
        Array.from(els.daysContainer.querySelectorAll(".item-name, .meal-dish-name")).some(
          (el) => el.value.trim()
        );

      if (filled) {
        const ok = confirm(
          "Импорт заменит текущие дни меню. Данные клиента (ФИО, месяц, неделя) сохранятся. Продолжить?"
        );
        if (!ok) {
          setImportStatus("Импорт отменён.", "");
          return;
        }
      }

      const parsed = parseHealthDietTxt(text);
      const msg = applyHealthDietImport(parsed);
      setImportStatus(msg + (sourceLabel ? ` ← ${sourceLabel}` : ""), "ok");
    } catch (err) {
      console.error(err);
      setImportStatus(err.message || "Ошибка импорта.", "err");
    }
  }

  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importFromText(String(reader.result || ""), file.name);
    };
    reader.onerror = () => {
      setImportStatus("Не удалось прочитать файл.", "err");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImportPaste() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        const manual = prompt("Вставьте сюда текст экспорта Health-Diet (txt):");
        if (manual == null) return;
        await importFromText(manual, "буфер");
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setImportStatus("Буфер обмена пуст.", "err");
        return;
      }
      await importFromText(text, "буфер");
    } catch (err) {
      const manual = prompt("Не удалось прочитать буфер. Вставьте текст экспорта вручную:");
      if (manual == null) return;
      await importFromText(manual, "вставка");
    }
  }

  /* ===========================================================
     БЛОК 10. СБРОС И ИНИЦИАЛИЗАЦИЯ
     =========================================================== */
  function resetAll() {
    els.lastname.value = "";
    els.firstname.value = "";
    const genitiveEl = document.getElementById("client-genitive");
    if (genitiveEl) genitiveEl.value = "";
    els.month.value = "";
    els.week.value = "";

    els.mealToggles.querySelectorAll("input[data-meal]").forEach((input) => {
      input.checked = true;
    });

    els.daysContainer.innerHTML = "";
    addDay();
    clearDraft();
    renderPreview();
  }

  function syncAllDayMealSlots() {
    els.daysContainer.querySelectorAll(".day-card").forEach(rebuildMealSlots);
  }

  function init() {
    // На случай, если DOM ещё не был готов при объявлении els
    els.genitive = document.getElementById("client-genitive");

    els.btnAddDay.addEventListener("click", () => {
      addDay();
      notifyFormChange();
    });
    els.btnReset.addEventListener("click", () => {
      if (confirm("Сбросить все данные и дни?")) resetAll();
    });
    els.btnPdf.addEventListener("click", () => downloadPdf());
    els.btnJpg.addEventListener("click", () => downloadJpg());

    if (els.importFile) {
      els.importFile.addEventListener("change", () => {
        const file = els.importFile.files && els.importFile.files[0];
        handleImportFile(file);
        els.importFile.value = "";
      });
    }
    if (els.btnImportPaste) {
      els.btnImportPaste.addEventListener("click", () => handleImportPaste());
    }

    els.mealToggles.addEventListener("change", () => {
      syncAllDayMealSlots();
      notifyFormChange();
    });

    document.querySelector(".app-main").addEventListener("input", () => {
      notifyFormChange();
    });

    window.addEventListener("beforeunload", () => {
      saveDraft();
    });

    if (!loadDraft()) {
      addDay();
    }
    renderPreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
