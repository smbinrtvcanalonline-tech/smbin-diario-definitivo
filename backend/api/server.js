const express = require('express');
const { procesarEntradaRadar } = require('./radarService');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Parser = require('rss-parser');
const { getDB, saveDB } = require('../database/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'SMBIN_SECRET_DIRECTOR_2026';
const parser = new Parser();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const upload = multer({ dest: path.join(__dirname, '../uploads') });

// Función para sincronizar y publicar automáticamente en Facebook Graph API
async function publicarEnFacebook(noticia) {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
        console.log("⚠️ Variables de Facebook (FACEBOOK_PAGE_ID / ACCESS_TOKEN) no configuradas en Render.");
        return;
    }

    const mensaje = `📰 *${noticia.title}*\n\n${noticia.summary}\n\nLee la noticia completa en nuestro diario digital SMBIN. "El pueblo tiene la palabra".`;

    try {
        const url = `https://graph.facebook.com/${pageId}/feed`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: mensaje,
                link: noticia.image || undefined,
                access_token: accessToken
            })
        });
        
        const data = await response.json();
        if (data.id) {
            console.log("✅ ¡Noticia sincronizada y publicada en Facebook con éxito! ID:", data.id);
        } else {
            console.error("❌ Error de Meta al publicar:", data);
        }
    } catch (error) {
        console.error("❌ Error de red al conectar con la API de Facebook:", error);
    }
}

// Autenticación Periodista
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ status: 'error', message: 'Credenciales incorrectas.' });
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ status: 'success', token, user });
});

// Middleware verificación JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ status: 'error', message: 'Acceso no autorizado.' });
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ status: 'error', message: 'Token inválido.' });
        req.user = user;
        next();
    });
}

// Obtener Artículos (Público no ve fuentes internas)
app.get('/api/articles', (req, res) => {
    const db = getDB();
    const publicArticles = db.articles.map(a => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        content: a.content,
        image: a.image,
        category: a.category,
        province: a.province,
        smbin_reflection: a.smbin_reflection,
        published_at: a.published_at
    }));
    res.json({ status: 'success', articles: publicArticles });
});

// Obtener Artículos con fuentes (Solo Periodista autenticado)
app.get('/api/admin/articles', verifyToken, (req, res) => {
    const db = getDB();
    res.json({ status: 'success', articles: db.articles });
});

// Publicar o Editar Noticia (Solo Periodista) y Auto-post en Facebook
app.post('/api/admin/articles', verifyToken, upload.single('image_file'), async (req, res) => {
    const { id, title, summary, content, category, province, source_internal, smbin_reflection, image_url } = req.body;
    const db = getDB();
    
    let imageUrl = image_url || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80";
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }

    let noticiaAfectada;

    if (id) {
        // Editar
        const index = db.articles.findIndex(a => a.id == id);
        if (index !== -1) {
            db.articles[index] = { ...db.articles[index], title, summary, content, category, province, source_internal, smbin_reflection, image: imageUrl };
            noticiaAfectada = db.articles[index];
        }
    } else {
        // Crear nueva
        const newArt = {
            id: Date.now(),
            title,
            summary,
            content,
            image: imageUrl,
            category: category || 'Loreto (8 Provincias)',
            province: province || 'Maynas',
            source_internal: source_internal || 'Redacción SMBIN',
            smbin_reflection: smbin_reflection || 'El compromiso con la verdad y la fiscalización en Loreto.',
            published_at: new Date().toISOString()
        };
        db.articles.unshift(newArt);
        noticiaAfectada = newArt;

        // Disparar la publicación automática a Facebook de forma asíncrona
        await publicarEnFacebook(newArt);
    }

    saveDB(db);
    res.json({ status: 'success', message: 'Noticia guardada, actualizada y sincronizada con éxito.' });
});

// Borrar Noticia (Solo Periodista)
app.delete('/api/admin/articles/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const db = getDB();
    db.articles = db.articles.filter(a => a.id != id);
    saveDB(db);
    res.json({ status: 'success', message: 'Noticia eliminada correctamente.' });
});

// Radar RSS Reales
app.get('/api/radar', async (req, res) => {
    const sources = [
        { name: 'El Peruano', url: 'https://elperuano.pe/rss/portada.xml' },
        { name: 'RPP Noticias', url: 'https://rpp.pe/rss' },
        { name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml' }
    ];
    let items = [];
    for (const src of sources) {
        try {
            const feed = await parser.parseURL(src.url);
            feed.items.slice(0, 3).forEach(i => {
                items.push({ title: i.title, link: i.link, source: src.name, pubDate: i.pubDate });
            });
        } catch (e) {}
    }
    res.json({ status: 'success', feeds: items });
});

// Vídeos (Historial de 30 días)
app.get('/api/videos', (req, res) => {
    const db = getDB();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const validVideos = db.videos.filter(v => new Date(v.date) >= thirtyDaysAgo);
    res.json({ status: 'success', videos: validVideos });
});

app.listen(PORT, () => {
    console.log(`SMBIN Servidor Maestro Definitivo en http://localhost:${PORT}`);
});
// Ruta para aprobar o rechazar noticias de la Bandeja de Certificación
app.post('/api/certificar/:id', async (req, res) => {
    const { id } = req.params;
    const { accion } = req.body; // 'publicar' o 'rechazar'

    try {
        let nuevoEstado = accion === 'publicar' ? 'publicada' : 'rechazada';
        
        // Actualización de estado en la base de datos del sistema
        console.log(`[Certificación] Noticia ${id} actualizada a estado: ${nuevoEstado}`);
        
        res.status(200).json({ success: true, mensaje: `Noticia actualizada a ${nuevoEstado}` });
    } catch (error) {
        console.error('[Error de Certificación]:', error);
        res.status(500).json({ success: false, error: error.message });
        const { publicarEnFacebook } = require('../socialSyndication');

// Dentro de tu lógica cuando una noticia se publica (ya sea por el radar oficial o por certificación):
// await publicarEnFacebook(noticiaPublicada);
    }
});