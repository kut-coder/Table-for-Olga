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

  /** Сопоставление заголовков Health-Diet → ключи формы (unicode-escape — надёжнее кодировок) */
  const HD_MEAL_MAP = {};
  HD_MEAL_MAP["\u0437\u0430\u0432\u0442\u0440\u0430\u043a"] = "breakfast"; // завтрак
  HD_MEAL_MAP["\u0443\u0442\u0440\u0435\u043d\u043d\u0438\u0439 \u043f\u0435\u0440\u0435\u043a\u0443\u0441"] =
    "snack1"; // утренний перекус
  HD_MEAL_MAP["\u043e\u0431\u0435\u0434"] = "lunch"; // обед
  HD_MEAL_MAP["\u0434\u043d\u0435\u0432\u043d\u043e\u0439 \u043f\u0435\u0440\u0435\u043a\u0443\u0441"] =
    "snack2"; // дневной перекус
  HD_MEAL_MAP["\u043f\u043e\u043b\u0434\u043d\u0438\u043a"] = "snack2"; // полдник
  HD_MEAL_MAP["\u0443\u0436\u0438\u043d"] = "dinner"; // ужин


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

  /** Размер листа A4 landscape в px (как в CSS --a4-w / --a4-h) */
  const SHEET_W = 1123;
  const SHEET_H = 794;

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
    if (!mealData) return "";

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

    return parts.join("");
  }

  function mealLabelHtml(mealKey) {
    if (mealKey === "snack1") return "Утренний<br>перекус";
    if (mealKey === "snack2") return "Дневной<br>перекус";
    return escapeHtml(MEAL_LABELS[mealKey]);
  }

  function buildHeaderHtml(data) {
    const name = clientHeaderName(data.lastname, data.firstname);
    const period = periodLine(data.month, data.week);
    return `
      <p class="sheet__name">${escapeHtml(name)}</p>
      <p class="sheet__program">Индивидуальная программа питания</p>
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
            <td class="col-meal">${mealLabelHtml(mealKey)}</td>
            ${cells}
          </tr>`;
      })
      .join("");

    return `
      <table class="menu-table">
        <thead>
          <tr>
            <th class="col-meal">Приём<br>пищи</th>
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

  function sheetFits(sheet) {
    const table = sheet.querySelector(".menu-table");
    const widthOk = !table || table.scrollWidth <= sheet.clientWidth + 2;
    const heightOk = sheet.scrollHeight <= sheet.clientHeight + 2;
    return widthOk && heightOk;
  }

  /**
   * Ширина столбца «Приём пищи» = ширина слова «Утренний» + padding 2px слева/справа.
   * Пересчитывается после смены font-size листа.
   */
  function applyMealColumnWidth(sheet) {
    const sample =
      sheet.querySelector(".menu-table tbody td.col-meal") ||
      sheet.querySelector(".menu-table .col-meal");
    if (!sample) return;

    const cs = getComputedStyle(sample);
    const probe = document.createElement("span");
    probe.textContent = "Утренний";
    probe.style.cssText = [
      "position:absolute",
      "visibility:hidden",
      "left:0",
      "top:0",
      "white-space:nowrap",
      "font-family:" + cs.fontFamily,
      "font-size:" + cs.fontSize,
      "font-weight:" + cs.fontWeight,
      "font-style:" + cs.fontStyle,
      "letter-spacing:" + cs.letterSpacing,
    ].join(";");
    document.body.appendChild(probe);
    const textW = Math.ceil(probe.getBoundingClientRect().width);
    probe.remove();

    const widthPx = Math.max(textW + 6, 1); // padding 2+2 и запас под границы ячейки
    sheet.querySelectorAll(".menu-table .col-meal").forEach((el) => {
      el.style.width = widthPx + "px";
      el.style.minWidth = widthPx + "px";
      el.style.maxWidth = widthPx + "px";
    });
  }

  /**
   * Подгоняет весь документ в один лист A4 landscape:
   * шрифт → компактный режим → zoom (Chrome/Edge).
   */
  function fitSheetToOnePage(sheet) {
    sheet.classList.remove("sheet--compact");
    sheet.style.zoom = "";
    sheet.style.width = SHEET_W + "px";
    sheet.style.height = SHEET_H + "px";
    sheet.style.minHeight = SHEET_H + "px";
    sheet.style.maxHeight = SHEET_H + "px";
    sheet.style.overflow = "hidden";

    let size = 12;
    const min = 6;
    sheet.style.fontSize = size + "px";
    applyMealColumnWidth(sheet);

    while (size > min && !sheetFits(sheet)) {
      size -= 0.5;
      sheet.style.fontSize = size + "px";
      applyMealColumnWidth(sheet);
    }

    if (!sheetFits(sheet)) {
      sheet.classList.add("sheet--compact");
      size = Math.min(size, 9);
      sheet.style.fontSize = size + "px";
      applyMealColumnWidth(sheet);
      while (size > min && !sheetFits(sheet)) {
        size -= 0.5;
        sheet.style.fontSize = size + "px";
        applyMealColumnWidth(sheet);
      }
    }

    if (!sheetFits(sheet)) {
      const scaleW = sheet.clientWidth / Math.max(sheet.scrollWidth, 1);
      const scaleH = sheet.clientHeight / Math.max(sheet.scrollHeight, 1);
      const zoom = Math.max(0.55, Math.min(1, scaleW, scaleH) * 0.98);
      sheet.style.zoom = String(zoom);
    }

    return {
      fontSize: sheet.style.fontSize,
      zoom: sheet.style.zoom || "1",
      compact: sheet.classList.contains("sheet--compact"),
      fits: sheetFits(sheet),
      sheets: 1,
    };
  }

  /** Всегда один лист: все дни + нижние блоки */
  function buildPages(data) {
    const days = data.days.length ? data.days : [];
    if (!days.length) return [];
    return [createSheet(data, days, { withFooter: true })];
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

    const pages = buildPages(data);
    pages.forEach((sheet) => {
      measureHost.appendChild(sheet);
      const fit = fitSheetToOnePage(sheet);
      const clone = sheet.cloneNode(true);
      clone.style.fontSize = fit.fontSize;
      clone.style.zoom = fit.zoom === "1" ? "" : fit.zoom;
      clone.style.width = SHEET_W + "px";
      clone.style.height = SHEET_H + "px";
      clone.style.minHeight = SHEET_H + "px";
      clone.style.maxHeight = SHEET_H + "px";
      clone.style.overflow = "hidden";
      if (fit.compact) clone.classList.add("sheet--compact");
      els.printRoot.appendChild(clone);
    });

    measureHost.remove();
    return data;
  }

  /** Проверка: в превью ровно один лист, контент внутри A4 */
  function verifySinglePrintPage() {
    const sheets = els.printRoot.querySelectorAll(".sheet");
    if (sheets.length !== 1) {
      return { ok: false, reason: `листов: ${sheets.length}, ожидался 1` };
    }
    const sheet = sheets[0];
    const overflowH = sheet.scrollHeight - sheet.clientHeight;
    const table = sheet.querySelector(".menu-table");
    const overflowW = table ? table.scrollWidth - sheet.clientWidth : 0;
    const ok = overflowH <= 2 && overflowW <= 2;
    return {
      ok,
      sheets: sheets.length,
      overflowH,
      overflowW,
      fontSize: sheet.style.fontSize,
      zoom: sheet.style.zoom || "1",
      compact: sheet.classList.contains("sheet--compact"),
      reason: ok ? "OK" : `переполнение H=${overflowH}px W=${overflowW}px`,
    };
  }

  /* ===========================================================
     БЛОК 7. PDF / JPG
     =========================================================== */
  function downloadPdf() {
    renderPreview();
    const check = verifySinglePrintPage();
    if (!check.ok) {
      console.warn("[PDF] лист не уместился идеально:", check);
    }
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 150);
    });
  }

  async function downloadJpg() {
    renderPreview();

    if (typeof html2canvas !== "function") {
      alert("Библиотека html2canvas не загрузилась. Проверьте интернет.");
      return;
    }

    const sheet = els.printRoot.querySelector(".sheet");
    if (!sheet) {
      alert("Нет данных для сохранения.");
      return;
    }

    const check = verifySinglePrintPage();
    if (!check.ok) {
      console.warn("[JPG] лист не уместился идеально:", check);
    }

    const data = collectFormData();
    const baseName =
      [
        data.lastname,
        data.firstname,
        data.month ? `мес-${data.month}` : "",
        data.week ? `нед-${data.week}` : "",
      ]
        .filter(Boolean)
        .join("_") || "programma-pitaniya";

    const prevBorder = sheet.style.border;
    sheet.style.border = "none";

    try {
      const canvas = await html2canvas(sheet, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        width: SHEET_W,
        height: SHEET_H,
        windowWidth: SHEET_W,
        windowHeight: SHEET_H,
        onclone: (_doc, cloned) => {
          cloned.style.border = "none";
          cloned.style.width = SHEET_W + "px";
          cloned.style.height = SHEET_H + "px";
          cloned.style.maxHeight = SHEET_H + "px";
          cloned.style.overflow = "hidden";
          cloned.style.background = "#ffffff";
          cloned.style.fontFamily = 'Georgia, "Times New Roman", Times, serif';
          if (sheet.style.zoom) cloned.style.zoom = sheet.style.zoom;
          if (sheet.classList.contains("sheet--compact")) {
            cloned.classList.add("sheet--compact");
          }
          cloned.querySelectorAll(".menu-table thead th").forEach((el) => {
            el.style.background = "#2e5e3e";
            el.style.color = "#ffffff";
          });
          cloned.querySelectorAll(".menu-table .col-meal").forEach((el) => {
            el.style.background = "#4f8b5c";
            el.style.color = "#ffffff";
          });
          cloned.querySelectorAll(".menu-table thead th.col-meal").forEach((el) => {
            el.style.borderBottomColor = "#ffffff";
          });
          cloned.querySelectorAll(".menu-table tbody td.col-meal").forEach((el) => {
            el.style.borderTopColor = "#ffffff";
            el.style.borderBottomColor = "#ffffff";
          });
          cloned.querySelectorAll(".menu-table tbody tr").forEach((tr, idx) => {
            tr.querySelectorAll(".col-day").forEach((el) => {
              el.style.background = idx % 2 === 0 ? "#f4f9f5" : "#e7f2e9";
              el.style.color = "#1f3a28";
            });
          });
          cloned.querySelectorAll(".footer-card__title").forEach((el) => {
            el.style.background = "#2e5e3e";
            el.style.color = "#ffffff";
          });
          cloned.querySelectorAll(".footer-card").forEach((el) => {
            el.style.background = "#f4f9f5";
            el.style.borderColor = "#4f8b5c";
          });
          cloned
            .querySelectorAll(
              ".sheet__name, .sheet-sign__author, .sheet-sign__personal, .cell-dish"
            )
            .forEach((el) => {
              el.style.color = "#2e5e3e";
            });
          cloned.querySelectorAll(".sheet__program, .sheet__period").forEach((el) => {
            el.style.color = "#4f8b5c";
          });
        },
      });

      const link = document.createElement("a");
      link.download = `${baseName}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } finally {
      sheet.style.border = prevBorder;
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
  // Русские маркеры только через \uXXXX — не зависят от кодировки файла скрипта
  const HD = {
    dnevnik: "\u0414\u043d\u0435\u0432\u043d\u0438\u043a", // Дневник
    pitaniya: "\u043f\u0438\u0442\u0430\u043d\u0438\u044f", // питания
    za: "\u0437\u0430", // за
    kkal: "\u043a\u043a\u0430\u043b", // ккал
    gram: "\u0433", // г
    nutrienty: "\u041d\u0443\u0442\u0440\u0438\u0435\u043d\u0442\u044b", // Нутриенты
    itogo: "\u0418\u0442\u043e\u0433\u043e", // Итого
    utrenn: "\u0443\u0442\u0440\u0435\u043d\u043d", // утренн
    dnevn: "\u0434\u043d\u0435\u0432\u043d", // дневн
    perekus: "\u043f\u0435\u0440\u0435\u043a\u0443\u0441", // перекус
    zavtrak: "\u0437\u0430\u0432\u0442\u0440\u0430\u043a", // завтрак
    obed: "\u043e\u0431\u0435\u0434", // обед
    uzhin: "\u0443\u0436\u0438\u043d", // ужин
    poldnik: "\u043f\u043e\u043b\u0434\u043d\u0438\u043a", // полдник
  };

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
    if (n.includes(HD.utrenn) && n.includes(HD.perekus)) return "snack1";
    if (n.includes(HD.dnevn) && n.includes(HD.perekus)) return "snack2";
    if (n === HD.perekus) return "snack1";
    if (n.includes(HD.zavtrak)) return "breakfast";
    if (n.includes(HD.obed)) return "lunch";
    if (n.includes(HD.uzhin)) return "dinner";
    if (n.includes(HD.poldnik)) return "snack2";
    return null;
  }

  function stripKkalSuffix(title) {
    const lower = title.toLowerCase();
    const idx = lower.indexOf(HD.kkal);
    if (idx === -1) return title.trim();
    return title
      .slice(0, idx)
      .replace(/[\s\-–—−~:]+$/g, "")
      .trim();
  }

  /** Разбор заголовка ## ПРИЁМ ... */
  function parseMealHeaderLine(trimmed) {
    if (!trimmed.startsWith("##")) return null;
    const body = trimmed.slice(2).trim();
    if (!body) return null;
    const metaNames = [
      "\u0426\u0435\u043b\u044c", // Цель
      "\u0412\u0435\u0441", // Вес
      "\u0412\u043e\u0437\u0440\u0430\u0441\u0442", // Возраст
      "\u0420\u043e\u0441\u0442", // Рост
    ];
    const bodyLower = body.toLowerCase();
    if (metaNames.some((n) => bodyLower.indexOf(n.toLowerCase()) === 0)) {
      return { meta: true };
    }
    const title = stripKkalSuffix(body);
    if (!title) return null;
    const hasKkal = bodyLower.indexOf(HD.kkal) !== -1;
    const key = mapHdMealKey(title);
    if (key) return { key, title };
    if (hasKkal) return { key: null, title, unknown: true };
    return null;
  }

  /** Разбор строки продукта: «1. Название: 50 г, ...» */
  function parseProductLine(trimmed) {
    const numMatch = trimmed.match(/^(\d+)[.)]\s*(.+)$/);
    if (!numMatch) return null;
    const rest = numMatch[2].trim();
    const unitRe = new RegExp(
      "^(.+):\\s*([\\d.,]+)\\s*(?:" +
        HD.gram +
        "\u0440|" +
        HD.gram +
        "|g|gr)(?=\\s|,|$)",
      "i"
    );
    const m = rest.match(unitRe);
    if (!m) return null;
    return {
      name: m[1].trim(),
      weight: `${m[2].replace(",", ".")} ${HD.gram}`,
    };
  }

  /**
   * Парсит экспорт Health-Diet (.txt).
   * Возвращает { days, skippedMeals, stats }
   */
  function parseHealthDietTxt(text) {
    const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/);
    const days = [];
    const skippedMeals = new Set();
    const stats = {
      lines: lines.length,
      dayHeaders: 0,
      mealHeaders: 0,
      products: 0,
    };

    let currentDay = null;
    let currentMealKey = null;
    let inNutrients = false;

    const dayRe = new RegExp(
      "^#\\s*" +
        HD.dnevnik +
        "\\s+" +
        HD.pitaniya +
        "\\s+" +
        HD.za +
        "\\s+(.+)$",
      "i"
    );

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
      const trimmed = line.replace(/\u00A0/g, " ").trim();
      if (!trimmed) return;

      const dayMatch = trimmed.match(dayRe);
      if (dayMatch) {
        currentDay = { date: dayMatch[1].trim(), meals: {} };
        days.push(currentDay);
        currentMealKey = null;
        inNutrients = false;
        stats.dayHeaders += 1;
        return;
      }

      const low = trimmed.toLowerCase();
      if (
        low.indexOf(HD.nutrienty.toLowerCase()) === 0 ||
        low.indexOf(HD.itogo.toLowerCase()) === 0
      ) {
        currentMealKey = null;
        inNutrients = true;
        return;
      }

      if (inNutrients && !trimmed.startsWith("##") && !trimmed.startsWith("#")) {
        return;
      }

      const mealInfo = parseMealHeaderLine(trimmed);
      if (mealInfo) {
        if (mealInfo.meta) {
          currentMealKey = null;
          inNutrients = true;
          return;
        }
        stats.mealHeaders += 1;
        if (mealInfo.unknown || !mealInfo.key) {
          skippedMeals.add(mealInfo.title);
          currentMealKey = null;
          return;
        }
        inNutrients = false;
        currentMealKey = mealInfo.key;
        ensureMeal(mealInfo.key);
        return;
      }

      if (!currentMealKey) return;

      const product = parseProductLine(trimmed);
      if (product) {
        ensureMeal(currentMealKey).products.push(product);
        stats.products += 1;
      }
    });

    const nonEmptyDays = days.filter((day) =>
      Object.values(day.meals).some((m) => m.products && m.products.length)
    );

    return {
      days: nonEmptyDays,
      skippedMeals: Array.from(skippedMeals),
      stats,
    };
  }

  function looksLikeHealthDietTxt(text) {
    const t = String(text || "").toLowerCase();
    return (
      t.indexOf(HD.dnevnik.toLowerCase()) !== -1 ||
      t.indexOf(HD.kkal) !== -1 ||
      /^\s*\d+[.)]\s*.+:\s*[\d.,]+/m.test(t)
    );
  }

  async function readImportFileText(file) {
    const buf = await file.arrayBuffer();
    const variants = [];
    variants.push(new TextDecoder("utf-8").decode(buf));
    try {
      variants.push(new TextDecoder("windows-1251").decode(buf));
    } catch (err) {
      /* Samsung и др. могут не знать cp1251 */
    }

    let best = variants[0];
    let bestScore = -1;
    variants.forEach((text) => {
      const parsed = parseHealthDietTxt(text);
      const score = parsed.stats.products + parsed.days.length * 10;
      if (score > bestScore) {
        bestScore = score;
        best = text;
      }
    });
    return best;
  }

  function applyHealthDietImport(parsed) {
    if (!parsed.days.length) {
      const s = parsed.stats || {};
      throw new Error(
        "В файле не найдено ни одного дня с продуктами. " +
          `Строк: ${s.lines || 0}, дней: ${s.dayHeaders || 0}, ` +
          `приёмов: ${s.mealHeaders || 0}, продуктов: ${s.products || 0}. ` +
          "Нужен именно txt-экспорт Health-Diet."
      );
    }

    const usedMeals = new Set();
    parsed.days.forEach((day) => {
      Object.keys(day.meals).forEach((key) => {
        if (day.meals[key].products.length) usedMeals.add(key);
      });
    });

    const snack1 = els.mealToggles.querySelector('input[data-meal="snack1"]');
    const snack2 = els.mealToggles.querySelector('input[data-meal="snack2"]');
    if (snack1) snack1.checked = usedMeals.has("snack1");
    if (snack2) snack2.checked = usedMeals.has("snack2");

    // Для каждого дня гарантируем объекты всех активных приёмов
    const active = getActiveMeals();
    parsed.days.forEach((day) => {
      active.forEach((key) => {
        if (!day.meals[key]) {
          day.meals[key] = { dishName: "", products: [], comment: "" };
        }
      });
    });

    els.daysContainer.innerHTML = "";
    parsed.days.forEach((day) => {
      addDay(day.meals);
    });

    notifyFormChange();

    return `Импортировано дней: ${parsed.days.length}.`;
  }

  async function importFromText(text) {
    try {
      const filled = Array.from(
        els.daysContainer.querySelectorAll(".item-name, .meal-dish-name")
      ).some((el) => el.value.trim());

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
      setImportStatus(msg, "ok");
    } catch (err) {
      console.error(err);
      setImportStatus(err.message || "Ошибка импорта.", "err");
    }
  }

  function handleImportFile(file) {
    if (!file) return;
    readImportFileText(file)
      .then((text) => importFromText(text))
      .catch((err) => {
        console.error(err);
        setImportStatus("Не удалось прочитать файл.", "err");
      });
  }

  async function handleImportPaste() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        const manual = prompt("Вставьте сюда текст экспорта Health-Diet (txt):");
        if (manual == null) return;
        await importFromText(manual);
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setImportStatus("Буфер обмена пуст.", "err");
        return;
      }
      await importFromText(text);
    } catch (err) {
      const manual = prompt("Не удалось прочитать буфер. Вставьте текст экспорта вручную:");
      if (manual == null) return;
      await importFromText(manual);
    }
  }

  /** Самопроверка парсера при загрузке страницы */
  function runImportSelfCheck() {
    const nl = "\n";
    const sample =
      "# " +
      HD.dnevnik +
      " " +
      HD.pitaniya +
      " " +
      HD.za +
      " 01.01.2026" +
      nl +
      nl +
      "## " +
      HD.zavtrak.toUpperCase() +
      " - " +
      HD.kkal +
      " 100" +
      nl +
      "   1. TestA: 50 " +
      HD.gram +
      ", " +
      HD.kkal +
      " 1" +
      nl +
      "## " +
      HD.utrenn +
      "\u0438\u0439 " +
      HD.perekus.toUpperCase() +
      " - " +
      HD.kkal +
      " 10" +
      nl +
      "   1. SnackA: 20 " +
      HD.gram +
      ", " +
      HD.kkal +
      " 1" +
      nl +
      HD.itogo +
      " " +
      HD.za +
      " " +
      "\u0434\u0435\u043d\u044c." +
      nl +
      HD.nutrienty +
      ":" +
      nl +
      "---------" +
      nl +
      "# " +
      HD.dnevnik +
      " " +
      HD.pitaniya +
      " " +
      HD.za +
      " 02.01.2026" +
      nl +
      nl +
      "## " +
      HD.zavtrak.toUpperCase() +
      " - " +
      HD.kkal +
      " 50" +
      nl +
      "   1. TestB: 30 " +
      HD.gram +
      ", " +
      HD.kkal +
      " 1" +
      nl +
      "## " +
      "\u0414\u041d\u0415\u0412\u041d\u041e\u0419 \u041f\u0415\u0420\u0415\u041a\u0423\u0421" +
      " - " +
      HD.kkal +
      " 10" +
      nl +
      "   1. SnackB: 15 " +
      HD.gram +
      ", " +
      HD.kkal +
      " 1" +
      nl;

    const parsed = parseHealthDietTxt(sample);
    const day1 = parsed.days[0] && parsed.days[0].meals;
    const day2 = parsed.days[1] && parsed.days[1].meals;
    const ok =
      parsed.days.length === 2 &&
      day1 &&
      day1.breakfast &&
      day1.snack1 &&
      !day1.snack2 &&
      day2 &&
      day2.breakfast &&
      !day2.snack1 &&
      day2.snack2;

    console.log("[HD import self-check]", ok ? "OK" : "FAIL", {
      days: parsed.days.length,
      products: parsed.stats.products,
      day1: day1 && Object.keys(day1),
      day2: day2 && Object.keys(day2),
    });
    return ok;
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
    // Страница без формы (тестовая) — только парсер
    if (!els.daysContainer || !els.printRoot) return;

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

    if (!runImportSelfCheck()) {
      setImportStatus(
        "Внимание: самопроверка импорта не прошла. Обновите страницу с очисткой кэша.",
        "err"
      );
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

  // Всегда доступно для тестов / консоли
  window.__HD_PARSE = parseHealthDietTxt;
  window.__HD_RENDER_CELL = renderMealCell;
  window.__VERIFY_SINGLE_PAGE = verifySinglePrintPage;
  window.__RENDER_PREVIEW = renderPreview;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
