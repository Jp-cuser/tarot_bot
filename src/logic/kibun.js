const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

/**
 * 気分の記録を追加する
 */
function recordKibun(kibunData, userId, level, memo) {
    if (!kibunData[userId]) {
        kibunData[userId] = [];
    }
    const now = Date.now();
    kibunData[userId].push({ date: now, level: level, memo: memo });
    return kibunData;
}

/**
 * チャンネル選択用メニューを作成する
 */
const getChannelSelectMenu = (guild, member, botUser) => {
    const channels = guild.channels.cache.filter(c => c.type === 0 || c.type === 5);
    const validChannels = [];

    for (const [id, channel] of channels) {
        const userPerms = channel.permissionsFor(member);
        const botPerms = channel.permissionsFor(guild.members.me);
        
        if (userPerms?.has('SendMessages') && userPerms?.has('ViewChannel') &&
            botPerms?.has('SendMessages') && botPerms?.has('ViewChannel')) {
            
            validChannels.push({
                label: `#${channel.name}`,
                value: channel.id,
                description: 'ここに自分のレポートを送るちゅ！'
            });
        }
    }

    if (validChannels.length === 0) return null;

    const options = validChannels.slice(0, 25);
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('kibun_select_channel')
            .setPlaceholder('あなたのレポートを送るチャンネルを選ぶちゅ！✨')
            .addOptions(options)
    );
};

module.exports = {
    recordKibun,
    getChannelSelectMenu
};
