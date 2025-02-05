exports.systemPrompt = `
You are a dice betting bot. You are to help users who ask questions about the game. You do not have to answer questions that are not related. You are only to answer questions related to the game.

Here is game logic and helps.
Game Name: Dice Betting
Author: @stellaray0
How to Start:
Deposit TON, choose your bet amount, and send /start to start playing.
Fairness:
Uses Telegram’s Dice method with 90-95% RTP, ensuring a fair and transparent game.
Minimum Bet:
The minimum bet is based on your available balance.
Withdrawals:
Withdraw your balance anytime using the Withdraw option.
Losses:
If you lose, you can try again. Your balance will update after each round.
Questions:
For game-related questions, you can ask ChatGPT.
Multiple Rounds:
You can place bets anytime and keep playing multiple rounds.
Depositing:
No need to connect your wallet. The bot will provide a wallet address for depositing. Make sure to include the provided memo with your deposit so the bot can recognize your transaction.
Database:
Your data will be saved to a MongoDB database for tracking.
Suggestions:
For detailed feature inquiries or suggestions, contact the author via https://t.me/m/GtGS1krZMTBk.
Future Updates:
More games will be added, and a mini app will be launched soon!
Tech Stack:
The game is built using Node.js, Telegraf, OpenAI, MongoDB, Tonweb, and TONAPI.
To see payment history check https://tonscan.org
`;

exports.botCommands = [
    { command: 'start', description: 'Start the bot' },
];


exports.betButtons = [
    [{ text: "💰Bet Amount: 10 TON ($24)", callback_data: "bet_amount" }],
    [{ text: "-10", callback_data: "bet_-10" }, { text: "-1", callback_data: "bet_-1" }, { text: "+1", callback_data: "bet_+1" }, { text: "+10", callback_data: "bet_+10" }],
    [{ text: "x5", callback_data: "bet_x5" }, { text: "x2", callback_data: "bet_x2" }, { text: "/5", callback_data: "bet_/5" }, { text: "/2", callback_data: "bet_/2" }],
    [{ text: "💡Bet Option: 1️⃣ 2️⃣ 3️⃣", callback_data: "bet_option" }],
    [{ text: "1️⃣ 2️⃣ 3️⃣", callback_data: "bet_123" }, { text: "4️⃣ 5️⃣ 6️⃣", callback_data: "bet_456" }, { text: "1️⃣ 3️⃣ 5️⃣", callback_data: "bet_135" }, { text: "2️⃣ 4️⃣ 6️⃣", callback_data: "bet_246" }],
    [{ text: "1️⃣ 2️⃣", callback_data: "bet_12" }, { text: "3️⃣ 4️⃣", callback_data: "bet_34" }, { text: "5️⃣ 6️⃣", callback_data: "bet_56" }],
    [{ text: "1️⃣", callback_data: "bet_1" }, { text: "2️⃣", callback_data: "bet_2" }, { text: "3️⃣", callback_data: "bet_3" }, { text: "4️⃣", callback_data: "bet_4" }, { text: "5️⃣", callback_data: "bet_5" }, { text: "6️⃣", callback_data: "bet_6" }],
    [{ text: "🎲 Bet", callback_data: "bet_start" }]
];
exports.startButtons = [
    [{ text: "🏦 Deposit", callback_data: "start_deposit" }, { text: "🏧 Withdraw", callback_data: "start_withdraw" }, { text: "💰 Balance", callback_data: "check_balance" }],
    [{ text: "❓ Help", callback_data: "start_help" }, { text: "🏆 Ranks", callback_data: "start_rank" }],
    [{ text: "🎲 Dice Bet", callback_data: "start_betting" }]
];

exports.betOptions = {
    "123": "1️⃣ 2️⃣ 3️⃣",
    "456": "4️⃣ 5️⃣ 6️⃣",
    "135": "1️⃣ 3️⃣ 5️⃣",
    "246": "2️⃣ 4️⃣ 6️⃣",
    "12": "1️⃣ 2️⃣",
    "34": "3️⃣ 4️⃣",
    "56": "5️⃣ 6️⃣",
    "1": "1️⃣",
    "2": "2️⃣",
    "3": "3️⃣",
    "4": "4️⃣",
    "5": "5️⃣",
    "6": "6️⃣"
};

exports.odds = {
    "123": 1.8,
    "456": 1.8,
    "135": 1.8,
    "246": 1.8,
    "12": 2.7,
    "34": 2.7,
    "56": 2.7,
    "1": 5.4,
    "2": 5.4,
    "3": 5.4,
    "4": 5.4,
    "5": 5.4,
    "6": 5.4
};