const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../database');
const dbFile = path.join(dataDir, 'smbin_master.json');

function initDB() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dbFile)) {
        const initialData = {
            users: [
                {
                    id: 1,
                    username: 'miguel.rojas',
                    password: 'password123',
                    fullName: 'Miguel Rojas Panduro (Director General)',
                    role: 'director',
                    email: 'redenlace3@gmail.com'
                }
            ],
            articles: [
                {
                    id: 1,
                    title: "Supervisión fiscal y transparencia en proyectos de infraestructura en Iquitos",
                    summary: "Monitoreo continuo y análisis técnico sobre el cumplimiento legal y la ejecución presupuestal en la provincia de Maynas.",
                    content: "Informe oficial sobre la ejecución de obras públicas en la región Loreto, garantizando el cumplimiento de las normativas vigentes.",
                    image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
                    category: "Loreto (8 Provincias)",
                    province: "Maynas",
                    source_internal: "Fiscalía Anticorrupción de Loreto - Expediente 2026",
                    smbin_reflection: "La fiscalización comunitaria y el periodismo independiente son indispensables para resguardar la adecuada inversión de los bienes públicos.",
                    published_at: new Date().toISOString()
                }
            ],
            videos: [
                {
                    id: 1,
                    title: "Noticiero Central 'Tú Decides' - Edición Especial Región Loreto",
                    duration: "45 min",
                    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                    date: new Date().toISOString()
                }
            ],
            citizen_reports: []
        };
        fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf8');
    }
}

function getDB() {
    initDB();
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { getDB, saveDB };
