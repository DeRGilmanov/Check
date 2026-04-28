// ===== Хранилище данных =====
const STORAGE_KEY = "mutual_conditions_data";

// Загрузка данных из localStorage
function loadData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return [];
}

// Сохранение данных в localStorage
function saveData(conditions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conditions));
}

// Текущие данные
let conditions = loadData();

// Текущий фильтр
let currentFilter = "all";
let currentPeriod = "all";

// ID условия для отклонения
let pendingRejectId = null;

// ===== Вспомогательные функции =====
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

// Фильтрация по периоду
function filterByPeriod(conditions, period) {
  const now = Date.now();

  switch (period) {
    case "day":
      return conditions.filter((c) => c.createdAt > now - 24 * 60 * 60 * 1000);
    case "week":
      return conditions.filter(
        (c) => c.createdAt > now - 7 * 24 * 60 * 60 * 1000,
      );
    case "month":
      return conditions.filter(
        (c) => c.createdAt > now - 30 * 24 * 60 * 60 * 1000,
      );
    default:
      return conditions;
  }
}

// Фильтрация по статусу
function filterByStatus(conditions, status) {
  if (status === "all") return conditions;
  return conditions.filter((c) => c.status === status);
}

// Получить отфильтрованные условия для конкретного человека
function getFilteredConditions(target) {
  let filtered = conditions.filter((c) => c.target === target);
  filtered = filterByPeriod(filtered, currentPeriod);
  filtered = filterByStatus(filtered, currentFilter);
  return filtered;
}

// Подсчёт процента выполнения
function calculateProgress(target) {
  const allConditions = conditions.filter((c) => c.target === target);
  const periodFiltered = filterByPeriod(allConditions, currentPeriod);

  if (periodFiltered.length === 0) return 0;

  const confirmed = periodFiltered.filter(
    (c) => c.status === "confirmed",
  ).length;
  return Math.round((confirmed / periodFiltered.length) * 100);
}

// ===== Система комментариев =====
function addComment(conditionId, author, text) {
  const condition = conditions.find((c) => c.id === conditionId);
  if (condition) {
    if (!condition.comments) {
      condition.comments = [];
    }
    condition.comments.push({
      id: generateId(),
      author: author,
      text: text,
      timestamp: Date.now(),
    });
    saveData(conditions);
    renderAll();
  }
}

// ===== Рендеринг =====
function renderConditions(target) {
  const container = document.getElementById(`list${target}`);
  const filtered = getFilteredConditions(target);

  if (filtered.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #94a3b8;">
                <p style="font-size: 1.1rem;">📭 Нет условий</p>
                <p style="font-size: 0.85rem;">Добавьте первое условие выше</p>
            </div>
        `;
    return;
  }

  container.innerHTML = filtered
    .map((condition) => {
      const canMarkDone = condition.status === "not_done";
      const canReview = condition.status === "pending";

      // Определяем, кто выполняет (target) и кто создал
      const creatorName = condition.createdBy;
      const executorName = condition.target === "A" ? "Человек Д" : "Человек Р";

      let actionsHTML = "";

      // Кнопка "Выполнено" показывается, если статус "Не выполнено"
      if (canMarkDone) {
        actionsHTML += `<button class="btn-sm btn-done" onclick="markAsDone('${condition.id}')">✔ Отметить выполненным</button>`;
      }

      // Кнопки подтверждения/отклонения показываются, если статус "Ожидает проверки"
      if (canReview) {
        actionsHTML += `
                <button class="btn-sm btn-confirm" onclick="confirmCondition('${condition.id}')">✓ Подтвердить</button>
                <button class="btn-sm btn-reject" onclick="openRejectModal('${condition.id}')">✗ Отклонить</button>
            `;
      }

      // Кнопка удаления
      actionsHTML += `<button class="btn-sm btn-delete" onclick="deleteCondition('${condition.id}')">🗑 Удалить</button>`;

      // Отображение комментариев
      let commentsHTML = "";
      if (condition.comments && condition.comments.length > 0) {
        commentsHTML = `
                <div class="comments-section">
                    <div class="comments-title">💬 Переписка:</div>
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

      // Форма для добавления комментария
      const commentFormHTML = `
            <div class="comment-form">
                <input 
                    type="text" 
                    class="comment-input" 
                    id="commentInput_${condition.id}" 
                    placeholder="Добавить комментарий..."
                >
                <button 
                    class="btn-sm btn-comment" 
                    onclick="submitComment('${condition.id}', '${target}')"
                >
                    💬 Отправить
                </button>
            </div>
        `;

      return `
            <div class="condition-card">
                <div class="condition-header">
                    <span class="condition-text">${condition.description}</span>
                    <span class="status-badge status-${condition.status}">${getStatusText(condition.status)}</span>
                </div>
                <div class="condition-meta">
                    <span>📝 Создал: ${creatorName}</span>
                    <span>👤 Выполняет: ${executorName}</span>
                </div>
                <div class="condition-meta">
                    <span>📅 Создано: ${formatDate(condition.createdAt)}</span>
                </div>
                
                ${
                  condition.comment
                    ? `
                    <div class="condition-comment rejection-reason">
                        <strong>⚠️ Причина отклонения:</strong> ${condition.comment}
                    </div>
                `
                    : ""
                }
                
                ${commentsHTML}
                ${commentFormHTML}
                
                <div class="condition-actions">
                    ${actionsHTML}
                </div>
            </div>
        `;
    })
    .join("");
}

function submitComment(conditionId, target) {
  const input = document.getElementById(`commentInput_${conditionId}`);
  const text = input.value.trim();

  if (!text) return;

  // Определяем, кто оставляет комментарий
  // Если target это A, значит условие для A, и создал его B
  // Комментарий может оставить любой
  const author = target === "A" ? "Человек Д" : "Человек Р";

  addComment(conditionId, author, text);
  input.value = "";
}

function renderStats() {
  const progressA = calculateProgress("A");
  const progressB = calculateProgress("B");

  // Обновление круговых диаграмм
  document.getElementById("circleFillA").style.strokeDasharray =
    `${progressA}, 100`;
  document.getElementById("percentA").textContent = `${progressA}%`;

  document.getElementById("circleFillB").style.strokeDasharray =
    `${progressB}, 100`;
  document.getElementById("percentB").textContent = `${progressB}%`;

  // Обновление столбчатой диаграммы
  document.getElementById("barFillA").style.height = `${progressA}%`;
  document.getElementById("barValueA").textContent = `${progressA}%`;

  document.getElementById("barFillB").style.height = `${progressB}%`;
  document.getElementById("barValueB").textContent = `${progressB}%`;
}

function renderAll() {
  renderConditions("A");
  renderConditions("B");
  renderStats();
}

// ===== Действия с условиями =====
function addCondition(target) {
  const input = document.getElementById(`input${target}`);
  const description = input.value.trim();

  if (!description) {
    alert("Введите описание условия");
    return;
  }

  const newCondition = {
    id: generateId(),
    target: target,
    description: description,
    status: "not_done",
    comment: "",
    comments: [], // Массив для переписки
    createdBy: target === "A" ? "Человек B" : "Человек A",
    createdAt: Date.now(),
  };

  conditions.push(newCondition);
  saveData(conditions);
  input.value = "";
  renderAll();
}

function markAsDone(id) {
  const condition = conditions.find((c) => c.id === id);
  if (condition) {
    condition.status = "pending";
    saveData(conditions);
    renderAll();
  }
}

function confirmCondition(id) {
  const condition = conditions.find((c) => c.id === id);
  if (condition) {
    condition.status = "confirmed";
    condition.comment = "";
    saveData(conditions);
    renderAll();
  }
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
    alert("Необходимо указать причину отклонения");
    return;
  }

  const condition = conditions.find((c) => c.id === pendingRejectId);
  if (condition) {
    condition.status = "rejected";
    condition.comment = comment;
    saveData(conditions);
    closeRejectModal();
    renderAll();
  }
}

function closeRejectModal() {
  document.getElementById("rejectModal").classList.remove("active");
  pendingRejectId = null;
}

function deleteCondition(id) {
  if (confirm("Вы уверены, что хотите удалить это условие?")) {
    conditions = conditions.filter((c) => c.id !== id);
    saveData(conditions);
    renderAll();
  }
}

// ===== Обработчики фильтров =====
function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.filter === filter) {
      btn.classList.add("active");
    }
  });

  renderAll();
}

function setPeriod(period) {
  currentPeriod = period;

  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.period === period) {
      btn.classList.add("active");
    }
  });

  renderAll();
}

// ===== Инициализация =====
function init() {
  // Обработчики добавления условий
  document
    .getElementById("btnAddA")
    .addEventListener("click", () => addCondition("A"));
  document
    .getElementById("btnAddB")
    .addEventListener("click", () => addCondition("B"));

  // Обработчики Enter в полях ввода
  document.getElementById("inputA").addEventListener("keypress", (e) => {
    if (e.key === "Enter") addCondition("A");
  });
  document.getElementById("inputB").addEventListener("keypress", (e) => {
    if (e.key === "Enter") addCondition("B");
  });

  // Обработчики фильтров
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });

  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.addEventListener("click", () => setPeriod(btn.dataset.period));
  });

  // Обработчики модального окна
  document
    .getElementById("btnConfirmReject")
    .addEventListener("click", rejectCondition);
  document
    .getElementById("btnCancelReject")
    .addEventListener("click", closeRejectModal);

  // Закрытие модального окна по клику на фон
  document.getElementById("rejectModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      closeRejectModal();
    }
  });

  // Первый рендер
  renderAll();
}

// Запуск приложения
init();
