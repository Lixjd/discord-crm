const GITHUB_USERNAME = 'lixjd';
const REPO_NAME = 'discord-crm';
const TOKEN = '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';

const FILE_PATH = 'data.json';
let data = null;

async function loadData() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
        const res = await fetch(url);
        const file = await res.json();
        const content = atob(file.content);
        data = JSON.parse(content);
        updateUI();
        updateStats();
    } catch (e) {
        console.error(e);
        alert('Ошибка загрузки данных');
    }
}

async function saveData() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
        const res = await fetch(url);
        const file = await res.json();
        const sha = file.sha;

        const body = {
            message: `update ${new Date().toLocaleString()}`,
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
            alert('saved');
            updateStats();
        } else {
            alert('error saving');
        }
    } catch (e) {
        console.error(e);
        alert('error saving');
    }
}

function updateUI() {
    const select = document.getElementById('userRole');
    select.innerHTML = '';
    data.roles.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.text = r;
        select.appendChild(opt);
    });
    renderTable();
}

function updateStats() {
    if (!data) return;
    document.getElementById('userCount').textContent = data.users.length;
    const warns = data.users.reduce((s, u) => s + u.warns.length, 0);
    document.getElementById('warnCount').textContent = warns;
    document.getElementById('userBadge').textContent = data.users.length + ' active';
}

function renderTable() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';
    data.users.forEach((user, index) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = user.name;
        tr.appendChild(tdName);

        const tdTag = document.createElement('td');
        tdTag.textContent = user.discord_tag;
        tr.appendChild(tdTag);

        const tdRole = document.createElement('td');
        const sel = document.createElement('select');
        data.roles.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.text = r;
            if (user.role === r) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.onchange = function() {
            user.role = this.value;
            saveData();
        };
        tdRole.appendChild(sel);
        tr.appendChild(tdRole);

        const tdWarns = document.createElement('td');
        tdWarns.textContent = user.warns.map(w => `${w.reason} (${w.date})`).join('; ') || '—';
        tr.appendChild(tdWarns);

        const tdActions = document.createElement('td');
        const warnBtn = document.createElement('button');
        warnBtn.textContent = 'warn';
        warnBtn.className = 'btn-warn';
        warnBtn.onclick = function() {
            const reason = prompt('reason:');
            if (reason) {
                user.warns.push({ date: new Date().toISOString().split('T')[0], reason });
                saveData();
            }
        };
        tdActions.appendChild(warnBtn);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'delete';
        delBtn.className = 'btn-delete';
        delBtn.onclick = function() {
            if (confirm(`delete ${user.name}?`)) {
                data.users.splice(index, 1);
                saveData();
            }
        };
        tdActions.appendChild(delBtn);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

window.addUser = function() {
    const name = document.getElementById('userName').value.trim();
    const tag = document.getElementById('userTag').value.trim();
    const role = document.getElementById('userRole').value;
    if (!name || !tag) return alert('fill all fields');
    data.users.push({ id: Date.now().toString(), name, discord_tag: tag, role, warns: [] });
    document.getElementById('userName').value = '';
    document.getElementById('userTag').value = '';
    saveData();
};

window.addRole = function() {
    const r = document.getElementById('newRoleName').value.trim();
    if (!r) return alert('enter role name');
    if (data.roles.includes(r)) return alert('role exists');
    data.roles.push(r);
    document.getElementById('newRoleName').value = '';
    saveData();
};

loadData();
