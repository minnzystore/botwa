module.exports = {
    name: "premium",
    execute: async (sock, from, text, db) => {

        const user = db[from]

        if (user.premium) {
            return sock.sendMessage(from, {
                text: "✅ Kamu sudah PREMIUM!"
            })
        }

        if (user.pendingPremium) {
            return sock.sendMessage(from, {
                text: "⏳ Kamu sudah mengajukan premium, tunggu respon owner."
            })
        }

        const reason = text.split(" ").slice(1).join(" ") || "Tidak disebutkan"

        user.pendingPremium = true
        user.premiumStatus = "pending"
        user.premiumReason = reason
        user.premiumRequestAt = Date.now()

        saveDB(db)

        await sock.sendMessage(from, {
            text: `📩 Request Premium terkirim!\n\n📝 Alasan: ${reason}`
        })

        // kirim ke owner
        await sock.sendMessage(OWNER, {
            text: `
🔔 PREMIUM REQUEST

👤 User: ${from}
📛 Nama: ${user.name}
📝 Alasan: ${reason}
⏰ Waktu: ${new Date().toLocaleString()}

Pilih aksi:
👉 approve ${from}
👉 reject ${from}
`
        })
    }
}