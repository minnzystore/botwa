const ytdl = require("ytdl-core");
const fs = require("fs");
const { exec } = require("child_process");

module.exports = {
  name: "ytmp3",
  execute: async (sock, from, text) => {
    try {
      const args = text.split(" ")
      const url = args[1]

      if (!url || !ytdl.validateURL(url)) {
        return sock.sendMessage(from, {
          text: "❌ Contoh:\n.ytmp3 https://youtube.com/xxxxx"
        })
      }

      const info = await ytdl.getInfo(url)
      const title = info.videoDetails.title.replace(/[^\w\s]/gi, "")
      const output = `${Date.now()}-${title}.mp3`

      const stream = ytdl(url, { filter: "audioonly" })

      const ffmpeg = exec(
        `ffmpeg -i pipe:0 -vn -ab 128k -ar 44100 -y "${output}"`
      )

      stream.pipe(ffmpeg.stdin)

      ffmpeg.on("close", async () => {
        await sock.sendMessage(from, {
          audio: fs.readFileSync(output),
          mimetype: "audio/mp4"
        })

        fs.unlinkSync(output)
      })

    } catch (err) {
      console.log(err)
      sock.sendMessage(from, { text: "❌ Error MP3" })
    }
  }
}