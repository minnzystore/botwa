const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "120.0.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    // 🔥 FIX: request pairing langsung setelah socket dibuat
    const nomor = "6283847956426"

    try {
        const code = await sock.requestPairingCode(nomor)
        console.log("\n🔑 KODE PAIRING:", code)
    } catch (err) {
        console.log("❌ Gagal pairing:", err.message)
    }

    sock.ev.on("connection.update", (update) => {
        const { connection } = update

        if (connection === "open") {
            console.log("✅ BOT CONNECTED!")
        }

        if (connection === "close") {
            console.log("❌ Koneksi terputus")
        }
    })
}

startBot()