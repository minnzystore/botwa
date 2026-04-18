module.exports = {
    name: "kick",
    execute: async (sock, from, text, db, safeSend, confessDB, OWNER, msg) => {

        try {
            // ❌ hanya untuk grup
            if (!from.endsWith("@g.us")) {
                return safeSend(sock, from, {
                    text: "❌ Fitur ini hanya untuk grup!"
                })
            }

            // 🔥 FIX PARTICIPANT (ANTI ERROR)
            const sender = msg?.key?.participant || msg?.key?.remoteJid

            // 🔍 ambil data grup
            const metadata = await sock.groupMetadata(from)
            const participants = metadata.participants

            // 🔐 cek admin
            const isAdmin = participants.find(p => p.id === sender)?.admin
            const isBotAdmin = participants.find(p => p.id === sock.user.id)?.admin

            if (!isAdmin && sender !== OWNER) {
                return safeSend(sock, from, {
                    text: "❌ Kamu bukan admin!"
                })
            }

            if (!isBotAdmin) {
                return safeSend(sock, from, {
                    text: "❌ Bot bukan admin!"
                })
            }

            // =========================
            // 🎯 AMBIL TARGET (TAG / REPLY)
            // =========================
            let target

            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant

            if (mentioned && mentioned.length > 0) {
                target = mentioned[0]
            } else if (quoted) {
                target = quoted
            }

            if (!target) {
                return safeSend(sock, from, {
                    text: "❌ Tag atau reply member yang mau di kick!\n\nContoh:\n• kick @user\n• reply pesan lalu ketik kick"
                })
            }

            // 🚫 jangan kick owner
            if (target === OWNER) {
                return safeSend(sock, from, {
                    text: "❌ Tidak bisa kick owner!"
                })
            }

            // 🚫 jangan kick diri sendiri (optional)
            if (target === sender) {
                return safeSend(sock, from, {
                    text: "❌ Kamu tidak bisa kick diri sendiri!"
                })
            }

            // ⚡ eksekusi kick
            await sock.groupParticipantsUpdate(from, [target], "remove")

            await safeSend(sock, from, {
                text: "✅ Member berhasil di kick!"
            })

        } catch (err) {
            console.log("KICK ERROR:", err)

            safeSend(sock, from, {
                text: "❌ Terjadi error saat kick!"
            })
        }
    }
}