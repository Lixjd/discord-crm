// Настройки репозитория (ЗАМЕНИТЕ НА СВОИ!)
const GITHUB_USERNAME = 'lixjd'; // например 'ivanov'
const REPO_NAME = 'discord-crm'; // название вашего репозитория
const FILE_PATH = 'data.json'; // путь к файлу
const TOKEN = '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'; // Сюда вставим токен позже

// Текущие данные
let data = null;

// Функция загрузки данных с GitHub
async function loadData() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
        const response = await fetch(url);
        const fileData = await response.json();
        
        // GitHub возвращает контент в base64, декодируем
        const content = atob(fileData.content);
        data = JSON.parse(content);
        
        // Обновляем интерфейс
        updateUI();
    } catch (error) {
        alert('Ошибка загрузки данных! Проверьте токен и название репозитория.');
        console.error(error);
    }
}

// Функция сохранения (запись на GitHub)
async function saveData() {
    // Получаем последнюю версию файла, чтобы получить SHA (это нужно для обновления)
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
    const response = await fetch(url);
    const fileData = await response.json();
    const sha = fileData.sha;

    // Готовим данные к отправке
    const content = btoa(JSON.stringify(data, null, 2)); // Превращаем в base64

    const body = {
        message: `Обновление данных CRM ${new Date().toLocaleString()}`,
        content: content,
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
        alert('Данные успешно сохранены на GitHub!');
    } else {
        alert('Ошибка сохранения!');
        console.log(await result.json());
    }
}

// ======== ЛОГИКА РАБОТЫ С ИНТЕРФЕЙСОМ ========

function updateUI() {
    updateRolesSelect();
    renderTable();
}

// Обновляем выпадающий список ролей
function updateRolesSelect() {
    const select = document.getElementById('userRole');
    select.innerHTML = '';
    data.roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.text = role;
        select.appendChild(option);
    });
}

// Рисуем таблицу пользователей
function renderTable() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';
    
    data.users.forEach((user, index) => {
        const tr = document.createElement('tr');
        
        // Имя
        const tdName = document.createElement('td');
        tdName.textContent = user.name;
        tr.appendChild(tdName);
        
        // Tag
        const tdTag = document.createElement('td');
        tdTag.textContent = user.discord_tag;
        tr.appendChild(tdTag);
        
        // Роль (выпадающий список для смены роли)
        const tdRole = document.createElement('td');
        const roleSelect = document.createElement('select');
        data.roles.forEach(role => {
            const opt = document.createElement('option');
            opt.value = role;
            opt.text = role;
            if (user.role === role) opt.selected = true;
            roleSelect.appendChild(opt);
        });
        roleSelect.onchange = function() {
            user.role = this.value;
            saveData(); // Сохраняем сразу при смене
        };
        tdRole.appendChild(roleSelect);
        tr.appendChild(tdRole);
        
        // Выговоры
        const tdWarns = document.createElement('td');
        const warnList = user.warns.map(w => `${w.reason} (${w.date})`).join('; ') || 'Нет выговоров';
        tdWarns.textContent = warnList;
        tr.appendChild(tdWarns);
        
        // Действия (кнопки)
        const tdActions = document.createElement('td');
        
        // Кнопка "Выговор"
        const warnBtn = document.createElement('button');
        warnBtn.textContent = '⚠️ Выговор';
        warnBtn.className = 'warn-btn';
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
        
        // Кнопка "Удалить"
        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️ Удалить';
        delBtn.className = 'delete-btn';
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

// Добавление пользователя
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
    
    // Очищаем поля
    document.getElementById('userName').value = '';
    document.getElementById('userTag').value = '';
    
    saveData();
};

// Добавление роли
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

// Запускаем загрузку при открытии страницы
loadData();
