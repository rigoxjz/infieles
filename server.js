// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuración
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

// Configurar PostgreSQL
const databaseUrl = process.env.DATABASE_URL || 
    'postgresql://infieles:cQ1eK3awcS9J8l6pgLm0P20VbLZikt5W@dpg-d4rm7umuk2gs73eauuug-a.virginia-postgres.render.com/dbinfieles';

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

// Configurar Multer
let storage;
if (isProduction) {
    storage = multer.memoryStorage();
} else {
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = 'uploads/';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
            cb(null, uniqueName);
        }
    });
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// Servir uploads solo en desarrollo
if (!isProduction) {
    app.use('/uploads', express.static('uploads'));
}

// Middleware para errores de multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande (máximo 5MB)' });
        }
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

// ========== RUTAS API ==========

// 1. Obtener todos los infieles
app.get('/api/infieles', async (req, res) => {
    try {
        const search = req.query.search || '';
        const query = `
            SELECT i.*, 
                   COUNT(DISTINCT p.id) as total_pruebas,
                   COUNT(DISTINCT c.id) as total_comentarios
            FROM infieles i
            LEFT JOIN pruebas p ON i.id = p.infiel_id
            LEFT JOIN comentarios c ON i.id = c.infiel_id
            WHERE LOWER(i.nombre) LIKE LOWER($1) 
               OR LOWER(i.apellido) LIKE LOWER($1)
               OR LOWER(i.ubicacion) LIKE LOWER($1)
            GROUP BY i.id
            ORDER BY i.fecha DESC
        `;
        const result = await pool.query(query, [`%${search}%`]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo infieles:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// 2. Crear nuevo infiel
app.post('/api/infieles', upload.array('pruebas', 10), async (req, res) => {
    try {
        const { reportero, nombre, apellido, edad, ubicacion, historia } = req.body;
        const files = req.files || [];

        // Validaciones
        if (!nombre || !apellido || !edad || !ubicacion || !historia) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Insertar infiel
        const infielResult = await pool.query(
            `INSERT INTO infieles (reportero, nombre, apellido, edad, ubicacion, historia) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [reportero || 'Anónimo', nombre, apellido, parseInt(edad), ubicacion, historia]
        );

        const infielId = infielResult.rows[0].id;

        // Guardar imágenes
        if (files.length > 0) {
            for (const file of files) {
                let imageUrl;
                if (isProduction) {
                    // En producción, guardar en base64 o usar servicio externo
                    imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                } else {
                    imageUrl = `/uploads/${file.filename}`;
                }
                
                await pool.query(
                    'INSERT INTO pruebas (infiel_id, imagen_url) VALUES ($1, $2)',
                    [infielId, imageUrl]
                );
            }
        }

        // Obtener infiel completo
        const finalResult = await pool.query(`
            SELECT i.*, 
                   COUNT(DISTINCT p.id) as total_pruebas,
                   COUNT(DISTINCT c.id) as total_comentarios
            FROM infieles i
            LEFT JOIN pruebas p ON i.id = p.infiel_id
            LEFT JOIN comentarios c ON i.id = c.infiel_id
            WHERE i.id = $1
            GROUP BY i.id
        `, [infielId]);

        res.status(201).json(finalResult.rows[0]);
    } catch (error) {
        console.error('Error creando infiel:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// 3. Obtener infiel por ID
app.get('/api/infieles/:id', async (req, res) => {
    try {
        const infielId = req.params.id;

        // Obtener infiel
        const infielResult = await pool.query(
            'SELECT * FROM infieles WHERE id = $1',
            [infielId]
        );

        if (infielResult.rows.length === 0) {
            return res.status(404).json({ error: 'Infiel no encontrado' });
        }

        // Obtener pruebas
        const pruebasResult = await pool.query(
            'SELECT * FROM pruebas WHERE infiel_id = $1 ORDER BY created_at',
            [infielId]
        );

        // Obtener comentarios
        const comentariosResult = await pool.query(
            'SELECT * FROM comentarios WHERE infiel_id = $1 ORDER BY fecha DESC',
            [infielId]
        );

        const infiel = infielResult.rows[0];
        infiel.pruebas = pruebasResult.rows;
        infiel.comentarios = comentariosResult.rows;

        res.json(infiel);
    } catch (error) {
        console.error('Error obteniendo infiel:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// 4. Votar
app.post('/api/infieles/:id/votar', async (req, res) => {
    try {
        const { tipo } = req.body;
        const infielId = req.params.id;

        if (tipo !== 'real' && tipo !== 'falso') {
            return res.status(400).json({ error: 'Tipo de voto inválido' });
        }

        const campo = tipo === 'real' ? 'votos_real' : 'votos_falso';
        const result = await pool.query(
            `UPDATE infieles 
             SET ${campo} = ${campo} + 1 
             WHERE id = $1 
             RETURNING votos_real, votos_falso`,
            [infielId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Infiel no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error votando:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// 5. Agregar comentario
app.post('/api/infieles/:id/comentarios', async (req, res) => {
    try {
        const { autor, texto } = req.body;
        const infielId = req.params.id;

        if (!texto) {
            return res.status(400).json({ error: 'El comentario no puede estar vacío' });
        }

        const result = await pool.query(
            `INSERT INTO comentarios (infiel_id, autor, texto) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [infielId, autor || 'Anónimo', texto]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error agregando comentario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// 6. Ruta para servir el index.html en todas las demás rutas (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
    console.log(`📊 Conectado a PostgreSQL`);
    console.log(`📁 Frontend servido desde: ${path.join(__dirname, 'public')}`);
});
