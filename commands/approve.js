module.exports = {
    name: "approve",
    execute: async (sock, from, text, db, OWNER) => {

        const isOwner = from === OWNER
        if (!isOwner) return

        const target = text.split(" ")[1]
        if (!target || !db[target]) {
            return sock.sendMessage(from, { text: "❌ User tidak valid" })
        }

        const user = db[target]

        user.premium = true
        user.pendingPremium = false
        user.premiumStatus = "approved"

        // premium aktif 30 hari
        const expire = Date.now() + (30 * 24 * 60 * 60 * 1000)
        user.premiumExpire = expire

        saveDB(db)

        await sock.sendMessage(from, {
            text: `✅ APPROVED: ${target}`
        })

        await sock.sendMessage(target, {
            text: `🎉 PREMIUM DISETUJUI!\n\n⏳ Aktif 30 hari`
        })
    }
}