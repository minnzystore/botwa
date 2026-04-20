const { exec } = require("child_process");
const fs = require("fs");

module.exports = {
  name: "ytmp4",
  execute: async (sock, from, text) => {
    try {
      const url = text.split(" ")[1];
      if (!url) {
        return sock.sendMessage(from, { text: "❌ Contoh:\n.ytmp4 link" });
      }

      await sock.sendMessage(from, { text: "⏳ Downloading video..." });

      const file = `./temp/${Date.now()}.mp4`;

      exec(`yt-dlp -f mp4 -o "${file}" ${url}`, async (err) => {
        if (err) {
          console.log(err);
          return sock.sendMessage(from, { text: "❌ Gagal download video" });
        }

        await sock.sendMessage(from, {
          video: fs.readFileSync(file),
          caption: "✅ Done"
        });

        fs.unlinkSync(file);
      });

    } catch (e) {
      console.log(e);
      sock.sendMessage(from, { text: "❌ Error MP4" });
    }
  }
};