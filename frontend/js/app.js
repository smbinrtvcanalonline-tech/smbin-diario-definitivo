// Lógica Cliente SMBIN Definitiva

let authToken = localStorage.getItem('smbin_token') || null;

document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
    loadVideos();
    checkAuthUI();

    const overlay = document.getElementById('vMixOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            overlay.style.display = 'none';
            alert('Conectando con la señal en directo vMix de SMBIN TV 24/7...');
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    authToken = data.token;
                    localStorage.setItem('smbin_token', authToken);
                    alert('Acceso autorizado. Panel CMS activado.');
                    closeLogin();
                    checkAuthUI();
                    loadAdminArticles();
                } else {
                    alert(data.message || 'Error de acceso.');
                }
            } catch (err) {
                alert('Error al conectar con el servidor.');
            }
        });
    }

    const articleForm = document.getElementById('articleForm');
    if (articleForm) {
        articleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('artId').value;
            const title = document.getElementById('artTitle').value;
            const summary = document.getElementById('artSummary').value;
            const content = summary;
            const image_url = document.getElementById('artImage').value;
            const category = document.getElementById('artCategory').value;
            const source_internal = document.getElementById('artSource').value;
            const smbin_reflection = document.getElementById('artReflection').value;

            try {
                const res = await fetch('/api/admin/articles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ id, title, summary, content, image_url, category, source_internal, smbin_reflection })
                });
                const data = await res.json();
                alert(data.message || 'Noticia guardada.');
                closeArticleModal();
                loadArticles();
                loadAdminArticles();
            } catch (err) {
                alert('Error al guardar la noticia.');
            }
        });
    }
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    const target = document.getElementById(`view-${tabId}`);
    if (target) target.style.display = 'block';
    const link = document.getElementById(`link-${tabId}`);
    if (link) link.classList.add('active');
}

async function loadArticles() {
    try {
        const res = await fetch('/api/articles');
        const data = await res.json();
        const articles = data.articles || [];

        const mainBox = document.getElementById('mainStoryContent');
        const publicContainer = document.getElementById('publicNewsContainer');
        const loretoContainer = document.getElementById('loretoContainer');
        const limaContainer = document.getElementById('limaContainer');
        const mundoContainer = document.getElementById('mundoContainer');

        if (publicContainer) publicContainer.innerHTML = '';
        if (loretoContainer) loretoContainer.innerHTML = '';
        if (limaContainer) limaContainer.innerHTML = '';
        if (mundoContainer) mundoContainer.innerHTML = '';

        if (articles.length > 0) {
            // Portada Principal (Izquierda)
            const main = articles[0];
            if (mainBox) {
                mainBox.innerHTML = `
                    <img src="${main.image}" alt="Noticia Principal" style="width:100%; height:220px; object-fit:cover; border-radius:6px; margin-bottom:0.8rem;">
                    <h2>${main.title}</h2>
                    <p>${main.summary}</p>
                    ${main.smbin_reflection ? `<div style="background:#fffbe6; border-left:4px solid #f59e0b; padding:0.8rem; margin-top:1rem; font-size:0.9rem;"><strong><i class="fa-solid fa-quote-left"></i> La Reflexión SMBIN:</strong> ${main.smbin_reflection}</div>` : ''}
                `;
            }

            // Resto de artículos
            articles.slice(1).forEach(art => {
                const card = document.createElement('article');
                card.className = 'news-card';
                card.innerHTML = `
                    <img src="${art.image}" alt="Imagen noticia">
                    <span style="font-size:0.75rem; font-weight:bold; color:var(--red-journal);">${art.category.toUpperCase()}</span>
                    <h3>${art.title}</h3>
                    <p style="font-size:0.9rem; color:#4b5563;">${art.summary}</p>
                `;
                if (publicContainer) publicContainer.appendChild(card);
                if (art.category.includes('Loreto') && loretoContainer) loretoContainer.appendChild(card.cloneNode(true));
                if (art.category.includes('Lima') && limaContainer) limaContainer.appendChild(card.cloneNode(true));
                if (art.category.includes('Mundo') && mundoContainer) mundoContainer.appendChild(card.cloneNode(true));
            });
        }
    } catch (err) {
        console.error('Error cargando artículos:', err);
    }
}

async function loadVideos() {
    try {
        const res = await fetch('/api/videos');
        const data = await res.json();
        const container = document.getElementById('videosContainer');
        if (!container) return;
        container.innerHTML = '';

        data.videos.forEach(v => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                <div style="background:#000; height:180px; display:flex; align-items:center; justify-content:center; color:white; border-radius:4px;"><i class="fa-solid fa-play" style="font-size:2.5rem; color:var(--red-journal);"></i></div>
                <h3>${v.title}</h3>
                <p>Duración: ${v.duration} | Disponible hasta 30 días</p>
            `;
            container.appendChild(card);
        });
    } catch (e) {}
}

function checkAuthUI() {
    const btnLogin = document.getElementById('btnAdminAccess');
    const btnLogout = document.getElementById('btnAdminLogout');
    const cmsPanel = document.getElementById('journalistCMSPanel');

    if (authToken) {
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'block';
        if (cmsPanel) cmsPanel.style.display = 'block';
    } else {
        if (btnLogin) btnLogin.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'none';
        if (cmsPanel) cmsPanel.style.display = 'none';
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem('smbin_token');
    checkAuthUI();
    alert('Sesión cerrada.');
    switchTab('portada');
}

async function loadAdminArticles() {
    try {
        const res = await fetch('/api/admin/articles', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        const list = document.getElementById('adminArticlesList');
        if (!list) return;
        list.innerHTML = '<h4>Artículos Registrados (Con Fuentes Internas Editables):</h4>';

        data.articles.forEach(art => {
            const item = document.createElement('div');
            item.style.cssText = "background:white; padding:10px; margin-bottom:8px; border-radius:4px; display:flex; justify-content:space-between; align-items:center;";
            item.innerHTML = `
                <div><strong>${art.title}</strong><br><small style="color:var(--red-journal);">Fuente Interna: ${art.source_internal}</small></div>
                <div>
                    <button class="btn-action blue" onclick="editArticle(${art.id}, '${art.title.replace(/'/g, "")}', '${art.summary.replace(/'/g, "")}', '${art.source_internal}', '${art.smbin_reflection}')">Editar</button>
                    <button class="btn-action red" onclick="deleteArticle(${art.id})">Borrar</button>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (e) {}
}

function editArticle(id, title, summary, source, reflection) {
    document.getElementById('artId').value = id;
    document.getElementById('artTitle').value = title;
    document.getElementById('artSummary').value = summary;
    document.getElementById('artSource').value = source;
    document.getElementById('artReflection').value = reflection;
    document.getElementById('modalArticleTitle').innerText = "Editar Noticia y Fuente";
    document.getElementById('articleModal').style.display = 'flex';
}

async function deleteArticle(id) {
    if (!confirm('¿Seguro que deseas eliminar esta noticia?')) return;
    try {
        await fetch(`/api/admin/articles/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        loadArticles();
        loadAdminArticles();
    } catch (e) {}
}

function openLogin() { document.getElementById('loginModal').style.display = 'flex'; }
function closeLogin() { document.getElementById('loginModal').style.display = 'none'; }
function openArticleModal() {
    document.getElementById('articleForm').reset();
    document.getElementById('artId').value = '';
    document.getElementById('modalArticleTitle').innerText = "Nueva Noticia";
    document.getElementById('articleModal').style.display = 'flex';
}
function closeArticleModal() { document.getElementById('articleModal').style.display = 'none'; }
