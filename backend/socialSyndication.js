// Módulo de Sindicación Automática para SMBIN (Facebook y Redes)
const fetch = require('node-fetch');

async function publicarEnFacebook(noticia) {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
        console.log("[Social Syndication] Variables de Facebook no configuradas en el entorno.");
        return { success: false, razon: "Credenciales faltantes" };
    }

    const mensaje = `🚨 ${noticia.titulo}\n\n${noticia.contenido}\n\n👉 Entérate de más detalles en nuestro portal oficial bajo nuestra línea editorial: "El pueblo tiene la palabra".`;

    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: mensaje,
                link: noticia.fuente || 'https://smbin-diario-definitivo.onrender.com',
                access_token: accessToken
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`[Facebook] Noticia publicada con éxito en la página oficial. ID: ${data.id}`);
            return { success: true, postId: data.id };
        } else {
            console.error(`[Facebook Error]:`, data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error(`[Social Error de Red]:`, error);
        return { success: false, error: error.message };
    }
}

module.exports = { publicarEnFacebook };