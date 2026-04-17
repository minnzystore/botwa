module.exports = {
    name: "reject",
    execute: async (sock, from, text, db, OWNER) => {

        const isOwner = from === OWNER
        if (!isOwner) return

        const target = text.split(" ")[1]
        if (!target || !db[target]) {
            return sock.sendMessage(from, { text: "❌ User tidak valid" })
        }

        const user = db[target]

        user.pendingPremium = false
        user.premiumStatus = "rejected"

        saveDB(db)

        await sock.sendMessage(from, {
            text: `❌ REJECTED: ${target}`
        })

        await sock.sendMessage(target, {
            text: "❌ Request premium kamu ditolak."
        })
    }
}