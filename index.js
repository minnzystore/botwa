const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")
const qrcode = require("qrcode-terminal")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "120.0.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update

        if (qr) {
            console.log("\nScan QR di WhatsApp:\n")
            qrcode.generate(qr, { small: true })
        }

        if (connection === "open") {
            console.log("✅ Bot berhasil connect!")
        }

        if (connection === "close") {
            console.log("❌ Koneksi terputus, reconnect...")
            startBot()
        }
    })

    sock.ev.on("messages.upsert", async (msg) => {
        const m = msg.messages[0]
        if (!m.message) return

        const text = m.message.conversation || m.message.extendedTextMessage?.text

        console.log("📩 Pesan:", text)

        if (text === "hai") {
            await sock.sendMessage(m.key.remoteJid, { text: "Halo juga 👋" })
        }
    })
}

startBot()
