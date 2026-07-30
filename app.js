/**
 * =============================================================
 * Таблица меню для нутрициолога
 * Логика формы, рендер таблицы, скачивание PDF / JPG
 * =============================================================
 */

(() => {
  "use strict";

  /* ===========================================================
     БЛОК 1. КОНСТАНТЫ И СЛОВАРИ
     =========================================================== */
  const MEAL_ORDER = ["breakfast", "snack1", "lunch", "snack2", "dinner"];

  const MEAL_LABELS = {
    breakfast: "Завтрак",
    snack1: "Перекус",
    lunch: "Обед",
    snack2: "Перекус",
    dinner: "Ужин",
  };

  /** Высота полезной области листа A4 landscape (px) под контент таблицы */
  const SHEET_CONTENT_MAX = 730;

  /* ===========================================================
     БЛОК 2. ССЫЛКИ НА DOM
     =========================================================== */
  const els = {
    lastname: document.getElementById("client-lastname"),
    firstname: document.getElementById("client-firstname"),
    week: document.getElementById("week-number"),
    mealToggles: document.getElementById("meal-toggles"),
    daysContainer: document.getElementById("days-container"),
    printRoot: document.getElementById("print-root"),
    btnAddDay: document.getElementById("btn-add-day"),
    btnPreview: document.getElementById("btn-preview"),
    btnPdf: document.getElementById("btn-pdf"),
    btnJpg: document.getElementById("btn-jpg"),
    tplDay: document.getElementById("day-card-template"),
    tplMeal: document.getElementById("meal-slot-template"),
    tplProduct: document.getElementById("product-item-template"),
    tplDish: document.getElementById("dish-item-template"),
    tplIngredient: document.getElementById("ingredient-template"),
  };

  /* ===========================================================
     БЛОК 3. АКТИВНЫЕ ПРИЁМЫ ПИЩИ
     Перекусы можно отключить — колонки не появятся в таблице
     =========================================================== */
  function getActiveMeals() {
    const active = [];
    MEAL_ORDER.forEach((key) => {
      const input = els.mealToggles.querySelector(`input[data-meal="${key}"]`);
      if (input && input.checked) active.push(key);
    });
    return active;
  }

  /* ===========================================================
     БЛОК 4. СОЗДАНИЕ ЭЛЕМЕНТОВ ФОРМЫ
     =========================================================== */

  /** Добавить ингредиент в блюдо */
  function addIngredient(listEl, name = "", weight = "") {
    const node = els.tplIngredient.content.cloneNode(true);
    const row = node.querySelector(".ingredient-row");
    row.querySelector(".ingredient-name").value = name;
    row.querySelector(".ingredient-weight").value = weight;
    row.querySelector(".btn-remove-ingredient").addEventListener("click", () => {
      row.remove();
    });
    listEl.appendChild(node);
  }

  /** Добавить продукт в приём пищи */
  function addProduct(itemsList, name = "", weight = "") {
    const node = els.tplProduct.content.cloneNode(true);
    const row = node.querySelector(".item-row");
    row.querySelector(".item-name").value = name;
    row.querySelector(".item-weight").value = weight;
    row.querySelector(".btn-remove-item").addEventListener("click", () => {
      row.remove();
    });
    itemsList.appendChild(node);
  }

  /** Добавить блюдо с ингредиентами */
  function addDish(itemsList, name = "", ingredients = [{ name: "", weight: "" }]) {
    const node = els.tplDish.content.cloneNode(true);
    const row = node.querySelector(".item-row");
    const list = row.querySelector(".ingredients-list");

    row.querySelector(".item-name").value = name;
    row.querySelector(".btn-remove-item").addEventListener("click", () => {
      row.remove();
    });
    row.querySelector(".btn-add-ingredient").addEventListener("click", () => {
      addIngredient(list);
    });

    ingredients.forEach((ing) => addIngredient(list, ing.name, ing.weight));
    itemsList.appendChild(node);
  }

  /** Создать слот одного приёма пищи внутри дня */
  function createMealSlot(mealKey) {
    const node = els.tplMeal.content.cloneNode(true);
    const slot = node.querySelector(".meal-slot");
    slot.dataset.mealKey = mealKey;
    slot.querySelector(".meal-slot__title").textContent = MEAL_LABELS[mealKey];

    const itemsList = slot.querySelector(".items-list");

    slot.querySelector(".btn-add-product").addEventListener("click", () => {
      addProduct(itemsList);
    });
    slot.querySelector(".btn-add-dish").addEventListener("click", () => {
      addDish(itemsList);
    });

    return slot;
  }

  /** Пересобрать слоты приёмов пищи в карточке дня (после смены чекбоксов) */
  function rebuildMealSlots(dayCard) {
    const container = dayCard.querySelector(".day-card__meals");
    const prevData = collectMealSlotsData(dayCard);
    container.innerHTML = "";

    getActiveMeals().forEach((key) => {
      const slot = createMealSlot(key);
      container.appendChild(slot);

      // Восстановить ранее введённые данные, если приём пищи остался
      const saved = prevData[key];
      if (!saved) return;

      const itemsList = slot.querySelector(".items-list");
      saved.items.forEach((item) => {
        if (item.type === "product") {
          addProduct(itemsList, item.name, item.weight);
        } else if (item.type === "dish") {
          addDish(itemsList, item.name, item.ingredients.length ? item.ingredients : [{ name: "", weight: "" }]);
        }
      });
      slot.querySelector(".meal-drink").value = saved.drink || "";
      slot.querySelector(".meal-comment").value = saved.comment || "";
    });
  }

  /** Считать данные слотов дня (для восстановления после переключения перекусов) */
  function collectMealSlotsData(dayCard) {
    const data = {};
    dayCard.querySelectorAll(".meal-slot").forEach((slot) => {
      data[slot.dataset.mealKey] = collectMealFromSlot(slot);
    });
    return data;
  }

  /** Добавить карточку дня */
  function addDay(dayNumber = "") {
    const node = els.tplDay.content.cloneNode(true);
    const card = node.querySelector(".day-card");
    card.querySelector(".day-number-input").value = dayNumber;

    card.querySelector(".btn-remove-day").addEventListener("click", () => {
      card.remove();
      if (!els.daysContainer.children.length) addDay();
    });

    rebuildMealSlots(card);
    els.daysContainer.appendChild(card);
    return card;
  }

  /* ===========================================================
     БЛОК 5. СБОР ДАННЫХ ИЗ ФОРМЫ
     Пустые поля не попадают в итоговую таблицу
     =========================================================== */
  function collectMealFromSlot(slot) {
    const items = [];

    slot.querySelectorAll(".item-row").forEach((row) => {
      const type = row.dataset.type;
      const name = row.querySelector(".item-name").value.trim();

      if (type === "product") {
        const weight = row.querySelector(".item-weight").value.trim();
        if (!name && !weight) return;
        items.push({ type: "product", name, weight });
      }

      if (type === "dish") {
        const ingredients = [];
        row.querySelectorAll(".ingredient-row").forEach((ing) => {
          const iname = ing.querySelector(".ingredient-name").value.trim();
          const iweight = ing.querySelector(".ingredient-weight").value.trim();
          if (!iname && !iweight) return;
          ingredients.push({ name: iname, weight: iweight });
        });
        if (!name && !ingredients.length) return;
        items.push({ type: "dish", name, ingredients });
      }
    });

    return {
      items,
      drink: slot.querySelector(".meal-drink").value.trim(),
      comment: slot.querySelector(".meal-comment").value.trim(),
    };
  }

  function collectFormData() {
    const lastname = els.lastname.value.trim();
    const firstname = els.firstname.value.trim();
    const week = els.week.value.trim();
    const activeMeals = getActiveMeals();

    const days = [];
    els.daysContainer.querySelectorAll(".day-card").forEach((card) => {
      const dayNumber = card.querySelector(".day-number-input").value.trim();
      const meals = {};
      card.querySelectorAll(".meal-slot").forEach((slot) => {
        meals[slot.dataset.mealKey] = collectMealFromSlot(slot);
      });
      days.push({ dayNumber, meals });
    });

    return { lastname, firstname, week, activeMeals, days };
  }

  /* ===========================================================
     БЛОК 6. РЕНДЕР HTML ЯЧЕЙКИ ПРИЁМА ПИЩИ
     - продукт: жирный + граммовка обычным
     - блюдо: название жирным, ингредиенты списком
     - напиток: через строку от продуктов
     - пустые поля не выводятся
     =========================================================== */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Формат «название – вес» или только одно из полей */
  function formatNameWeight(name, weight, nameClass) {
    const n = escapeHtml(name);
    const w = escapeHtml(weight);
    if (name && weight) {
      return `<span class="${nameClass}">${n}</span> <span class="cell-weight">– ${w}</span>`;
    }
    if (name) return `<span class="${nameClass}">${n}</span>`;
    if (weight) return `<span class="cell-weight">${w}</span>`;
    return "";
  }

  function renderMealCell(mealData) {
    if (!mealData) return '<div class="cell-empty"></div>';

    const parts = [];

    mealData.items.forEach((item) => {
      if (item.type === "product") {
        const line = formatNameWeight(item.name, item.weight, "cell-product-name");
        if (line) parts.push(`<div class="cell-item">${line}</div>`);
      }

      if (item.type === "dish") {
        let html = '<div class="cell-item">';
        if (item.name) {
          html += `<div class="cell-dish-name">${escapeHtml(item.name)}:</div>`;
        }
        if (item.ingredients && item.ingredients.length) {
          html += '<ul class="cell-ingredients">';
          item.ingredients.forEach((ing) => {
            // Ингредиенты — обычным шрифтом, через дефис
            let text = "";
            if (ing.name && ing.weight) {
              text = `${escapeHtml(ing.name)} – ${escapeHtml(ing.weight)}`;
            } else if (ing.name) {
              text = escapeHtml(ing.name);
            } else {
              text = escapeHtml(ing.weight);
            }
            html += `<li>${text}</li>`;
          });
          html += "</ul>";
        }
        html += "</div>";
        parts.push(html);
      }
    });

    // Напиток — всегда через строку от списка продуктов
    if (mealData.drink) {
      parts.push(`<div class="cell-drink">${escapeHtml(mealData.drink)}</div>`);
    }

    if (mealData.comment) {
      parts.push(`<div class="cell-comment">${escapeHtml(mealData.comment)}</div>`);
    }

    if (!parts.length) return '<div class="cell-empty"></div>';
    return parts.join("");
  }

  /* ===========================================================
     БЛОК 7. РЕНДЕР ТАБЛИЦЫ И РАЗБИЕНИЕ ПО СТРАНИЦАМ
     По вертикали: перенос только между днями (строка дня целиком)
     По горизонтали: подбор размера шрифта
     =========================================================== */
  function buildClientHeader(data) {
    const fullName = [data.lastname, data.firstname].filter(Boolean).join(" ");
    const weekText = data.week ? `${escapeHtml(data.week)} неделя` : "";
    return {
      nameHtml: fullName ? escapeHtml(fullName) : "",
      weekHtml: weekText,
    };
  }

  function buildTableHtml(data, daySlice) {
    const headCells = data.activeMeals
      .map((key) => `<th>${MEAL_LABELS[key]}</th>`)
      .join("");

    const rows = daySlice
      .map((day) => {
        const dayLabel = day.dayNumber ? `${escapeHtml(day.dayNumber)} день` : "";
        const mealCells = data.activeMeals
          .map((key) => `<td class="col-meal">${renderMealCell(day.meals[key])}</td>`)
          .join("");
        return `<tr class="day-row"><td class="col-day">${dayLabel}</td>${mealCells}</tr>`;
      })
      .join("");

    return `
      <table class="menu-table">
        <thead>
          <tr>
            <th class="col-day"></th>
            ${headCells}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function createSheetElement(header, tableHtml) {
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.innerHTML = `
      <p class="sheet__client">${header.nameHtml}</p>
      <p class="sheet__week">${header.weekHtml}</p>
      ${tableHtml}
    `;
    return sheet;
  }

  /**
   * Подбирает размер шрифта так, чтобы все колонки приёмов пищи
   * помещались по ширине листа (уменьшает/увеличивает в разумных пределах).
   */
  function fitFontSize(sheet) {
    const min = 8;
    const max = 15;
    let size = max;
    sheet.style.fontSize = size + "px";

    // Уменьшаем, пока таблица не перестанет вызывать горизонтальный overflow
    while (size > min) {
      const table = sheet.querySelector(".menu-table");
      if (!table) break;
      if (table.scrollWidth <= sheet.clientWidth + 1) break;
      size -= 0.5;
      sheet.style.fontSize = size + "px";
    }
  }

  /**
   * Разбивает дни по листам: если следующий день не помещается
   * по высоте — переносится на новую страницу целиком.
   */
  function paginateDays(data) {
    const header = buildClientHeader(data);
    const pages = [];
    let remaining = [...data.days];

    // Временный скрытый контейнер для измерений
    const measureHost = document.createElement("div");
    measureHost.style.cssText =
      "position:absolute;left:-9999px;top:0;visibility:hidden;";
    document.body.appendChild(measureHost);

    while (remaining.length) {
      let fitted = [];
      let lastGood = null;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining.slice(0, i + 1);
        const sheet = createSheetElement(header, buildTableHtml(data, candidate));
        measureHost.innerHTML = "";
        measureHost.appendChild(sheet);
        fitFontSize(sheet);

        const table = sheet.querySelector(".menu-table");
        const headerBlock =
          (sheet.querySelector(".sheet__client")?.offsetHeight || 0) +
          (sheet.querySelector(".sheet__week")?.offsetHeight || 0) +
          14;
        const totalH = headerBlock + (table ? table.offsetHeight : 0);

        // Один день всегда остаётся на странице, даже если высоковат
        if (totalH <= SHEET_CONTENT_MAX || candidate.length === 1) {
          fitted = candidate;
          lastGood = sheet;
        } else {
          break;
        }
      }

      if (!fitted.length) {
        fitted = [remaining[0]];
        const sheet = createSheetElement(header, buildTableHtml(data, fitted));
        measureHost.innerHTML = "";
        measureHost.appendChild(sheet);
        fitFontSize(sheet);
        lastGood = sheet;
      }

      // Клонируем измеренный лист в результат
      const finalSheet = lastGood.cloneNode(true);
      finalSheet.style.fontSize = lastGood.style.fontSize;
      pages.push(finalSheet);
      remaining = remaining.slice(fitted.length);
    }

    measureHost.remove();
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
      els.printRoot.innerHTML = '<p style="color:#666">Добавьте хотя бы один день.</p>';
      return data;
    }

    const pages = paginateDays(data);
    pages.forEach((sheet) => els.printRoot.appendChild(sheet));
    return data;
  }

  /* ===========================================================
     БЛОК 8. СКАЧИВАНИЕ PDF И JPG
     PDF — через диалог печати браузера (Сохранить как PDF)
     JPG — через html2canvas (по одному листу)
     =========================================================== */
  function downloadPdf() {
    renderPreview();
    // Даём браузеру отрисовать DOM перед печатью
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 100);
    });
  }

  async function downloadJpg() {
    renderPreview();

    if (typeof html2canvas !== "function") {
      alert("Библиотека html2canvas не загрузилась. Проверьте интернет-соединение.");
      return;
    }

    const sheets = els.printRoot.querySelectorAll(".sheet");
    if (!sheets.length) {
      alert("Нет данных для сохранения.");
      return;
    }

    const data = collectFormData();
    const baseName = [data.lastname, data.firstname, data.week ? `неделя-${data.week}` : ""]
      .filter(Boolean)
      .join("_") || "menu";

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

      // Небольшая пауза между несколькими скачиваниями
      if (sheets.length > 1) await new Promise((r) => setTimeout(r, 300));
    }
  }

  /* ===========================================================
     БЛОК 9. ДЕМО-ДАННЫЕ (чтобы сразу увидеть формат таблицы)
     =========================================================== */
  function fillDemoData() {
    els.lastname.value = "Иванова";
    els.firstname.value = "Мария";
    els.week.value = "14";

    // День 94
    const d1 = addDay("94");
    const meals1 = {};
    d1.querySelectorAll(".meal-slot").forEach((s) => {
      meals1[s.dataset.mealKey] = s;
    });

    if (meals1.breakfast) {
      addDish(meals1.breakfast.querySelector(".items-list"), "Смузи", [
        { name: "кефир 1%", weight: "200мл" },
        { name: "клубника", weight: "50гр" },
        { name: "банан", weight: "50гр" },
        { name: "семена чиа", weight: "5гр" },
      ]);
    }
    if (meals1.snack1) {
      addProduct(meals1.snack1.querySelector(".items-list"), "Яблоко", "150гр");
    }
    if (meals1.lunch) {
      const list = meals1.lunch.querySelector(".items-list");
      addDish(list, "Бедро куриное", [{ name: "В сыром виде", weight: "180гр" }]);
      addProduct(list, "Греча", "70гр");
      addDish(list, "Салат", [
        { name: "помидор", weight: "50гр" },
        { name: "огурец", weight: "50гр" },
        { name: "зелень", weight: "10гр" },
      ]);
      meals1.lunch.querySelector(".meal-drink").value = "Тёплая вода с лимоном";
    }
    if (meals1.snack2) {
      addProduct(meals1.snack2.querySelector(".items-list"), "Творог 5%", "100гр");
      addProduct(meals1.snack2.querySelector(".items-list"), "Ягоды", "50гр");
    }
    if (meals1.dinner) {
      const list = meals1.dinner.querySelector(".items-list");
      addDish(list, "Рыба запечённая", [{ name: "филе трески (сырое)", weight: "150гр" }]);
      addProduct(list, "Овощи на пару", "200гр");
      meals1.dinner.querySelector(".meal-comment").value =
        "Любой напиток не ранее, чем через 40–60 минут";
    }

    // День 95
    const d2 = addDay("95");
    const meals2 = {};
    d2.querySelectorAll(".meal-slot").forEach((s) => {
      meals2[s.dataset.mealKey] = s;
    });
    if (meals2.breakfast) {
      addProduct(meals2.breakfast.querySelector(".items-list"), "Овсянка", "40гр");
      addProduct(meals2.breakfast.querySelector(".items-list"), "Яйцо варёное", "2 шт");
    }
    if (meals2.lunch) {
      addProduct(meals2.lunch.querySelector(".items-list"), "Индейка", "150гр");
      addProduct(meals2.lunch.querySelector(".items-list"), "Рис бурый", "60гр");
    }
    if (meals2.dinner) {
      addProduct(meals2.dinner.querySelector(".items-list"), "Творожная запеканка", "150гр");
      addProduct(meals2.dinner.querySelector(".items-list"), "Огурец", "100гр");
    }
  }

  /* ===========================================================
     БЛОК 10. ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ
     =========================================================== */
  function syncAllDayMealSlots() {
    els.daysContainer.querySelectorAll(".day-card").forEach(rebuildMealSlots);
  }

  function init() {
    els.btnAddDay.addEventListener("click", () => addDay());
    els.btnPreview.addEventListener("click", () => renderPreview());
    els.btnPdf.addEventListener("click", () => downloadPdf());
    els.btnJpg.addEventListener("click", () => downloadJpg());

    // При смене перекусов — обновляем слоты во всех днях
    els.mealToggles.addEventListener("change", () => {
      syncAllDayMealSlots();
      renderPreview();
    });

    // Живое обновление превью при вводе (с небольшой задержкой)
    let timer = null;
    document.querySelector(".app-main").addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => renderPreview(), 350);
    });

    fillDemoData();
    renderPreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
