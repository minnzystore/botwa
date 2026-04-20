const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys")
const P = require("pino")
const qrcode = require("qrcode-terminal")
const fs = require("fs")

const { loadDB, saveDB, queue, runQueue } = require("./lib/system")

const owner = "6283847956426@s.whatsapp.net"

global.processed = new Set()
global.lastMsg = {}
global.reqCount = {}
global.confessDB = {}

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

// ❗ ANTI CRASH
process.on("uncaughtException", (err) => {
    console.log("IGNORED ERROR:", err.message)
})

// =========================
// WIB TIME
// =========================
function getWIBTime() {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    })
    const parts = formatter.formatToParts(now)
    const get = (type) => parts.find(p => p.type === type)?.value

    return {
        date: `${get("year")}-${get("month")}-${get("day")}`,
        time: `${get("hour")}:${get("minute")}:${get("second")}`
    }
}

// =========================
// ANTI SPAM
// =========================
function allowRequest(user) {
    const now = Date.now()

    if (!global.reqCount[user]) {
        global.reqCount[user] = { count: 1, time: now }
        return true
    }

    const data = global.reqCount[user]

    if (now - data.time > 5000) {
        global.reqCount[user] = { count: 1, time: now }
        return true
    }

    data.count++
    return data.count <= 5
}

// =========================
// SAFE SEND
// =========================
async function safeSend(sock, jid, msg) {
    try {
        await sock.sendMessage(jid, msg)
        await sleep(800)
    } catch (e) {
        console.log("SEND ERROR:", e)
    }
}

// =========================
// START BOT
// =========================
async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) qrcode.generate(qr, { small: true })

        if (connection === "open") {
            console.log("✅ BOT ONLINE")
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log("❌ DISCONNECT:", reason)

            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startBot(), 3000)
            }
        }
    })

    // =========================
    // LOAD COMMAND
    // =========================
    const commands = new Map()

    if (fs.existsSync("./commands")) {
        for (const file of fs.readdirSync("./commands")) {
            const cmd = require(`./commands/${file}`)
            if (cmd?.name && cmd?.execute) {
                commands.set(cmd.name.toLowerCase(), cmd)
            }
        }
    }

    // =========================
    // MESSAGE
    // =========================
    sock.ev.on("messages.upsert", async (msg) => {
        try {
            const m = msg.messages?.[0]
            if (!m || !m.message || m.key.fromMe) return

            const id = m.key.id
            if (global.processed.has(id)) return
            global.processed.add(id)

            const from = m.key.remoteJid
            const text = (
                m.message?.conversation ||
                m.message?.extendedTextMessage?.text ||
                ""
            ).trim()

            if (!text) return

            const command = text.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
            const cmd = commands.get(command)

            if (!cmd) return

            queue.push(async () => {
                await cmd.execute(sock, from, text)
            })

            runQueue()

        } catch (e) {
            console.log("ERROR:", e)
        }
    })
}

startBot()