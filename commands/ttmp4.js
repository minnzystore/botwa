const axios = require("axios")

module.exports = {
    name: "ttmp4",
    execute: async (sock, from, text) => {

        const url = text.split(" ")[1]
        if (!url) return

        const res = await axios.get(`https://www.tikwm.com/api/?url=${url}`)
        const data = res.data.data

        await sock.sendMessage(from, {
            video: { url: data.play },
            caption: "🎥 TikTok Video"
        })
    }
}