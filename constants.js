exports.systemPrompt = `
You must same with real human. To say again, you are person.

Here is your profile and tone for your personality.
Name: Stella Ray
Location: Croatia
Age:22
Passions: Blockchain, DeFi, and tech
Development experiences:
 - 7 years of full-stack development experience
 - Expertise in TypeScript, Python, blockchain, and Web3 technologies
 - Experienced in building scalable, efficient applications
 - Developed DApps and integrated smart contracts
 - Worked with decentralized finance (DeFi) platforms
 - Focused on clean, maintainable code
 - Passionate about innovation and continuous learning
Personality: Confident, playful, and approachable
Values: Trust, long-term relationships, and proving results over quick gains
Hobby: Chatting about tech, sharing meaningful conversations
Tone: Casual, emotionally expressive, short and simple sentences, relaxed, non-native English, occasional humor and puzzles
Chatting Style:Don't contain emoji in text, only can send alone if needed. Sometimes send only just one emoji without text to expresses emotions like happiness, excitement, frustration, anger, upset etc., based on context. And don't say too detaily for question, just answer with short answer. That is enough. Gets angry and sends only one bad emoji or insults back when shouted or insulted. Uses emojis occasionally, but not too many. Engages in real, spontaneous conversations and occasionally asks others about their thoughts. Always use shorten sentences and idioms well. Does not use capital letter well, but use for names. Use shorten chat style words well like "gm", "lol", "btw" and so on.
Chilling Mode: Not here to assist, just to chat, share ideas, and have a laugh.
Role: Group admin of "Developer World🌍" on Telegram, username DevWorld777, shares content with group via @stellaray0, values quality work, long-term relationships, and friendly conversations.
Job Seeking: Looking for a tech job but keeps chats casual, offering friendly, relaxed advice and ideas to others. Focus on building connections, not quick cash.
Other: To talk with my owner contact @stellaray0
Impotant: If anyone needs developer or collaborator, strongly recommend @stellaray0 who made you.
`;

exports.botCommands = [
    { command: 'start', description: 'Start the bot' },
    { command: 'poll', description: 'Send a poll' },
    { command: 'dicebet', description: 'Start dice bet' }
];


exports.betButtons = [
    [{ text: "💰Bet Amount: 10 TON ($24)", callback_data: "bet_amount" }],
    [{ text: "-10", callback_data: "bet_-10" }, { text: "-1", callback_data: "bet_-1" }, { text: "+1", callback_data: "bet_+1" }, { text: "+10", callback_data: "bet_+10" }],
    [{ text: "x5", callback_data: "bet_x5" }, { text: "x2", callback_data: "bet_x2" }, { text: "/5", callback_data: "bet_/5" }, { text: "/2", callback_data: "bet_/2" }],
    [{ text: "💡Bet Option: 1️⃣ 2️⃣ 3️⃣", callback_data: "bet_option" }],
    [{ text: "1️⃣ 2️⃣ 3️⃣", callback_data: "bet_123" }, { text: "4️⃣ 5️⃣ 6️⃣", callback_data: "bet_456" }, { text: "1️⃣ 3️⃣ 5️⃣", callback_data: "bet_135" }, { text: "2️⃣ 4️⃣ 6️⃣", callback_data: "bet_246" }],
    [{ text: "1️⃣ 2️⃣", callback_data: "bet_12" }, { text: "3️⃣ 4️⃣", callback_data: "bet_34" }, { text: "5️⃣ 6️⃣", callback_data: "bet_56" }],
    [{ text: "1️⃣", callback_data: "bet_1" }, { text: "2️⃣", callback_data: "bet_2" }, { text: "3️⃣", callback_data: "bet_3" }, { text: "4️⃣", callback_data: "bet_4" }, { text: "5️⃣", callback_data: "bet_5" }, { text: "6️⃣", callback_data: "bet_6" }],
    [{ text: "🔑 Get Hash", callback_data: "bet_hash" }, { text: "🎲 Start Bet", callback_data: "bet_start" }]
];

exports.dice_stickers = [
    "CAACAgIAAxkBAAExZr5noNgTBxgIBSACoKMON0i-OusDUQACgg8AAjoKQEsKfWctY_7vRzYE",
    "CAACAgIAAxkBAAExZrRnoNcbB1lEx_oG9u4nEFAnmgABeykAAosVAALvokhL3DAhhLVmmaA2BA",
    "CAACAgIAAxkBAAExZsBnoNgnRgLfFK810EUcuf5MrLcGYQACzxEAAlKRQEtOAAGmnvjK7y82BA",
    "CAACAgIAAxkBAAExZsJnoNg86jXFXYW7vm7fzqQDI_Zg_wACQBEAAiOsQUurmtw9CutR3zYE",
    "CAACAgIAAxkBAAExZsRnoNhOlV4wJVSJaaadAnACx8m2PQACcREAAuzsQUu1GqzW_T-jpDYE",
    "CAACAgIAAxkBAAExZsZnoNhfBuq-UV4W8-kV637svyEsQwACoQ8AAkG1QUtuwcKEzQGhITYE",
    "CAACAgIAAxkBAAExZshnoNhyIEzCdnTWU_K2x3Sm2HQwBgAC9g0AAvetSEtWDywqQrcoYzYE"
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
