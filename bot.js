const { Telegraf } = require("telegraf");
const OpenAI = require("openai");
const fs = require("fs");
const dotenv = require("dotenv");
const { systemPrompt, botCommands, betButtons, dice_stickers, betOptions } = require("./constants");
const { typingDelay, shouldReply, betLogic } = require('./utils');

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const Business_ID = process.env.business_connection_id;


const bot = new Telegraf(BOT_TOKEN);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API
});


const userHistories = {};
const MAX_HISTORY = 30;

let betAmount, betOption;



bot.telegram.setMyCommands(botCommands);

// Start command to initialize the bot
bot.command("start", (ctx) => {
    ctx.reply("This is a user engage mange bot.");
});


// Command to send a poll immediately
const sendRandomPoll = (ctx) => {
    const polls = JSON.parse(fs.readFileSync("polls.json", "utf8"));
    const randomPoll = polls[Math.floor(Math.random() * polls.length)];

    // Shuffle the options randomly
    const shuffledOptions = randomPoll.options
        .map((option) => ({ option, sort: Math.random() })) // Assign a random sort value to each option
        .sort((a, b) => a.sort - b.sort) // Sort options based on the random sort value
        .map(({ option }) => option); // Extract the shuffled options

    if (randomPoll.type === "regular") {
        ctx.telegram.sendPoll(ctx.chat.id, randomPoll.question, shuffledOptions);
    } else if (randomPoll.type === "quiz") {
        const shuffledCorrectOptionId = shuffledOptions.indexOf(randomPoll.options[randomPoll.correct_option_id]);
        ctx.telegram.sendPoll(
            ctx.chat.id,
            randomPoll.question,
            shuffledOptions,
            { type: "quiz", correct_option_id: shuffledCorrectOptionId }
        );
    }

    console.log(`Poll sent: ${randomPoll.question}`);
};

bot.command("poll", (ctx) => {
    sendRandomPoll(ctx);
});


bot.command("dicebet", (ctx) => {
    betAmount = 10;
    betOption = '123';
    betButtons[0] = [{ text: `💰Bet Amount: ${betAmount} TON`, callback_data: "bet_amount" }];
    betButtons[3] = [{ text: `💡Bet Option: ${betOptions[betOption]}`, callback_data: "bet_option" }];
    ctx.reply('Welcome to Dice Bet Game! Choose your bet:', {
        reply_markup: {
            inline_keyboard: betButtons,
        },
    });
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
    }
});


//dice bet

// Handle bet amount selection
bot.action(/bet_([+-\/x]\d+)/g, async (ctx) => {
    // Extract the bet amount string (e.g., "-50", "+10", "x2", "/5")

    betAmount = parseFloat(betAmount);
    const betString = ctx.match[0].split('_')[1];

    // Extract operator and number using regex
    const regex = /([+-\/x])?(\d+)/; // Match operator (optional) and number
    const match = betString.match(regex);

    if (match) {
        const operator = match[1]; // Extract the operator (e.g., +, -, x, /)
        const number = parseInt(match[2], 10); // Extract the number as an integer

        // Apply the operator to the bet amount
        switch (operator) {
            case '+':
                betAmount += number;
                break;
            case '-':
                betAmount -= number;
                break;
            case 'x':
                betAmount *= number;
                break;
            case '/':
                betAmount /= number;
                break;
            default:
                betAmount = 10; // No operator, keep the base bet amount
                break;
        }

        betAmount = betAmount.toFixed(2);

        if (betAmount < 0.1) betAmount = 0;
        console.log(betAmount);

        // Update the bet amount button text dynamically
        betButtons[0] = [{ text: `💰Bet Amount: ${betAmount} TON`, callback_data: "bet_amount" }];

        // Send updated buttons to the user
        try {
            await ctx.editMessageReplyMarkup({
                inline_keyboard: betButtons,
            });
        } catch (err) {
            console.log(err.message);
        }

    } else {
        console.log("Invalid bet string");
    }
});

// Handle bet option selection
bot.action(/bet_(\d+)/g, async (ctx) => {
    betOption = (ctx.match[0].split('_')[1]).toString();  // Extract the selected option (e.g., 123, 456, 10)

    console.log(betOption);

    // Update the bet option button text dynamically
    betButtons[3] = [{ text: `💡Bet Option: ${betOptions[betOption]}`, callback_data: "bet_option" }];

    // Send updated buttons  
    try {
        await ctx.editMessageReplyMarkup({
            inline_keyboard: betButtons,
        });
    } catch (err) {
        console.log(err.message);
    }
});

bot.action("bet_start", async (ctx) => {

    const { resultMessage, payout, isWinner, diceRoll } = betLogic(betAmount, betOption);

    // Send result and dice sticker
    await ctx.replyWithSticker(dice_stickers[diceRoll]);

    // Send payout message
    await ctx.reply(isWinner ? `You won ${payout} TON!` : `You lost your bet of ${betAmount} TON.`);
});

// Fairness Check
bot.action('bet_hash', (ctx) => {
    const fairnessHash = "exampleGeneratedHash"; // Replace with actual logic for fairness
    ctx.reply(`Here’s your fairness hash: ${fairnessHash}`);
});


bot.launch();
console.log("Bot is running...");
