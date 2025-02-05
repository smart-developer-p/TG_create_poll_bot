const { Telegraf, Markup, Scenes, session } = require("telegraf");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const axios = require("axios");
const TonWeb = require('tonweb');
const tonMnemonic = require("tonweb-mnemonic");

const { systemPrompt, botCommands, betButtons, dice_stickers, betOptions, startButtons, odds } = require("./constants");
const { typingDelay, shouldReply, betLogic, readUsers, generateMemo, saveUsers, hexToBase64, readStatus, saveStatus } = require('../utils');


dotenv.config();

const BOT_TOKEN = process.env.BET_BOT_TOKEN;
const TON_WALLET = process.env.TON_WALLET_ADDRESS;
const TON_API_URL = process.env.TEST ? process.env.TON_API_TEST_URL : process.env.TON_API_MAIN_URL;
const TON_RPC_PROVIDER = process.env.TEST ? process.env.TON_RPC_PROVIDER_TESTNET : process.env.TON_RPC_PROVIDER_MAINNET;
const mnemonic = (process.env.WALLET_MNEMONIC).split("_");
const explorerUrl = process.env.TEST ? process.env.TON_EXPLORER_TESTNET : process.env.TON_EXPLORER_MAINNET;



const MIN_WITHDRAWAL_AMOUNT = 0.5;

let users = {};

readUsers().then(res => {
    users = res;
});

const bot = new Telegraf(BOT_TOKEN);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API
});

const userHistories = {};
const MAX_HISTORY = 30;

let betAmount, betOption;

const stage = new Scenes.Stage();

bot.telegram.setMyCommands(botCommands);


const withdrawScene = new Scenes.BaseScene("withdrawSenne");

withdrawScene.enter((ctx) => {
    ctx.reply("Please send your withdrawal address here.");
});

withdrawScene.on("text", (ctx) => {
    const address = ctx.message.text.trim();
    // Simple validation for TON address format
    if (address.length !== 48) {
        ctx.reply("❌ Invalid TON address format.");
        return ctx.scene.leave();
    }

    // Ask for the withdrawal amount
    ctx.session.address = address; // Save address in state
    ctx.scene.enter("withdraw_amount"); // Move to next step for amount input
});

// Handle withdrawal amount input
const withdrawAmountScene = new Scenes.BaseScene("withdraw_amount");

withdrawAmountScene.enter((ctx) => {
    const balance = users[ctx.from.id].balance;
    ctx.reply(`How much TON would you like to withdraw? (${balance} TON available)`);
});

withdrawAmountScene.on("text", async (ctx) => {
    const userId = ctx.from.id;
    const toAddress = ctx.session.address; // Get saved address
    const amount = parseFloat(ctx.message.text.trim());

    if (isNaN(amount) || amount <= 0 || amount > users[userId].balance) {
        ctx.reply("❌ Invalid amount. Please enter a valid number.");
        return ctx.scene.leave();

    }

    // Check if the withdrawal amount meets the minimum threshold
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
        ctx.reply(`❌ Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} TON. Please enter a larger amount.`);
        return ctx.scene.leave();
    }

    // Process withdrawal (simulate transaction here)
    try {
        // Example API request to send TON (in real cases, you would use a library for sending transactions)

        const tonweb = new TonWeb(new TonWeb.HttpProvider(TON_RPC_PROVIDER));
        const WalletClass = tonweb.wallet.all['v3R2'];

        const keyPair = await tonMnemonic.mnemonicToKeyPair(mnemonic);
        const wallet = new WalletClass(tonweb.provider, {
            publicKey: keyPair.publicKey,
        });

        const NanoAmount = TonWeb.utils.toNano(amount.toString());
        const seqno = (await wallet.methods.seqno().call()) || 0;

        await wallet.methods.transfer({
            secretKey: keyPair.secretKey,
            toAddress: toAddress,
            amount: NanoAmount,
            seqno: seqno,
            payload: null,
            sendMode: 3,
        }).send();


        // Update the user's balance and send confirmation
        users[userId].balance -= amount;
        saveUsers(users);


        const message = `✅ Withdrawal successful! ${amount} TON sent to <code>${toAddress}</code>.  
Your new balance: ${(parseFloat(users[userId].balance)).toFixed(4)} TON.  

🔍 <a href="${explorerUrl}/address/${toAddress}">View Transaction</a>`;

        ctx.reply(message, {
            parse_mode: "HTML",
            link_preview_options: {
                is_disabled: true
            }
        });
    } catch (error) {
        ctx.reply("❌ Something went wrong. Please try again later.");
        console.error("Error during withdrawal:", error);
        return ctx.scene.leave();
    }

    ctx.scene.leave(); // Exit the scene after transaction
});

// Add scenes to the bot
stage.register(withdrawScene, withdrawAmountScene);
bot.use(session());
bot.use(stage.middleware());


// Start command to initialize the bot
bot.command("start", (ctx) => {
    const username = ctx.update.message.from.username;
    const userId = ctx.update.message.from.id;

    if (!users[userId]) {
        users[userId] = {
            username: username,
            telegramId: userId,
            memo: generateMemo(userId),
            balance: 0,
        };
        saveUsers(users);
    } else if (users[userId].username != username) {
        users[userId].username = username;
        saveUsers(users);
    }
    ctx.reply(`🎉 Welcome to the Dice Betting Bot! 🎲

Thank you for choosing to join the fun! 💥 Your TON deposit is ready to start, and you're just a click away from placing your first bet.

We’ve built this bot with fairness and excitement in mind, ensuring a balanced experience with 90-95% RTP. Want to know more? Feel free to ask! My trusty sidekick ChatGPT is here to help with any game-related questions. 😎

Let the games begin, and may the odds be ever in your favor! 🚀`, {
        reply_markup: {
            inline_keyboard: startButtons,
        }
    });
});

//deposit, withdraw
bot.action("start_deposit", (ctx) => {
    const userId = ctx.update.callback_query.from.id;

    if (!users[userId]) {
        users[userId] = {
            telegramId: userId,
            memo: generateMemo(userId),
            balance: 0,
        };
        saveUsers(users);
    }

    const memo = users[userId].memo;
    ctx.reply(
        `👋 Welcome! To deposit TON, send funds to:\n\n` +
        `🔹 Address: <code>${TON_WALLET}</code>\n` +
        `🔹 Memo: <code>${memo}</code>\n` +
        `📌 Make sure to include the memo, or the deposit won't be recognized. We will send you a notification message when a transaction is detected.`, {
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [[Markup.button.callback("Check Balance", "check_balance")]],
        }
    }
    );
});
// Handle "Check Balance" button
bot.action("check_balance", (ctx) => {
    const userId = ctx.update.callback_query.from.id;
    if (!users[userId]) {
        return ctx.reply("❌ You haven't made a deposit yet!");
    }

    ctx.reply(`💰 Your balance is ${(parseFloat(users[userId].balance)).toFixed(4)} TON`);
});

// Handle "WithdrawSenne" button
bot.action("start_withdraw", (ctx) => {
    const userId = ctx.from.id;
    if (!users[userId]) {
        return ctx.reply("❌ You haven't made a deposit yet!");
    }

    const balance = users[userId].balance;
    if (balance === 0) {
        return ctx.reply("❌ Your balance is 0. Please deposit some TON first.");
    }

    if (balance <= MIN_WITHDRAWAL_AMOUNT) {
        return ctx.reply("❌ Your balance is less than 0.5. Please deposit more TON first.");
    }

    ctx.scene.enter("withdrawSenne");
});
bot.action("start_help", (ctx) => {
    ctx.reply(`🎲 **Dice Betting Bot - Help**  

**🛠 How to Play**  
  1. **Deposit TON** – Bot gives a wallet address. Send TON **with the memo**.  
  2. **Place Bet** – Choose amount & option, then click **Bet**.  
  3. **Win or Lose** – If you win, balance increases. If not, try again!  

**💰 Deposits & Withdrawals**  
  - **Deposit:** Send TON to bot’s wallet **with memo** to recognize it.  
  - **Withdraw:** Click **Withdraw**, enter amount, get TON instantly.  

**📜 Features**  
  - **Fair Play** – Uses Telegram's Dice (90-95% RTP).  
  - **No Wallet Connection Needed** – Just send TON.  
  - **Play Anytime** – No limits.  
  - **ChatGPT Help** – Ask game-related questions.  

**🚀 Coming Soon**  
  - More games & a **mini app**!  

**🔗 Support & Suggestions**  
  📩 DM: [https://t.me/m/GtGS1krZMTBk](https://t.me/m/GtGS1krZMTBk)  

💻 **Built With:** Node.js, Telegraf, OpenAI, MongoDB, Tonweb, TONAPI.`, {
        parse_mode: "Markdown"
    });
});
bot.action("start_rank", (ctx) => {
    try {
        const userId = ctx.update.callback_query.from.id;// Get the requester's Telegram ID

        // Convert object to array & sort by balance (highest first)
        const rankedUsers = Object.values(users).sort((a, b) => b.balance - a.balance);

        // Get the top 20 users
        const topUsers = rankedUsers.slice(0, 20);

        // Find the requesting user's rank
        const userIndex = rankedUsers.findIndex((user) => user.telegramId.toString() === userId);
        const userInRank = userIndex !== -1 ? rankedUsers[userIndex] : null;

        // Format leaderboard message
        let message = "🏆 Leaderboard 🏆\n";
        message += "--------------------------------------------\n";

        topUsers.forEach((user, index) => {
            let rankEmoji = "";
            if (index === 0) rankEmoji = "🏆"; // 1st place
            else if (index === 1) rankEmoji = "🥈"; // 2nd place
            else if (index === 2) rankEmoji = "🥉"; // 3rd place
            else rankEmoji = ` ${index + 1}  `; // Normal ranking

            message += `${rankEmoji} @${user.username || "Unkown"} - ${(parseFloat(user.balance)).toFixed(4)} TON\n`;
        });

        // If the user is not in the top 20, show their rank separately
        if (userInRank && userIndex >= 20) {
            message += `\n...\n ${userIndex + 1}   ${userInRank.memo} - ${(parseFloat(userInRank.balance)).toFixed(4)} TON (You)`;
        }

        // Send the formatted leaderboard
        ctx.reply(message);
    } catch (err) {
        console.log("error", err.message);
        // ctx.reply("Oops! An error was occured. Please try again later");
    }
});


// Function to check deposits
async function checkDeposits() {
    try {
        let status = {};
        status = await readStatus();
        const response = await axios.get(`${TON_API_URL}/v2/blockchain/accounts/${TON_WALLET}/transactions?after_lt=${status.last_lt}&sort_order=desc`);
        const transactions = response.data.transactions;
        if (transactions.length) {
            status.last_lt = transactions[0].lt;
            await saveStatus(status);
        }

        for (const tx of transactions) {
            const memo = tx.in_msg.decoded_body.text; // Extract memo from transaction
            const amount = parseFloat(tx.in_msg.value / 1_000_000_000); // Extract amount

            // Find the user with this memo
            for (const userId in users) {
                if (users[userId].memo === memo) {
                    users[userId].balance += amount;
                    saveUsers(users);
                    console.log(`✅ Deposit received: ${amount} TON from User ${userId}`);

                    // Send confirmation message
                    bot.telegram.sendMessage(userId, `🎉 Deposit received! Your new balance: ${users[userId].balance.toFixed(4)} TON`);
                }
            }
        }
    } catch (error) {
        console.error("Error fetching TON transactions:", error.message);
    }
}

// Check for new deposits every 30 seconds
setInterval(checkDeposits, 30000);


bot.action("start_betting", (ctx) => {
    betAmount = 10;
    betOption = '123';
    betButtons[0] = [{ text: `💰Bet Amount: ${betAmount.toFixed(4)} TON`, callback_data: "bet_amount" }];
    betButtons[3] = [{ text: `💡Bet Option: ${betOptions[betOption]}`, callback_data: "bet_option" }];
    ctx.reply(`🎲 Let's Get Rolling! 🚀

Choose your bet amount and pick your option using the buttons below. When you're ready, just click the Bet button to place your bet!

Good luck, and may the dice roll in your favor! 🍀`, {
        reply_markup: {
            inline_keyboard: betButtons,
        },
    });
});




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

        betAmount = betAmount.toFixed(4);

        if (betAmount < 0.0001 || isNaN(betAmount)) betAmount = 0;
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
    const userId = ctx.update.callback_query.from.id;
    if (!users[userId]) {
        return ctx.reply("❌ You haven't made a deposit yet!");
    }

    if (betAmount > users[userId].balance) {
        return ctx.reply(`⚠️ Insufficient Balance!

You don't have enough TON to place this bet. Your current balance is [current_balance] TON.

Please deposit more to continue playing! 🎲`);
    }

    users[userId].balance -= parseFloat(betAmount);
    await saveUsers(users);
    // const { resultMessage, payout, isWinner, diceRoll } = betLogic(betAmount, betOption);
    const result = await ctx.sendDice();
    console.log("dice result: ", result.dice.value, betAmount, betOption);

    // Send result and dice sticker
    const diceValue = result.dice.value;
    const isWinner = betOption.toString().includes(diceValue);
    const odd = odds[betOption];
    if (isWinner) {
        const won = betAmount * odd;
        const payout = won.toFixed(4);
        users[userId].balance += parseFloat(payout);
        await saveUsers(users);
        await (new Promise(resolve => setTimeout(async () => {
            ctx.answerCbQuery();
            await ctx.reply(`🎉 You Won ${payout} TON! 🎲

Congratulations! Your balance is now ${users[userId].balance.toFixed(4)} TON.`);
            resolve();
        }, 3000)));
    } else {
        await (new Promise(resolve => setTimeout(async () => {
            await ctx.reply(`😞 You Lost ${betAmount} TON. 🎲

Better luck next time! Your balance is now ${users[userId].balance.toFixed(4)} TON.`);
            resolve();
        }, 3000)));
    }

    betAmount = parseFloat(betAmount);

    betButtons[0] = [{ text: `💰Bet Amount: ${betAmount.toFixed(4)} TON`, callback_data: "bet_amount" }];
    betButtons[3] = [{ text: `💡Bet Option: ${betOptions[betOption]}`, callback_data: "bet_option" }];
    ctx.reply(`🎲 Bet Placed! 🚀

Want to try again? Select your bet amount and option, then hit Bet again.
        
Good luck! 🍀`, {
        reply_markup: {
            inline_keyboard: betButtons,
        },
    });
});


//chat bot
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

bot.launch();
console.log("Bet Bot is running...");
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));