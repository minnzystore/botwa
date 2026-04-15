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

    let sudahPairing = false

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "connecting") {
            console.log("🔄 Menghubungkan ke WhatsApp...")
        }

        // 🔥 FIX: tunggu sedikit setelah connecting
        if (!sudahPairing && connection === "connecting") {
            sudahPairing = true

            setTimeout(async () => {
                try {
                    const nomor = "6283847956426"
                    const code = await sock.requestPairingCode(nomor)

                    console.log("\n🔑 KODE PAIRING:", code)
                    console.log("⚡ Masukkan ke WhatsApp SECEPATNYA!")
                } catch (err) {
                    console.log("❌ Pairing gagal:", err.message)
                }
            }, 7000) // ⏱️ delay 7 detik (lebih aman)
        }

        if (connection === "open") {
            console.log("✅ BOT CONNECTED!")
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode

            console.log("❌ Disconnect:", reason)

            if (reason === DisconnectReason.loggedOut) {
                console.log("⚠️ Session logout, ulang pairing!")
                sudahPairing = false
            } else {
                console.log("🔄 Reconnecting...")
                startBot()
            }
        }
    })
}

startBot()