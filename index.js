const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys")
const P = require("pino")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "120.0.0.0"]
    })

    sock.ev.on("creds.update", saveCreds)

    let sudahKirim = false

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "connecting") {
            console.log("🔄 Menghubungkan...")
        }

        if (connection === "open") {
            console.log("✅ BOT CONNECTED!")
        }

        // 🔥 pairing code dengan delay (FIX ERROR 428)
        if (!sudahKirim && connection === "connecting") {
            sudahKirim = true

            const nomor = "6283847956426" // ✅ NOMOR KAMU

            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(nomor)
                    console.log("\n🔑 KODE PAIRING:", code)
                } catch (err) {
                    console.log("❌ Gagal ambil pairing:", err.message)
                }
            }, 3000)
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode

            console.log("❌ Disconnect:", reason)

            if (reason === DisconnectReason.loggedOut) {
                console.log("⚠️ Session logout, scan ulang!")
            } else {
                console.log("🔄 Reconnecting...")
                startBot()
            }
        }
    })
}

startBot()