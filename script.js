let conditions = [];
let currentFilter = "all";
let currentPeriod = "all";
let pendingRejectId = null;

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
  if (currentFilter !== "all")
    filtered = filtered.filter((c) => c.status === currentFilter);
  return filtered;
}

function calculateProgress(target) {
  const all = conditions.filter((c) => c.target === target);
  const filtered = filterByPeriod(all, currentPeriod);
  if (filtered.length === 0) return 0;
  const conf = filtered.filter((c) => c.status === "confirmed").length;
  return Math.round((conf / filtered.length) * 100);
}

// ===== Firebase =====
function loadData() {
  database.ref("conditions").on("value", (snapshot) => {
    const data = snapshot.val();
    conditions = data ? Object.values(data) : [];
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
  const filtered = getFilteredConditions(target);

  if (filtered.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                <p style="font-size: 1rem; font-weight: 500;">Нет условий</p>
                <p style="font-size: 0.8rem;">Добавьте первое условие выше</p>
            </div>
        `;
    return;
  }

  container.innerHTML = filtered
    .map((condition) => {
      const canMarkDone = condition.status === "not_done";
      const canReview = condition.status === "pending";
      const creatorName = condition.createdBy;
      const executorName =
        condition.target === "A" ? "Пользователь Д" : "Пользователь Р";

      let actionsHTML = "";
      if (canMarkDone) {
        actionsHTML += `<button class="btn-sm btn-done" onclick="markAsDone('${condition.id}')">✔ Выполнено</button>`;
      }
      if (canReview) {
        actionsHTML += `
                <button class="btn-sm btn-confirm" onclick="confirmCondition('${condition.id}')">✓ Подтвердить</button>
                <button class="btn-sm btn-reject" onclick="openRejectModal('${condition.id}')">✗ Отклонить</button>
            `;
      }
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

      return `
            <div class="condition-card">
                <div class="condition-header">
                    <span class="condition-text">${condition.description}</span>
                    <span class="status-badge status-${condition.status}">${getStatusText(condition.status)}</span>
                </div>
                <div class="condition-meta">
                    <span>📝 ${creatorName}</span>
                    <span>👤 ${executorName}</span>
                    <span>📅 ${formatDate(condition.createdAt)}</span>
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

  document.getElementById("circleFillA").style.strokeDasharray =
    `${progressA}, 100`;
  document.getElementById("percentA").textContent = `${progressA}%`;
  document.getElementById("circleFillB").style.strokeDasharray =
    `${progressB}, 100`;
  document.getElementById("percentB").textContent = `${progressB}%`;
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

// ===== Действия =====
function addCondition(target) {
  const input = document.getElementById(`input${target}`);
  const description = input.value.trim();
  if (!description) return;

  saveCondition({
    id: generateId(),
    target: target,
    description: description,
    status: "not_done",
    comment: "",
    comments: [],
    createdBy: target === "A" ? "Пользователь Р" : "Пользователь Д",
    createdAt: Date.now(),
  });
  input.value = "";
}

function markAsDone(id) {
  updateCondition(id, { status: "pending" });
}

function confirmCondition(id) {
  updateCondition(id, { status: "confirmed", comment: "" });
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
  if (confirm("Удалить условие?")) deleteConditionFromDB(id);
}

// ===== Фильтры =====
function setFilter(filter) {
  currentFilter = filter;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active");
  renderAll();
}

function setPeriod(period) {
  currentPeriod = period;
  document
    .querySelectorAll(".period-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector(`[data-period="${period}"]`).classList.add("active");
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
