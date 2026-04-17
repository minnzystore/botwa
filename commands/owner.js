module.exports = {
    name: "owner",
    execute: async (sock, from) => {
        await sock.sendMessage(from, { text: "Owner: Mikasa amerta tamfan😎" })
    }
}