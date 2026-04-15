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

    let sudahMintaKode = false

    sock.ev.on("connection.update", async (update) => {
        const { connection } = update

        if (connection === "connecting" && !sudahMintaKode) {
            sudahMintaKode = true

            const nomor = "6283847956426" // GANTI NOMOR KAMU
            const code = await sock.requestPairingCode(nomor)

            console.log("\n🔑 KODE PAIRING:", code)
        }

        if (connection === "open") {
            console.log("✅ BOT CONNECTED!")
        }

        if (connection === "close") {
            console.log("❌ Koneksi terputus...")
        }
    })
}

startBot()