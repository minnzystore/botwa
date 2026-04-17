module.exports = {
    name: "confess",
    execute: async (sock, from, text) => {

        // =========================
        // HELP
        // =========================
        if (text.toLowerCase() === "confess") {
            return sock.sendMessage(from, {
                text: "Format:\nconfess 62xxx|nama|pesan"
            })
        }

        const args = text.split(" ").slice(1).join(" ")
        const [nomor, nama, pesan] = args.split("|")

        if (!nomor || !nama || !pesan) {
            return sock.sendMessage(from, {
                text: "❌ Format salah!\nconfess 62xxx|nama|pesan"
            })
        }

        const target = nomor + "@s.whatsapp.net"

        // =========================
        // STORE SESSION (biar bisa reply 1x)
        // =========================
        if (!global.confessDB) global.confessDB = {}

        const msg = await sock.sendMessage(target, {
            text:
`💌 PESAN RAHASIA

${pesan}

👤 Dari: ${nama}

────────────────
✍ Balas pesan ini (1x saja)`
        })

        // simpan data untuk reply
        global.confessDB[msg.key.id] = {
            from,
            target,
            used: false
        }

        await sock.sendMessage(from, {
            text: "✅ Confess terkirim!"
        })
    }
}