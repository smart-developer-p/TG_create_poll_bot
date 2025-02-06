const path = require("path");
const fs = require("fs");
const { Telegraf } = require("telegraf");
const dotenv = require('dotenv');

dotenv.config();

const BOT_TOKEN = process.env.LOG_BOT_TOKEN;
const BOT_OWNER_ID = 7535112310;

const logbot = new Telegraf(BOT_TOKEN);

exports.USERS_FILE = path.join(process.cwd(), "db", 'users.json');
exports.STATUS_FILE = path.join(process.cwd(), "db", 'status.json');
exports.POLLS_FILE = path.join(process.cwd(), "db", 'polls.json');
exports.GROUPS_FILE = path.join(process.cwd(), "db", 'groups.json');
const LOG_FILE = path.join(process.cwd(), "db", 'tg.log');

exports.typingDelay = async (text) => {
    const delay = Math.min(text.length * 10, 500); // Delay based on text length (max 3 seconds)
    await new Promise((resolve) => setTimeout(resolve, delay));
};

exports.shouldReply = (ctx) => {
    if (ctx.update.message.chat && ctx.update.message.chat.type !== "supergroup") return true;

    // Check if the message mentions the bot or is a reply to the bot's message
    return ctx.update.message.text && (
        ctx.update.message.text.includes(`@${ctx.botInfo.username}`) ||
        ctx.update.message.reply_to_message && ctx.update.message.reply_to_message.from.id === ctx.botInfo.id
    );
};



exports.saveUsers = async (users) => {
    try {
        fs.writeFileSync(this.USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.log(err.message);
    }
};

exports.readUsers = async () => {
    try {
        if (fs.existsSync(this.USERS_FILE)) {
            return JSON.parse(fs.readFileSync(this.USERS_FILE, "utf-8"));
        } else {
            return {};
        }
    } catch (err) {
        console.log(err.message);
        return {};
    }
};

exports.saveStatus = async (status) => {
    try {
        fs.writeFileSync(this.STATUS_FILE, JSON.stringify(status, null, 2));
    } catch (err) {
        console.log(err.message);
    }
};

exports.readStatus = async () => {
    try {
        if (fs.existsSync(this.STATUS_FILE)) {
            return JSON.parse(fs.readFileSync(this.STATUS_FILE, "utf-8"));
        } else {
            return {};
        }
    } catch (err) {
        console.log(err.message);
        return {};
    }
};
exports.generateMemo = (userId) => {
    return `TON${userId}`;
};


const DELAY_MS = 1000; // Delay between sending messages (in ms)

const getCurrentTime = () => {
    const date = new Date();
    return `${date.toISOString()}`; // Formats as "2025-02-06T12:34:56.789Z"
};

const sendTGmsg = async (msg) => {
    try {
        // Send previous unsent messages first with delay
        if (fs.existsSync(LOG_FILE)) {
            const unsentMessages = fs.readFileSync(LOG_FILE, 'utf-8').trim();
            if (unsentMessages) {
                const messages = unsentMessages.split('\n\n'); // Split messages by paragraph
                for (const m of messages) {
                    await logbot.telegram.sendMessage(BOT_OWNER_ID, m, { parse_mode: "Markdown" });
                    await delay(DELAY_MS); // Delay between each message
                }
            }
            fs.unlinkSync(LOG_FILE); // Clear log after sending
        }

        // Send the new message separately with delay, and add timestamp
        const timestampedMessage = `[${getCurrentTime()}] ${msg}`;
        await logbot.telegram.sendMessage(BOT_OWNER_ID, timestampedMessage, { parse_mode: "Markdown" });
        await delay(DELAY_MS); // Delay after sending the new message

    } catch (err) {
        console.error("Failed to send Telegram message:", err);
        const timestampedMessage = `[${getCurrentTime()}] ${msg}`;
        fs.appendFileSync(LOG_FILE, timestampedMessage + '\n\n', 'utf-8'); // Save failed message with timestamp to log
    }
};

// Helper function to create delay (in ms)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.log = {
    errror: async (msg) => {
        sendTGmsg(`❌ Error!\n${msg}`);
    },
    info: async (msg) => {
        sendTGmsg(`🔔 Info!\n${msg}`);
    },
    success: async (msg) => {
        sendTGmsg(`✅ Success!\n${msg}`);
    },
    warning: async (msg) => {
        sendTGmsg(`⚠ Warning!\n${msg}`);
    }
};

logbot.launch();
console.log("Log Bot is running...");


process.once("SIGINT", () => logbot.stop("SIGINT"));
process.once("SIGTERM", () => logbot.stop("SIGTERM"));