const { exec } = require("child_process");
const fs = require("fs");

module.exports = {
  name: "ytmp3",
  execute: async (sock, from, text) => {
    try {
      const url = text.split(" ")[1];
      if (!url) {
        return sock.sendMessage(from, { text: "❌ Contoh:\n.ytmp3 link" });
      }

      await sock.sendMessage(from, { text: "⏳ Downloading audio..." });

      const file = `./temp/${Date.now()}.mp3`;

      exec(`yt-dlp -x --audio-format mp3 -o "${file}" ${url}`, async (err) => {
        if (err) {
          console.log(err);
          return sock.sendMessage(from, { text: "❌ Gagal download audio" });
        }

        await sock.sendMessage(from, {
          audio: fs.readFileSync(file),
          mimetype: "audio/mpeg"
        });

        fs.unlinkSync(file);
      });

    } catch (e) {
      console.log(e);
      sock.sendMessage(from, { text: "❌ Error MP3" });
    }
  }
};