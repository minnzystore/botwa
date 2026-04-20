const ytdl = require("ytdl-core");
const fs = require("fs");
const { exec } = require("child_process");

module.exports = {
  name: "ytmp4",
  execute: async (sock, from, text) => {
    try {
      const args = text.split(" ")
      const url = args[1]

      if (!url || !ytdl.validateURL(url)) {
        return sock.sendMessage(from, {
          text: "❌ Contoh:\n.ytmp4 https://youtube.com/xxxxx"
        })
      }

      const info = await ytdl.getInfo(url)
      const title = info.videoDetails.title.replace(/[^\w\s]/gi, "")
      const output = `${Date.now()}-${title}.mp4`

      const stream = ytdl(url, {
        filter: "videoandaudio",
        quality: "highest"
      })

      const ffmpeg = exec(
        `ffmpeg -i pipe:0 -c:v copy -c:a aac -y "${output}"`
      )

      stream.pipe(ffmpeg.stdin)

      ffmpeg.on("close", async () => {
        await sock.sendMessage(from, {
          video: fs.readFileSync(output),
          caption: `✅ ${info.videoDetails.title}`
        })

        fs.unlinkSync(output)
      })

    } catch (err) {
      console.log(err)
      sock.sendMessage(from, { text: "❌ Error MP4" })
    }
  }
}