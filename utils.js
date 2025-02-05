const path = require("path");
const fs = require("fs");

const USERS_FILE = path.join(process.cwd(), "bet", "db", 'users.json');
const STATUS_FILE = path.join(process.cwd(), "bet", "db", 'status.json');

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
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.log(err.message);
    }
};

exports.readUsers = async () => {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
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
        fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
    } catch (err) {
        console.log(err.message);
    }
};

exports.readStatus = async () => {
    try {
        if (fs.existsSync(STATUS_FILE)) {
            return JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
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

exports.hexToBase64 = (hex) => {
    // Convert hex string to a byte array
    let bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    // Convert byte array to Base64
    return btoa(String.fromCharCode.apply(null, bytes));
};