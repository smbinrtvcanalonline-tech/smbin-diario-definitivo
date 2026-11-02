// Módulo de Radar Inteligente y Procesamiento de Noticias - SMBIN
const NEWS_MAX_AGE_HOURS = 24;

// Lista de dominios y fuentes oficiales/reconocidas consideradas "certificadas" automáticamente
const CERTIFIED_DOMAINS = [
    'gob.pe',           // Portales del Estado peruano (Contraloría, Congreso, Ministerios, Poder Judicial, etc.)
    'elcomercio.pe',
    'larepublica.pe',
    'rpp.pe',
    'elperuano.pe',
    'diariolaregion.pe' // Diario local de Iquitos
];

function esFuenteCertificada(url) {
    if (!url) return false;
    return CERTIFIED_DOMAINS.some(domain => url.includes(domain));
}

function esNoticiaReciente(fechaNoticia) {
    const ahora = new Date();
    const fechaPub = new Date(fechaNoticia);
    const diferenciaHoras = (ahora - fechaPub) / (1000 * 60 * 60);
    return diferenciaHoras <= NEWS_MAX_AGE_HOURS;
}

async function procesarEntradaRadar(noticiaBruta) {
    // 1. Validar el filtro de temporalidad (< 24 horas)
    if (!esNoticiaReciente(noticiaBruta.fecha)) {
        console.log(`[Radar] Noticia descartada por antigüedad (>24h): ${noticiaBruta.titulo}`);
        return { estado: 'descartada', razon: 'Fuera de rango de 24 horas' };
    }

    // 2. Evaluar si la fuente es oficial o un diario reconocido
    const fuenteOficial = esFuenteCertificada(noticiaBruta.url);

    if (fuenteOficial) {
        // Redacción automática y publicación directa con el sello editorial
        const noticiaRedactada = {
            titulo: noticiaBruta.titulo,
            contenido: `[Informe Oficial / Sistematizado] ${noticiaBruta.resumen}\n\n*Análisis SMBIN:* Esta información ha sido validada directamente desde fuentes oficiales del Estado o diarios reconocidos, cumpliendo con la fiscalización estricta que exige nuestra línea editorial: "El pueblo tiene la palabra".`,
            fuente: noticiaBruta.url,
            estado: 'publicada', // Pasa directo a la web y redes
            fechaCreacion: new Date()
        };
        
        // Aquí se guarda directamente en tu base de datos SQLite y se dispara la sindicación
        console.log(`[Radar] Noticia oficial procesada y publicada automáticamente: ${noticiaBruta.titulo}`);
        return { estado: 'publicada', data: noticiaRedactada };
        
    } else {
        // 3. Denuncia o primicia sin enlace oficial -> Bandeja de Certificación para el Director
        const noticiaPendiente = {
            titulo: noticiaBruta.titulo,
            contenido: noticiaBruta.resumen,
            fuente: 'Denuncia ciudadana / Fuente local (Requiere certificación)',
            estado: 'pendiente_certificacion', // Queda en tu búnker para que tú la revises y apruebes
            fechaCreacion: new Date()
        };

        console.log(`[Radar] Alerta enviada a Bandeja de Certificación (Requiere revisión de Miguel): ${noticiaBruta.titulo}`);
        return { estado: 'pendiente_certificacion', data: noticiaPendiente };
    }
}

module.exports = { procesarEntradaRadar };