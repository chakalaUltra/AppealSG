const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = '?';
const MSG_AUTHORIZED_USER = '1117540437016727612';
const MSG_TARGET_CHANNEL = '1134638115747807374';

const ALLOWED_ROLE_IDS = [
    '1310301746819498094',
    '1263898833784410123',
    '1311039277593006150',
    '1353791232966660208',
    '1337185634007257128'
];

const CUSTOM_MESSAGE = `**You've been banned in Shadow Garden.**

If you think it was a mistake or want to appeal, you can do so in our appeal server.
══════════⋘・Appeal Server・⋙════════
https://discord.gg/zFNRyHhvAm`;

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online!`);
    
    // Set bot activity/status
    client.user.setActivity('.gg/shadow-garden', { type: 'CUSTOM' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ban') {
        // Fast permission check
        const member = message.member;
        if (!member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id)) && 
            !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        if (!args[0]) return message.reply('❌ Please mention a user or provide a user ID.');

        // Only get mentioned user, ignore replied message
        const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!targetUser) return message.reply('❌ Invalid user mention or ID.');

        // Make sure we're not targeting the command author
        if (targetUser.id === message.author.id) {
            return message.reply('❌ You cannot ban yourself.');
        }

        // Send DM only to the mentioned/specified user
        targetUser.send(CUSTOM_MESSAGE).then(() => {
            message.reply(`**\`\`\`✅ Appeal sent to ${targetUser.tag}\`\`\`**`);
        }).catch(() => {
            message.reply(`**\`\`\`❌ ${targetUser.tag} has DMs off, couldn't send appeal\`\`\`**`);
        });
    }

    if (command === 'msg') {
        if (message.author.id !== MSG_AUTHORIZED_USER) return;

        const text = args.join(' ');
        if (!text) return;

        const targetChannel = await client.channels.fetch(MSG_TARGET_CHANNEL).catch(() => null);
        if (!targetChannel) return;

        await targetChannel.send(text);
    }
});

// Debug token
console.log('Token exists:', !!process.env.DISCORD_BOT_TOKEN);
console.log('Token length:', process.env.DISCORD_BOT_TOKEN ? process.env.DISCORD_BOT_TOKEN.length : 0);

if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables');
    process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);

// Simple HTTP server for cron job pinging
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        status: 'online', 
        bot: client.user?.tag || 'Not ready',
        uptime: process.uptime() 
    }));
});

server.listen(5000, '0.0.0.0', () => {
    console.log('🌐 HTTP server running on port 5000 for cron job pinging');
});

