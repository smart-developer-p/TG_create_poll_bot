const { Telegraf } = require('telegraf');
const fs = require('fs');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const INTERVAL_MS = process.env.INTERVAL_MS || 3600000; // Set interval to 1 hour (3600000 ms)

// Replace with your bot token
const bot = new Telegraf(BOT_TOKEN);

// Load polls from JSON file

// Function to send a random poll
const sendRandomPoll = (ctx) => {
    const polls = JSON.parse(fs.readFileSync('polls.json', 'utf8'));
    const randomPoll = polls[Math.floor(Math.random() * polls.length)];

    if (randomPoll.type === "regular") {
        ctx.telegram.sendPoll(ctx.chat.id, randomPoll.question, randomPoll.options);
    } else if (randomPoll.type === "quiz") {
        ctx.telegram.sendPoll(
            ctx.chat.id,
            randomPoll.question,
            randomPoll.options,
            { type: "quiz", correct_option_id: randomPoll.correct_option_id }
        );
    }
    console.log(`Poll sent: ${randomPoll.question}`);
};

// Start command to initialize the bot
bot.command('start', (ctx) => {
    ctx.reply('Poll bot started! I will send polls regularly.');
});

// Command to send a poll immediately
bot.command('poll', (ctx) => {
    sendRandomPoll(ctx);
});

// Regularly send polls
bot.on('text', (ctx) => {
    if (ctx.chat && ctx.chat.type === 'supergroup') {
        ctx.reply('Poll bot started! I will send polls regularly.');
        sendRandomPoll(ctx);
        setInterval(() => {
            sendRandomPoll(ctx);
        }, INTERVAL_MS);
    }
});

bot.launch();
console.log('Bot is running...');
