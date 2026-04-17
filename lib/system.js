const fs = require("fs")

const loadDB = () => {
    return JSON.parse(fs.readFileSync("./database/users.json"))
}

const saveDB = (data) => {
    fs.writeFileSync("./database/users.json", JSON.stringify(data, null, 2))
}

const delay = (ms) => new Promise(res => setTimeout(res, ms))

// 🔥 QUEUE
const queue = []
let running = false

const runQueue = async () => {
    if (running) return
    running = true

    while (queue.length > 0) {
        const job = queue.shift()
        await job()
        await delay(Math.floor(Math.random() * 2000) + 1000)
    }

    running = false
}

module.exports = { loadDB, saveDB, delay, queue, runQueue }