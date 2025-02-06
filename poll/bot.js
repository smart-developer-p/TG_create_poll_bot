const { Telegraf } = require("telegraf");
const OpenAI = require("openai");
const fs = require("fs");
const dotenv = require("dotenv");
const { systemPrompt, botCommands } = require("./constants");
const { typingDelay, shouldReply, GROUPS_FILE, POLLS_FILE, log } = require('../utils');

dotenv.config();

const BOT_TOKEN = process.env.POLL_BOT_TOKEN;
const Business_ID = process.env.business_connection_id;


const bot = new Telegraf(BOT_TOKEN);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API
});


const userHistories = {};
const MAX_HISTORY = 30;


bot.telegram.setMyCommands(botCommands);

// Start command to initialize the bot
bot.command("start", (ctx) => {
    try {
        ctx.reply("This is a user engage mange bot. Bot chats with users and creates polls, posts news.");
    } catch (error) {
        console.log(error.message);
        log.errror("Poll bot: " + error.message);
    }
});

exports.sendPoll2Groups = async () => {
    try {
        fs.readFile(GROUPS_FILE, 'utf-8', async (err, data) => {

            // Parse the current polls data
            let groups = [];
            if (data) {
                groups = JSON.parse(data);
                for (let i = 0; i < groups.length; i++) {
                    await sendRandomPoll(groups[i]);
                    await (new Promise(resolve => {
                        setTimeout(() => {
                            resolve();
                        }, 1000);
                    }));
                    await log.success("Sent poll to group.");
                }
            }
        });
    } catch (error) {
        console.error('Error sending poll:', error);
        await log.errror("Sending poll to group.");
    }

};

bot.on('new_chat_members', (ctx) => {
    try {
        const chatId = ctx.chat.id;
        console.log(`Bot was added to the group. Group Chat ID: ${chatId}`);

        // Store chat ID in a file
        fs.readFile(GROUPS_FILE, 'utf-8', (err, data) => {

            // Parse the current polls data
            let groups = [];
            if (data) {
                groups = JSON.parse(data);
            }
            console.log(groups.includes(chatId));
            if (groups.includes(chatId)) return;
            // Add the new poll to the polls array
            groups.push(chatId);

            // Write the updated polls back to the JSON file
            fs.writeFile(GROUPS_FILE, JSON.stringify(groups, null, 2), (err) => {

            });
            ctx.reply('Hello! I am now part of your group!');
            log.info("Bot is added to new group!");
        });
        log.errror("Being added to new group!");
    } catch (error) {
        console.log(error.message);
        log.errror("Poll bot: " + error.message);
    }

});

// Command to send a poll immediately
const sendRandomPoll = async (chatID) => {
    try {
        const polls = JSON.parse(fs.readFileSync(POLLS_FILE, "utf8"));
        const randomPoll = polls[Math.floor(Math.random() * polls.length)];

        // Shuffle the options randomly
        const shuffledOptions = randomPoll.options
            .map((option) => ({ option, sort: Math.random() })) // Assign a random sort value to each option
            .sort((a, b) => a.sort - b.sort) // Sort options based on the random sort value
            .map(({ option }) => option); // Extract the shuffled options

        if (randomPoll.type === "regular") {
            bot.telegram.sendPoll(chatID, randomPoll.question, shuffledOptions);
        } else if (randomPoll.type === "quiz") {
            const shuffledCorrectOptionId = shuffledOptions.indexOf(randomPoll.options[randomPoll.correct_option_id]);
            bot.telegram.sendPoll(
                chatID,
                randomPoll.question,
                shuffledOptions,
                { type: "quiz", correct_option_id: shuffledCorrectOptionId }
            );
        }

        console.log(`Poll sent: ${randomPoll.question}`);
    } catch (err) {
        console.log(err.message);
        log.errror("While sending poll.");
    }

};

bot.command("poll", (ctx) => {
    sendRandomPoll(ctx.chat.id);
    log.info("Sent a poll.");
});

//chat bot
bot.on("business_message", async (ctx) => {
    console.log(ctx.update.business_message.chat);
    if (ctx.update.business_message && ctx.update.business_message.business_connection_id == Business_ID) {
        try {
            const userId = ctx.update.business_message.from.id;
            const userMessage = ctx.update.business_message.reply_to_message ? `your message:"${ctx.update.business_message.reply_to_message.text}"\n mine:${ctx.update.business_message.text}` : ctx.update.business_message.text;

            if (!userHistories[userId]) {
                userHistories[userId] = [];
            }

            userHistories[userId].push({ role: "user", content: userMessage });


            if (userHistories[userId].length > MAX_HISTORY * 2) {
                userHistories[userId] = userHistories[userId].slice(
                    userHistories[userId].length - MAX_HISTORY * 2
                );
            }


            const messages = [
                { role: "system", content: systemPrompt },
                ...userHistories[userId],
            ];

            // Call OpenAI API with the bot's personality
            const completion = await openai.chat.completions.create({
                messages,
                model: 'gpt-4o',
                max_tokens: 400
            });
            const botReply = completion.choices[0].message.content;

            // Store bot's response in the chat history
            userHistories[userId].push({ role: "assistant", content: botReply });

            // Display conversation
            console.log(`Bot: ${botReply}`);

            // Limit history to the most recent messages to avoid overflow
            await typingDelay(botReply);

            // Decide whether to reply or just react with emojis
            await bot.telegram.sendMessage(
                ctx.update.business_message.chat.id,
                botReply,
                {
                    business_connection_id: Business_ID
                }
            );


        } catch (error) {
            console.error('Error while processing message:', error);
            // ctx.sendMessage('Oops, something went wrong. 🤖', { business_connection_id: Business_ID })
            log.errror("While sending business message.");
        }
    }
});

bot.on('text', async (ctx) => {
    if (!shouldReply(ctx)) return;
    console.log(ctx.update.message.from.first_name + " " + ctx.update.message.from.last_name + ": " + ctx.update.message.text);
    try {
        const userId = ctx.update.message.from.id;
        const userMessage = ctx.update.message.reply_to_message ? `your message:"${ctx.update.message.reply_to_message.text}"\n mine:${ctx.update.message.text}` : ctx.update.message.text;

        if (!userHistories[userId]) {
            userHistories[userId] = [];
        }

        userHistories[userId].push({ role: "user", content: userMessage });


        if (userHistories[userId].length > MAX_HISTORY * 2) {
            userHistories[userId] = userHistories[userId].slice(
                userHistories[userId].length - MAX_HISTORY * 2
            );
        }


        const messages = [
            { role: "system", content: systemPrompt },
            ...userHistories[userId],
        ];

        // Call OpenAI API with the bot's personality
        const completion = await openai.chat.completions.create({
            messages,
            model: 'gpt-4o',
            max_tokens: 400
        });
        const botReply = completion.choices[0].message.content;

        // Store bot's response in the chat history
        userHistories[userId].push({ role: "assistant", content: botReply });

        // Display conversation
        console.log(`Bot: ${botReply}`);

        // Limit history to the most recent messages to avoid overflow
        await typingDelay(botReply);

        // Decide whether to reply or just react with emojis
        await ctx.reply(botReply);

    } catch (error) {
        console.error('Error while processing message:', error);
        await ctx.reply('Oops, something went wrong. 🤖');
        log.errror("While chatting with client.");
    }
});



bot.launch();
console.log("Poll Bot is running...");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
