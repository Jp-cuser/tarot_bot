// src/logic/karaoke.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, MessageFlags } = require('discord.js');

// --- 状態管理 ---
let karaokeQueue = [];
let lastPanelMessage = null; // 最新のパネルメッセージを保持
let karaokeStats = { 
    date: new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }), 
    counts: {} 
};

// --- ロジック関数 ---

function addKaraokeQueue(user) {
    const today = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    if (karaokeStats.date !== today) {
        karaokeStats = { date: today, counts: {} };
    }
    if (karaokeQueue.find(q => q.user.id === user.id)) return false;

    const userCount = karaokeStats.counts[user.id] || 0;
    if (karaokeQueue.length === 0) {
        karaokeQueue.push({ user, count: userCount, queuedAt: Date.now() });
        return true;
    }

    const currentSinger = karaokeQueue.shift(); 
    karaokeQueue.push({ user, count: userCount, queuedAt: Date.now() });
    
    // 💡 シンプルな早い者勝ちアルゴリズム：ただ予約が早い順に並べるちゅ！
    karaokeQueue.sort((a, b) => a.queuedAt - b.queuedAt);

    karaokeQueue.unshift(currentSinger);
    return true;
}

function removeKaraokeQueue(userId, isFinished = false) {
    const index = karaokeQueue.findIndex(q => q.user.id === userId);
    if (index === -1) return false;

    if (isFinished && index === 0) {
        karaokeStats.counts[userId] = (karaokeStats.counts[userId] || 0) + 1;
    }
    karaokeQueue.splice(index, 1);
    return true;
}

function generateKaraokePanel() {
    const embed = new EmbedBuilder()
        .setTitle('🎤 カラオケ順番待ちリスト')
        .setColor(0x00BFFF);

    if (karaokeQueue.length === 0) {
        embed.setDescription('現在順番待ちはいません。\n「歌う」ボタンを押して予約してちゅ！');
    } else {
        const current = karaokeQueue[0];
        embed.addFields({ name: '🎵 現在の歌唱者', value: `<@${current.user.id}> (本日 ${current.count}曲)` });

        if (karaokeQueue.length > 1) {
            // 2番目以降10人目まで
            const nextUsers = karaokeQueue.slice(1, 10);
            let desc = nextUsers.map((q, i) => `**${i + 2}番目:** <@${q.user.id}> (本日 ${q.count}曲)`).join('\n');
            if (karaokeQueue.length > 10) {
                desc += `\n...他 ${karaokeQueue.length - 10} 人が待機中`;
            }
            embed.addFields({ name: '⏳ 順番待ち (最大10人表示)', value: desc });
        }
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_karaoke_join').setLabel('歌う').setEmoji('🎤').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_karaoke_leave').setLabel('終了/キャンセル').setEmoji('🛑').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('btn_karaoke_force_skip').setLabel('強制退出').setEmoji('⏩').setStyle(ButtonStyle.Success)
    );

    return { embeds: [embed], components: [row] };
}

// パネルを再送して常に一番下にする共通処理
async function refreshPanel(channel) {
    // 古いパネルがあれば消す
    if (lastPanelMessage) {
        try {
            await lastPanelMessage.delete();
        } catch (e) {
            // すでに消えている場合は無視
        }
    }
    // 新しいパネルを送信して記録
    lastPanelMessage = await channel.send(generateKaraokePanel());
}

async function handleKaraokeInteraction(interaction) {
    const user = interaction.user;

    if (interaction.customId === 'btn_karaoke_join') {
        if (!addKaraokeQueue(user)) {
            return interaction.reply({ content: 'もう順番待ちに入ってるちゅ！', flags: MessageFlags.Ephemeral });
        }
    } 
    else if (interaction.customId === 'btn_karaoke_leave') {
        const isCurrentSinger = karaokeQueue.length > 0 && karaokeQueue[0].user.id === user.id;
        if (!removeKaraokeQueue(user.id, isCurrentSinger)) {
            return interaction.reply({ content: '順番待ちに入ってないちゅ！', flags: MessageFlags.Ephemeral });
        }
    }
    else if (interaction.customId === 'btn_karaoke_force_skip') {
        const adminRoleId = '1476730949441163407';
        if (!interaction.member.roles.cache.has(adminRoleId) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'このボタンは運営専用だちゅ！', flags: MessageFlags.Ephemeral });
        }
        if (karaokeQueue.length === 0) return interaction.reply({ content: '誰も歌ってないちゅ！', flags: MessageFlags.Ephemeral });
        
        removeKaraokeQueue(karaokeQueue[0].user.id, true);
    }

    await interaction.deferUpdate();
    await refreshPanel(interaction.channel);
}

// 他の人が発言したときに呼び出す関数
async function onMessageInKaraokeChannel(message) {
    // 最後にパネルを出したチャンネルと同じ、かつボット自身の発言でない場合
    if (lastPanelMessage && message.channel.id === lastPanelMessage.channel.id && !message.author.bot) {
        await refreshPanel(message.channel);
    }
}

module.exports = {
    generateKaraokePanel,
    handleKaraokeInteraction,
    onMessageInKaraokeChannel, // これをindex.jsで使う
    refreshPanel
};