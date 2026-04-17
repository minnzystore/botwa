const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const P = require("pino")
const qrcode = require("qrcode-terminal")
const fs = require("fs")

const { loadDB, saveDB, queue, runQueue } = require("./lib/system")

global.processed = new Set()
global.lastMsg = {}
global.reqCount = {}
global.confessDB = {}

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

// =========================
// WIB TIME FIX
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
        auth: state
    })

    sock.ev.on("creds.update", saveCreds)

    // =========================
    // 🔥 ANTI MATI (AUTO RECONNECT)
    // =========================
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) qrcode.generate(qr, { small: true })

        if (connection === "open") {
            console.log("✅ BOT ONLINE")
        }

        if (connection === "close") {
            console.log("❌ DISCONNECT → RESTART...")

            setTimeout(() => {
                startBot()
            }, 3000)
        }
    })

    const commands = new Map()

    if (fs.existsSync("./commands")) {
        for (const file of fs.readdirSync("./commands")) {
            const cmd = require(`./commands/${file}`)
            if (cmd?.name && cmd?.execute) commands.set(cmd.name, cmd)
        }
    }

    sock.ev.on("messages.upsert", async (msg) => {
        try {

            const m = msg.messages?.[0]
            if (!m?.message || m.key.fromMe || m.key.remoteJid === "status@broadcast") return

            const id = m.key.id
            if (!id || global.processed.has(id)) return
            global.processed.add(id)
            setTimeout(() => global.processed.delete(id), 60000)

            const from = m.key.remoteJid

            const sender = m.key.participant || m.key.remoteJid

            const pushname =
                m.pushName ||
                m.message?.pushName ||
                "User"

            const userJid = sender

            // =========================
            // ANTI SPAM
            // =========================
            const nowTime = Date.now()
            if (global.lastMsg[from] && nowTime - global.lastMsg[from] < 2000) return
            global.lastMsg[from] = nowTime

            if (!allowRequest(from)) return

            const text = (
                m.message?.conversation ||
                m.message?.extendedTextMessage?.text ||
                m.message?.imageMessage?.caption ||
                m.message?.videoMessage?.caption ||
                ""
            ).toString().trim()

            if (!text) return

            const { date, time } = getWIBTime()

            console.log("📩 MSG:", from, text)
            console.log(`🕒 WIB TIME: ${date} | ${time}`)

            let db = loadDB()

            if (!db[userJid]) {
                db[userJid] = {
                    name: pushname,
                    createdAt: date,
                    createdTime: time
                }
            }

            // =========================
            // CONFESS SYSTEM (REPLY 1X)
            // =========================
            const context = m.message?.extendedTextMessage?.contextInfo
            const replyId = context?.stanzaId

            if (replyId && global.confessDB[replyId]) {

                const session = global.confessDB[replyId]

                if (!session.used) {
                    session.used = true

                    await safeSend(sock, session.from, {
                        text: `💬 Reply confess:\n\n${text}`
                    })

                    await safeSend(sock, from, {
                        text: "⚠️ Reply sudah digunakan (1x saja)"
                    })
                }

                return
            }

            // =========================
            // COMMAND HANDLER
            // =========================
            const command = text.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
            const cmd = commands.get(command)

            if (!cmd) return

            queue.push(async () => {
                try {
                    await cmd.execute(sock, userJid, text, db, safeSend, global.confessDB)
                } catch (e) {
                    console.log("CMD ERROR", e)
                }
            })

            runQueue()

        } catch (e) {
            console.log("ERROR", e)
        }
    })

    setInterval(() => {
        global.processed.clear()
        global.reqCount = {}
    }, 60000)
}

startBot()