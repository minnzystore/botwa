module.exports = {
    name: "kick",
    execute: async (sock, from, text, db, OWNER, msg) => {

        try {
            // ❌ hanya untuk grup
            if (!from.endsWith("@g.us")) {
                return sock.sendMessage(from, {
                    text: "❌ Fitur ini hanya untuk grup!"
                })
            }

            const sender = msg.key.participant || msg.key.remoteJid

            // 🔍 ambil data grup
            const metadata = await sock.groupMetadata(from)
            const participants = metadata.participants

            // 🔐 cek admin
            const isAdmin = participants.find(p => p.id === sender)?.admin
            const isBotAdmin = participants.find(p => p.id === sock.user.id)?.admin

            if (!isAdmin && sender !== OWNER) {
                return sock.sendMessage(from, {
                    text: "❌ Kamu bukan admin!"
                })
            }

            if (!isBotAdmin) {
                return sock.sendMessage(from, {
                    text: "❌ Bot bukan admin!"
                })
            }

            // 🎯 ambil target
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid

            if (!mentioned || mentioned.length === 0) {
                return sock.sendMessage(from, {
                    text: "❌ Tag member yang mau di kick!\n\nContoh: kick @user"
                })
            }

            const target = mentioned[0]

            // 🚫 jangan kick owner
            if (target === OWNER) {
                return sock.sendMessage(from, {
                    text: "❌ Tidak bisa kick owner!"
                })
            }

            // ⚡ eksekusi kick
            await sock.groupParticipantsUpdate(from, [target], "remove")

            await sock.sendMessage(from, {
                text: "✅ Member berhasil di kick!"
            })

        } catch (err) {
            console.log(err)
            sock.sendMessage(from, {
                text: "❌ Terjadi error saat kick!"
            })
        }
    }
}