module.exports = {
    name: "menu",
    execute: async (sock, from, text, db) => {

        const user = db[from] || { name: "User" }

        // =========================
        // WIB TIME FIXED
        // =========================
        const now = new Date()

        const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
        const wib = new Date(utc + (7 * 60 * 60 * 1000))

        const pad = (n) => String(n).padStart(2, "0")

        const date = `${wib.getFullYear()}-${pad(wib.getMonth() + 1)}-${pad(wib.getDate())}`
        const time = `${pad(wib.getHours())}:${pad(wib.getMinutes())}:${pad(wib.getSeconds())}`

        const caption = `
╭─❖「 𝗠𝗶𝗸𝗮𝘀𝗮 𝗕𝗼𝘁 」❖─
│
│ 👑 Owner Bot : Mikasa Amerta
│ 👤 Nama      : ${user.name || "User"}
│ 📅 Tanggal   : ${date}
│ ⏰ Jam WIB   : ${time}
│
╰─❖──────────────❖─

📌 MENU BOT

• .owner
• .confess
• .ttmp4
• .ttmp3
• .ytmp4
• .ytmp3

✧ Mikasa Bot 🤍
`

        try {
            await sock.sendMessage(from, { text: caption })
        } catch (err) {
            console.log("MENU ERROR:", err)

            await sock.sendMessage(from, {
                text: "❌ Gagal menampilkan menu"
            }).catch(() => {})
        }
    }
}