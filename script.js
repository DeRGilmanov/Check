let conditions = [];
let currentFilter = "all";
let currentPeriod = "all";
let pendingRejectId = null;

// ===== Шаблоны условий по умолчанию =====
const defaultConditionsForB = [
  "Знать где ты, с кем ты, что будешь делать",
  "Важно чтобы смотрела на будущее (как жить дальше)",
  "Мне не нравится, когда ты одеваешься открыто не в моём присутствии + откровенные видео для Инсты (соски, трусики, попа, открытая одежда где всё видно)",
  "Советоваться со мной и хотя бы иногда слушать",
  "Для меня важен секс 2-3 раз в неделю, но он мне не важен если он только по моей прихоти",
  "Писать, звонить мне по возможности",
  "Само-собой искренность, забота, взаимоуважение (считаться с моим мнением тоже)",
  "Личное пространство",
  "Быть не только девушкой, но и другом",
  "Стараться уважать моё время",
  "Брать иногда ответственность на себя (ссоры, организация мероприятий, оплата чего-нибудь). Чтобы я мог расслабиться время от времени",
  "Не флиртовать с мальчиками, глазки не строить",
  "Стараться не обсуждать меня с кем-то (ты меня простишь, а в глазах других так и останусь плохим)",
];

const defaultConditionsForA = [
  "Частые комплименты",
  "Разделять мои интересы (обсуждать мои хобби, говорить об этом, интересоваться деталями, быть в курсе всего)",
  "Поддерживать мои интересы, мои начинания (давать советы, если они необходимы и корректны, предлагать помощь, утешать, если что-то не получается, пытаться решить если возникает проблема)",
  "Цветы без повода и с поводом",
  "Быть инициативной. Проявлять инициативу чаще, что-то придумывать, предлагать, выбирать",
  "Защищать и отстаивать мои границы (если кто-то задевает мои чувства, ведёт себя неправильно по отношению ко мне или говорит то, чего не должен говорить)",
  "Поддерживать романтику в отношениях, создавать романтику (ухаживать, открывать двери, делать неожиданные приятные мелочи, куда-то приглашать)",
  "Заботиться (если я болею - навестить, на расстоянии - отправить доставкой всё что угодно)",
  "Не утаивать обиду, потому что это детская позиция, решать проблему на месте, не умалчивать ничего",
  "Не рассказывать в подробностях наших отношений, о грандиозных планах, о больших покупках, о проблемах в отношениях родителям, не посоветовавшись со мной (очень важный пункт)",
  "Относиться хорошо к тому, что я куда-то с кем-то могу пойти (как было с термо)",
  "Не быть сильно экономным",
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusText(status) {
  const statusMap = {
    not_done: "Не выполнено",
    pending: "Ожидает проверки",
    confirmed: "Подтверждено",
    rejected: "Отклонено",
  };
  return statusMap[status] || status;
}

function filterByPeriod(arr, period) {
  const now = Date.now();
  if (period === "day") return arr.filter((c) => c.createdAt > now - 86400000);
  if (period === "week")
    return arr.filter((c) => c.createdAt > now - 604800000);
  if (period === "month")
    return arr.filter((c) => c.createdAt > now - 2592000000);
  return arr;
}

function getFilteredConditions(target) {
  let filtered = conditions.filter((c) => c.target === target);
  filtered = filterByPeriod(filtered, currentPeriod);
  if (currentFilter !== "all") {
    filtered = filtered.filter((c) => c.status === currentFilter);
  }
  return filtered;
}

function calculateProgress(target) {
  const all = conditions.filter((c) => c.target === target);
  const today = getTodayDate();
  const todayConditions = all.filter((c) => c.date === today);

  if (todayConditions.length === 0) return 0;
  const conf = todayConditions.filter((c) => c.status === "confirmed").length;
  return Math.round((conf / todayConditions.length) * 100);
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ===== Создание условий по умолчанию =====
function createDefaultConditions() {
  const today = getTodayDate();
  const todayConditions = conditions.filter((c) => c.date === today);

  // Создаём для A (если ещё не созданы)
  const existingA = todayConditions.filter(
    (c) => c.target === "A" && c.isDefault === true,
  );
  if (existingA.length === 0) {
    defaultConditionsForA.forEach((desc) => {
      const newCondition = {
        id: generateId(),
        target: "A",
        description: desc,
        status: "not_done",
        comment: "",
        comments: [],
        createdBy: "Система",
        createdAt: Date.now(),
        date: today,
        isRecurring: true,
        isDefault: true,
      };
      conditions.push(newCondition);
      saveCondition(newCondition);
    });
  }

  // Создаём для B (если ещё не созданы)
  const existingB = todayConditions.filter(
    (c) => c.target === "B" && c.isDefault === true,
  );
  if (existingB.length === 0) {
    defaultConditionsForB.forEach((desc) => {
      const newCondition = {
        id: generateId(),
        target: "B",
        description: desc,
        status: "not_done",
        comment: "",
        comments: [],
        createdBy: "Система",
        createdAt: Date.now(),
        date: today,
        isRecurring: true,
        isDefault: true,
      };
      conditions.push(newCondition);
      saveCondition(newCondition);
    });
  }
}

// ===== Firebase =====
function loadData() {
  database.ref("conditions").on("value", (snapshot) => {
    const data = snapshot.val();
    conditions = data ? Object.values(data) : [];
    createDefaultConditions();
    renderAll();
  });
}

function saveCondition(condition) {
  database.ref("conditions/" + condition.id).set(condition);
}

function updateCondition(id, updates) {
  database.ref("conditions/" + id).update(updates);
}

function deleteConditionFromDB(id) {
  database.ref("conditions/" + id).remove();
}

function addComment(conditionId, author, text) {
  const condition = conditions.find((c) => c.id === conditionId);
  if (condition) {
    if (!condition.comments) condition.comments = [];
    condition.comments.push({
      id: generateId(),
      author: author,
      text: text,
      timestamp: Date.now(),
    });
    saveCondition(condition);
  }
}

// ===== Рендеринг =====
function renderConditions(target) {
  const container = document.getElementById(`list${target}`);
  const today = getTodayDate();

  let filtered = conditions.filter((c) => c.target === target);
  filtered = filterByPeriod(filtered, currentPeriod);
  if (currentFilter !== "all") {
    filtered = filtered.filter((c) => c.status === currentFilter);
  }

  filtered.sort((a, b) => {
    if (a.date === today && b.date !== today) return -1;
    if (a.date !== today && b.date === today) return 1;
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return b.createdAt - a.createdAt;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                <p style="font-size: 1rem; font-weight: 500;">Нет условий</p>
                <p style="font-size: 0.8rem;">Добавьте новое условие выше</p>
            </div>
        `;
    return;
  }

  container.innerHTML = filtered
    .map((condition) => {
      const canMarkDone = condition.status === "not_done";
      const canReview = condition.status === "pending";
      const canUndo = condition.status === "confirmed";
      const creatorName = condition.createdBy || "Неизвестно";
      const executorName =
        condition.target === "A" ? "Пользователь Д" : "Пользователь Р";
      const isToday = condition.date === today;

      let actionsHTML = "";

      // Кнопка "Выполнено"
      if (canMarkDone) {
        actionsHTML += `<button class="btn-sm btn-done" onclick="markAsDone('${condition.id}')">✔ Выполнено</button>`;
      }

      // Кнопки подтверждения/отклонения
      if (canReview) {
        actionsHTML += `
                    <button class="btn-sm btn-confirm" onclick="confirmCondition('${condition.id}')">✓ Подтвердить</button>
                    <button class="btn-sm btn-reject" onclick="openRejectModal('${condition.id}')">✗ Отклонить</button>
                `;
      }

      // Кнопка "Отменить подтверждение"
      if (canUndo) {
        actionsHTML += `<button class="btn-sm btn-undo" onclick="undoConfirm('${condition.id}')">↩ Отменить</button>`;
      }

      // Кнопка удаления (теперь доступна для всех условий)
      actionsHTML += `<button class="btn-sm btn-delete" onclick="deleteCondition('${condition.id}')">🗑</button>`;

      let commentsHTML = "";
      if (condition.comments && condition.comments.length > 0) {
        commentsHTML = `
                    <div class="comments-section">
                        <div class="comments-title">💬 Переписка (${condition.comments.length})</div>
                        ${condition.comments
                          .map(
                            (comment) => `
                                <div class="comment-item">
                                    <div class="comment-header">
                                        <span class="comment-author">${comment.author}</span>
                                        <span class="comment-time">${formatDate(comment.timestamp)}</span>
                                    </div>
                                    <div class="comment-text">${comment.text}</div>
                                </div>
                            `,
                          )
                          .join("")}
                    </div>
                `;
      }

      const commentFormHTML = `
                <div class="comment-form">
                    <input type="text" class="comment-input" id="commentInput_${condition.id}" placeholder="Комментарий...">
                    <button class="btn-sm btn-comment" onclick="submitComment('${condition.id}', '${target}')">Отправить</button>
                </div>
            `;

      const defaultBadge = condition.isDefault ? " 📌" : "";
      const recurringBadge = condition.isRecurring ? " 🔄" : "";
      const dateLabel = isToday
        ? "🔄 Сегодня"
        : condition.date
          ? "📅 " + condition.date
          : "📅 Без даты";
      const cardStyle = isToday ? "" : "opacity: 0.7;";
      const borderStyle = condition.isDefault
        ? "border-left: 3px solid #818cf8;"
        : "";

      return `
                <div class="condition-card" style="${cardStyle} ${borderStyle}">
                    <div class="condition-header">
                        <span class="condition-text">${condition.description}${defaultBadge}${recurringBadge}</span>
                        <span class="status-badge status-${condition.status}">${getStatusText(condition.status)}</span>
                    </div>
                    <div class="condition-meta">
                        <span>📝 ${creatorName}</span>
                        <span>👤 ${executorName}</span>
                        <span>${dateLabel}</span>
                    </div>
                    ${
                      condition.comment
                        ? `
                        <div class="condition-comment rejection-reason">
                            <strong>⚠️ Отклонено:</strong> ${condition.comment}
                        </div>
                    `
                        : ""
                    }
                    ${commentsHTML}
                    ${commentFormHTML}
                    <div class="condition-actions">${actionsHTML}</div>
                </div>
            `;
    })
    .join("");
}

function submitComment(conditionId, target) {
  const input = document.getElementById(`commentInput_${conditionId}`);
  const text = input.value.trim();
  if (!text) return;
  const author = target === "A" ? "Пользователь Д" : "Пользователь Р";
  addComment(conditionId, author, text);
  input.value = "";
}

function renderStats() {
  const progressA = calculateProgress("A");
  const progressB = calculateProgress("B");

  const circleA = document.getElementById("circleFillA");
  const circleB = document.getElementById("circleFillB");
  const percentA = document.getElementById("percentA");
  const percentB = document.getElementById("percentB");
  const barA = document.getElementById("barFillA");
  const barB = document.getElementById("barFillB");
  const barValA = document.getElementById("barValueA");
  const barValB = document.getElementById("barValueB");

  if (circleA) circleA.style.strokeDasharray = `${progressA}, 100`;
  if (circleB) circleB.style.strokeDasharray = `${progressB}, 100`;
  if (percentA) percentA.textContent = `${progressA}%`;
  if (percentB) percentB.textContent = `${progressB}%`;
  if (barA) barA.style.height = `${progressA}%`;
  if (barB) barB.style.height = `${progressB}%`;
  if (barValA) barValA.textContent = `${progressA}%`;
  if (barValB) barValB.textContent = `${progressB}%`;
}

function renderAll() {
  renderConditions("A");
  renderConditions("B");
  renderStats();
}

// ===== Действия =====
function addCondition(target) {
  const input = document.getElementById(`input${target}`);
  const description = input.value.trim();
  if (!description) return;

  const today = getTodayDate();

  const newCondition = {
    id: generateId(),
    target: target,
    description: description,
    status: "not_done",
    comment: "",
    comments: [],
    createdBy: target === "A" ? "Пользователь Р" : "Пользователь Д",
    createdAt: Date.now(),
    date: today,
    isRecurring: true,
    isDefault: false,
  };

  saveCondition(newCondition);
  input.value = "";
}

function markAsDone(id) {
  updateCondition(id, { status: "pending" });
}

function confirmCondition(id) {
  updateCondition(id, { status: "confirmed", comment: "" });
}

function undoConfirm(id) {
  updateCondition(id, { status: "not_done", comment: "" });
}

function openRejectModal(id) {
  pendingRejectId = id;
  document.getElementById("rejectModal").classList.add("active");
  document.getElementById("rejectComment").value = "";
  document.getElementById("rejectComment").focus();
}

function rejectCondition() {
  const comment = document.getElementById("rejectComment").value.trim();
  if (!comment) {
    alert("Укажите причину отклонения!");
    return;
  }
  updateCondition(pendingRejectId, { status: "rejected", comment: comment });
  closeRejectModal();
}

function closeRejectModal() {
  document.getElementById("rejectModal").classList.remove("active");
  pendingRejectId = null;
}

function deleteCondition(id) {
  const condition = conditions.find((c) => c.id === id);
  const message =
    condition && condition.isDefault
      ? "Это дефолтное условие. При удалении оно не появится завтра автоматически. Удалить?"
      : "Удалить условие навсегда?";

  if (confirm(message)) {
    deleteConditionFromDB(id);
  }
}

// ===== Фильтры =====
function setFilter(filter) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  renderAll();
}

function setPeriod(period) {
  currentPeriod = period;
  document
    .querySelectorAll(".period-btn")
    .forEach((b) => b.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-period="${period}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  renderAll();
}

// ===== Инициализация =====
function init() {
  loadData();

  document.getElementById("btnAddA").onclick = () => addCondition("A");
  document.getElementById("btnAddB").onclick = () => addCondition("B");

  document.getElementById("inputA").onkeypress = (e) => {
    if (e.key === "Enter") addCondition("A");
  };
  document.getElementById("inputB").onkeypress = (e) => {
    if (e.key === "Enter") addCondition("B");
  };

  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => (b.onclick = () => setFilter(b.dataset.filter)));
  document
    .querySelectorAll(".period-btn")
    .forEach((b) => (b.onclick = () => setPeriod(b.dataset.period)));

  document.getElementById("btnConfirmReject").onclick = rejectCondition;
  document.getElementById("btnCancelReject").onclick = closeRejectModal;
  document.getElementById("rejectModal").onclick = (e) => {
    if (e.target === e.currentTarget) closeRejectModal();
  };
}

init();
