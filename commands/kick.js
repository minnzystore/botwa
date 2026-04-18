module.exports = {
    name: "kick",
    execute: async (sock, from, text, db, safeSend, confessDB, owner, msg) => {

        try {
            // ❌ hanya untuk grup
            if (!from.endsWith("@g.us")) {
                return safeSend(sock, from, {
                    text: "❌ Fitur ini hanya untuk grup!"
                })
            }

            // 🔥 ambil sender (fix error undefined)
            const sender = msg.key.participant || msg.key.remoteJid

            // 🔥 ambil nomor bot (FIX FORMAT)
            const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net"

            // 🔍 ambil metadata grup
            const metadata = await sock.groupMetadata(from)
            const participants = metadata.participants

            // 🔐 cek admin user
            const isAdmin =
                participants.find(p => p.id === sender)?.admin === "admin" ||
                participants.find(p => p.id === sender)?.admin === "superadmin"

            // 🔐 cek admin bot
            const isBotAdmin =
                participants.find(p => p.id === botNumber)?.admin === "admin" ||
                participants.find(p => p.id === botNumber)?.admin === "superadmin"

            // ❌ bukan admin
            if (!isAdmin && sender !== owner) {
                return safeSend(sock, from, {
                    text: "❌ Kamu bukan admin!"
                })
            }

            // ❌ bot bukan admin
            if (!isBotAdmin) {
                return safeSend(sock, from, {
                    text: "❌ Bot bukan admin!"
                })
            }

            // 🎯 ambil target dari tag
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid

            if (!mentioned || mentioned.length === 0) {
                return safeSend(sock, from, {
                    text: "❌ Tag member yang mau di kick!\n\nContoh:\nkick @user"
                })
            }

            const target = mentioned[0]

            // 🚫 jangan kick owner
            if (target === owner) {
                return safeSend(sock, from, {
                    text: "❌ Tidak bisa kick owner!"
                })
            }

            // 🚫 jangan kick bot sendiri
            if (target === botNumber) {
                return safeSend(sock, from, {
                    text: "❌ Tidak bisa kick bot!"
                })
            }

            // 🚫 jangan kick admin lain (opsional tapi bagus)
            const isTargetAdmin =
                participants.find(p => p.id === target)?.admin === "admin" ||
                participants.find(p => p.id === target)?.admin === "superadmin"

            if (isTargetAdmin) {
                return safeSend(sock, from, {
                    text: "❌ Tidak bisa kick sesama admin!"
                })
            }

            // ⚡ eksekusi kick
            await sock.groupParticipantsUpdate(from, [target], "remove")

            await safeSend(sock, from, {
                text: "✅ Member berhasil di kick!"
            })

        } catch (err) {
            console.log("KICK ERROR:", err)

            await safeSend(sock, from, {
                text: "❌ Terjadi error saat kick!"
            })
        }
    }
}