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

exports.betLogic = (userBet, option) => {
    // Random dice roll (1 to 6)
    const diceRoll = Math.floor(Math.random() * 6) + 1;

    let resultMessage = "";
    let payout = 0;
    let isWinner = false;

    if (option === "low" && diceRoll <= 3) {
        resultMessage = `You win! 🎲 Dice rolled: ${diceRoll}`;
        payout = userBet * 2; // Example: double bet amount if low is correct
        isWinner = true;
    } else if (option === "high" && diceRoll > 3) {
        resultMessage = `You win! 🎲 Dice rolled: ${diceRoll}`;
        payout = userBet * 2; // Example: double bet amount if high is correct
        isWinner = true;
    } else {
        resultMessage = `You lose! 🎲 Dice rolled: ${diceRoll}`;
        payout = 0;
    }

    return { resultMessage, payout, isWinner, diceRoll };
};