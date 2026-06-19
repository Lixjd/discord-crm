// НАСТРОЙКИ (ЗАМЕНИТЕ НА СВОИ!)
const GITHUB_USERNAME = 'lixjd';
const REPO_NAME = 'discord-crm';
const TOKEN = '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';

const FILE_PATH = 'data.json';
let data = null;

// ===== ЗАГРУЗКА =====
async function loadData() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
        const response = await fetch(url);
        const fileData = await response.json();
        const content = atob(fileData.content);
        data = JSON.parse(content);
        updateUI();
        updateStats();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Ошибка загрузки данных! Проверьте токен.');
    }
}

// ===== СОХРАНЕНИЕ =====
async function saveData() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
        const response = await fetch(url);
        const fileData = await response.json();
        const sha = fileData.sha;

        const body = {
            message: `Обновление CRM ${new Date().toLocaleString()}`,
            content: btoa(JSON.stringify(data, null, 2)),
            sha: sha
        };

        const result = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (result.ok) {
            alert('✅ Данные сохранены!');
            updateStats();
        } else {
            alert('❌ Ошибка сохранения!');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка сохранения!');
    }
}

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====
function updateUI() {
    updateRolesSelect();
    renderTable();
}

function updateStats() {
    if (!data) return;
    document.getElementById('userCount').textContent = data.users.length;
    const warns = data.users.reduce((sum, u) => sum + u.warns.length, 0);
    document.getElementById('warnCount').textContent = warns;
    document.getElementById('userBadge').textContent = `${data.users.length} online`;
}

function updateRolesSelect() {
    const select = document.getElementById('userRole');
    select.innerHTML = '';
    data.roles.forEach(role => {
        const opt = document.createElement('option');
        opt.value = role;
        opt.text = role;
        select.appendChild(opt);
    });
}

function renderTable() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    data.users.forEach((user, index) => {
        const tr = document.createElement('tr');

        // Имя
        const tdName = document.createElement('td');
        tdName.textContent = user.name;
        tr.appendChild(tdName);

        // Discord Tag
        const tdTag = document.createElement('td');
        tdTag.textContent = user.discord_tag;
        tr.appendChild(tdTag);

        // Роль (выпадающий список)
        const tdRole = document.createElement('td');
        const select = document.createElement('select');
        data.roles.forEach(role => {
            const opt = document.createElement('option');
            opt.value = role;
            opt.text = role;
            if (user.role === role) opt.selected = true;
            select.appendChild(opt);
        });
        select.onchange = function() {
            user.role = this.value;
            saveData();
        };
        tdRole.appendChild(select);
        tr.appendChild(tdRole);

        // Выговоры
        const tdWarns = document.createElement('td');
        const warns = user.warns.map(w => `${w.reason} (${w.date})`).join('; ');
        tdWarns.textContent = warns || 'Нет выговоров';
        tr.appendChild(tdWarns);

        // Действия
        const tdActions = document.createElement('td');

        const warnBtn = document.createElement('button');
        warnBtn.textContent = '⚠️ Выговор';
        warnBtn.className = 'btn-warn';
        warnBtn.onclick = function() {
            const reason = prompt('Причина выговора:');
            if (reason) {
                user.warns.push({
                    date: new Date().toISOString().split('T')[0],
                    reason: reason
                });
                saveData();
            }
        };
        tdActions.appendChild(warnBtn);

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️ Удалить';
        delBtn.className = 'btn-delete';
        delBtn.onclick = function() {
            if (confirm(`Удалить ${user.name}?`)) {
                data.users.splice(index, 1);
                saveData();
            }
        };
        tdActions.appendChild(delBtn);

        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

// ===== ДОБАВЛЕНИЕ =====
window.addUser = function() {
    const name = document.getElementById('userName').value.trim();
    const tag = document.getElementById('userTag').value.trim();
    const role = document.getElementById('userRole').value;

    if (!name || !tag) {
        alert('Заполните имя и тэг!');
        return;
    }

    data.users.push({
        id: Date.now().toString(),
        name: name,
        discord_tag: tag,
        role: role,
        warns: []
    });

    document.getElementById('userName').value = '';
    document.getElementById('userTag').value = '';
    saveData();
};

window.addRole = function() {
    const newRole = document.getElementById('newRoleName').value.trim();
    if (!newRole) {
        alert('Введите название роли!');
        return;
    }
    if (data.roles.includes(newRole)) {
        alert('Такая роль уже есть!');
        return;
    }
    data.roles.push(newRole);
    document.getElementById('newRoleName').value = '';
    saveData();
};

// ЗАПУСК
loadData();
