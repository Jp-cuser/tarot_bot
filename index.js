const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    UserSelectMenuBuilder, 
    AttachmentBuilder, 
    MessageFlags,
    PermissionsBitField,
    SlashCommandBuilder,
    REST,
    Routes,
    Events
} = require('discord.js');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

// --- Constants ---
const { tarotCards } = require('./src/constants/tarot');
const { runeAlphabet } = require('./src/constants/runes');
const { sushiMenu } = require('./src/constants/sushi');
const { petSpecies, extraImages } = require('./src/constants/pets');
const { HOUSE_ROLES, HOUSE_EMOJIS } = require('./src/constants/houses');
const { prefCoords, signs, luckyItems } = require('./src/constants/common');

// --- Utils ---
const { getJSTInfo } = require('./src/utils/time');
const { getPersonalDailyRandom, getDailyRandom } = require('./src/utils/random');
const { stripEmoji } = require('./src/utils/string');
const { loadJSON, saveJSON } = require('./src/utils/file');

// --- Services ---
const llmService = require('./src/services/llm');
const weatherService = require('./src/services/weather');

// --- Logic ---
const tarotLogic = require('./src/logic/tarot');
const hitandblowLogic = require('./src/logic/hitandblow');
const sushiLogic = require('./src/logic/sushi');
const petLogic = require('./src/logic/pets');
const horoscopeLogic = require('./src/logic/horoscope');
const runeLogic = require('./src/logic/rune');
const weatherLogic = require('./src/logic/weather');
const animalLogic = require('./src/logic/animal');
const kibunLogic = require('./src/logic/kibun');
const busterLogic = require('./src/logic/buster');
const karaokeLogic = require('./src/logic/karaoke');
const stickyLogic = require('./src/logic/sticky');

// --- Globals & Data ---
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const PETS_FILE = path.join(DATA_DIR, 'user_pets.json');
const HOUSE_FILE = path.join(DATA_DIR, 'house_points.json');
const KIBUN_FILE = path.join(DATA_DIR, 'user_kibun.json');
const KIBUN_SETTINGS_FILE = path.join(DATA_DIR, 'kibun_settings.json');
const STICKY_FILE = path.join(DATA_DIR, 'sticky_data.json'); // 💡 【追加】

let userPets = loadJSON(PETS_FILE, {});
let housePoints = loadJSON(HOUSE_FILE, {});
let userKibun = loadJSON(KIBUN_FILE, {});
let kibunSettings = loadJSON(KIBUN_SETTINGS_FILE, {});
let stickyMessageIds = new Map(Object.entries(loadJSON(STICKY_FILE, {}))); // 💡 【追加】

const savePets = () => saveJSON(PETS_FILE, userPets);
const saveHouses = () => saveJSON(HOUSE_FILE, housePoints);
const saveKibun = () => saveJSON(KIBUN_FILE, userKibun);
const saveKibunSettings = () => saveJSON(KIBUN_SETTINGS_FILE, kibunSettings);
const saveStickyData = () => saveJSON(STICKY_FILE, Object.fromEntries(stickyMessageIds)); // 💡 【追加】


const STICKY_CHANNEL_ID = '1452263017348857896';

// Temporary state
const petCatches = new Map();
const oaisoGames = new Map();
global.trainCooldowns = new Map();

// --- Client Setup ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Slash Command Registration
    if (process.env.REGISTER_COMMANDS === 'true') {
        const commands = [
            new SlashCommandBuilder()
                .setName('nezumi')
                .setDescription('ねずみボットのメニューを表示するちゅ！'),
            new SlashCommandBuilder()
                .setName('kibun')
                .setDescription('今の気分を記録するちゅ！')
                .addIntegerOption(opt => opt.setName('level').setDescription('気分レベル(1-5)').setRequired(true).addChoices(
                    {name:'✨ 最高', value:5}, {name:'☀️ 良い', value:4}, {name:'☁️ 普通', value:3}, {name:'🌧️ 微妙', value:2}, {name:'⚡ 最悪', value:1}
                ))
                .addStringOption(opt => opt.setName('memo').setDescription('一言メモ')),
            new SlashCommandBuilder()
                .setName('kibun_setchannel')
                .setDescription('レポート送信先のチャンネルを設定するちゅ！'),
            new SlashCommandBuilder()
                .setName('kibun_resetchannel')
                .setDescription('レポート設定をリセットするちゅ！'),
            new SlashCommandBuilder()
                .setName('clearall')
                .setDescription('【管理者用】特定のユーザーの指定日以降のメッセージを掃除するちゅ！')
                .addUserOption(opt => opt.setName('target').setDescription('掃除する相手').setRequired(true))
                .addStringOption(opt => opt.setName('date').setDescription('いつから(YYYY-MM-DD)').setRequired(true))
                .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
            new SlashCommandBuilder()
                .setName('karaoke')
                .setDescription('カラオケの順番待ちパネルを出すちゅ！'),
            // 💡 【追加】ここから案内板のコマンドだちゅ！
            new SlashCommandBuilder()
                .setName('temp_setup')
                .setDescription('【管理者用】臨時情報の看板を設定するちゅ！')
                .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
                .addStringOption(opt => opt.setName('template').setDescription('デザインを選ぶちゅ！').setRequired(true).addChoices(
                    { name: '🚨 アラート (レッド)', value: 'alert_red' },
                    { name: '🟢 チケット風 (グリーン)', value: 'ticket_green' },
                    { name: '🟡 エレガント (ブラック＆ゴールド)', value: 'elegant_gold' },
                    { name: '🌸 ポップ (パステルピンク)', value: 'pop_pink' },
                    { name: '🔮 ミスティック (パープル)', value: 'mystic_purple' },
                    { name: '💧 アクア (ライトブルー)', value: 'aqua_blue' }
                )),
            new SlashCommandBuilder()
                .setName('temp_remove')
                .setDescription('【管理者用】臨時情報の看板を取り下げるちゅ！')
                .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        ].map(c => c.toJSON());

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        try {
            console.log('Registering commands...');
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
            console.log('✅ Commands registered!');
        } catch (e) {
            console.error('Failed to register commands:', e);
        }
    }
});
client.on(Events.MessageCreate, async (message) => {
    // ボット自身のメッセージには反応しない
    if (message.author.bot) return;

    // カラオケモジュールに「メッセージが来たよ」と教えてあげる
    await karaokeLogic.onMessageInKaraokeChannel(message);

    // 💡 【追加】案内板（Sticky Message）のおっかけ処理！
    if (message.channelId === STICKY_CHANNEL_ID) {
        const lastId = stickyMessageIds.get(message.channelId);
        if (lastId) {
            try {
                const lastMsg = await message.channel.messages.fetch(lastId);
                if (lastMsg) await lastMsg.delete();
            } catch (e) {}
        }
        try {
            const attachments = await stickyLogic.getStickyAttachments(); // モジュールにお願いするちゅ！
            
            // 💡 【修正】画像がある時（お知らせ設定中）だけ送信するちゅ！
            if (attachments && attachments.length > 0) {
                const sentMsg = await message.channel.send({ files: attachments });
                stickyMessageIds.set(message.channelId, sentMsg.id);
                saveStickyData();
            } else if (stickyMessageIds.has(message.channelId)) {
                // 💡 お知らせが解除された時は、メモ帳から記憶を消しておくちゅ！
                stickyMessageIds.delete(message.channelId);
                saveStickyData();
            }
            
        } catch (e) {
            console.error('最下段画像の設置エラーだちゅ:', e);
        }
    }
});
// --- Interaction Handler ---
client.on('interactionCreate', async (interaction) => {
    // 1. Slash Command Registration logic
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'nezumi') {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_tarot').setLabel('タロット1枚').setEmoji('🔮').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('btn_tarot3').setLabel('タロット3枚').setEmoji('🌌').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('btn_horoscope').setLabel('星座占い').setEmoji('✨').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('btn_rune').setLabel('ルーン占い').setEmoji('🗿').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_weather_modal').setLabel('天気予報').setEmoji('🌤️').setStyle(ButtonStyle.Secondary)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_mouse').setLabel('ねずみ写真').setEmoji('🐭').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_rat').setLabel('ラット写真').setEmoji('🐀').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_quiz').setLabel('ねずみクイズ').setEmoji('❓').setStyle(ButtonStyle.Warning),
                new ButtonBuilder().setCustomId('btn_hitandblow_modal').setLabel('Hit&Blow').setEmoji('🔢').setStyle(ButtonStyle.Danger)
            );
            const row3 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_sushi_order').setLabel('寿司注文').setEmoji('🍣').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('btn_sushi_oaiso').setLabel('おあいそ').setEmoji('💰').setStyle(ButtonStyle.Success)
            );
            const row4 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_pet_catch').setLabel('仲間探し').setEmoji('🌱').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('btn_pet_status').setLabel('相棒確認').setEmoji('📊').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('btn_pet_train_menu').setLabel('猛特訓').setEmoji('💪').setStyle(ButtonStyle.Danger)
            );
            const row5 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_pet_battle_menu').setLabel('格闘場').setEmoji('⚔️').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('btn_pet_ranking').setLabel('番付').setEmoji('🏆').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('btn_pet_release').setLabel('お別れ').setEmoji('🍃').setStyle(ButtonStyle.Secondary)
            );

            await interaction.reply({ 
                content: '🐭「へいらっしゃい！今日は何をして遊ぶんだいちゅ？」',
                components: [row1, row2, row3, row4, row5]
            });
            return;
        }

        if (interaction.commandName === 'kibun') {
            const level = interaction.options.getInteger('level');
            const memo = interaction.options.getString('memo') || '';
            userKibun = kibunLogic.recordKibun(userKibun, interaction.user.id, level, memo);
            saveKibun();
            const emojis = { 5: '✨', 4: '☀️', 3: '☁️', 2: '🌧️', 1: '⚡' };
            await interaction.reply({ content: `心の天気図に記録したちゅ！ ${emojis[level]}\n今の気分: **レベル${level}**${memo ? `\nメモ: ${memo}` : ''}`, flags: MessageFlags.Ephemeral });
            return;
        }

        if (interaction.commandName === 'kibun_setchannel') {
            const row = kibunLogic.getChannelSelectMenu(interaction.guild, interaction.member, client.user);
            if (!row) return interaction.reply({ content: '書き込めるチャンネルが見つからないちゅ…。', flags: MessageFlags.Ephemeral });
            await interaction.reply({ content: 'レポートを届けるチャンネルを選んでちゅ！✨', components: [row], flags: MessageFlags.Ephemeral });
            return;
        }

        if (interaction.commandName === 'kibun_resetchannel') {
            delete kibunSettings[interaction.user.id];
            saveKibunSettings();
            await interaction.reply({ content: 'レポート設定をリセットしたちゅ！', flags: MessageFlags.Ephemeral });
            return;
        }

        if (interaction.commandName === 'clearall') {
            await interaction.deferReply({ ephemeral: true });
            const targetUser = interaction.options.getUser('target');
            const dateString = interaction.options.getString('date');
            const targetTimestamp = new Date(dateString).getTime();

            if (isNaN(targetTimestamp)) {
                return interaction.editReply('日付の形式が違うちゅ！`YYYY-MM-DD` で入力してちゅ。');
            }

            await interaction.editReply(`⏳ ${targetUser.username}さんの ${dateString} 以降のメッセージを掃除しているちゅ。時間がかかるかもしれないちゅ…。`);
            
            try {
                const count = await busterLogic.deleteMessagesRecursively(interaction.channel, targetUser, targetTimestamp);
                await interaction.editReply(`✅ 掃除完了だちゅ！ ${targetUser.username}さんのメッセージを合計 **${count}件** キレイにしたちゅ！✨`);
            } catch (e) {
                console.error(e);
                await interaction.editReply('❌ 掃除中にトラブルが起きちゃったちゅ…。');
            }
            return;
        }
        if (interaction.commandName === 'karaoke') {
            await interaction.reply({ content: 'カラオケパネルを起動したちゅ！', flags: MessageFlags.Ephemeral });
            await karaokeLogic.refreshPanel(interaction.channel);
            return;
        }

        // 💡 【追加】臨時看板の設定コマンド
        if (interaction.commandName === 'temp_setup') {
            const templateType = interaction.options.getString('template') || 'alert_red';
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder().setCustomId(`modal_temp_setup_${templateType}`).setTitle('🚨 臨時看板の設定');
            const titleInput = new TextInputBuilder().setCustomId('title').setLabel('タイトル').setPlaceholder('例: 臨時メンテナンス').setStyle(TextInputStyle.Short).setRequired(true);
            const descInput = new TextInputBuilder().setCustomId('desc').setLabel('内容').setPlaceholder('改行もできるちゅ！').setStyle(TextInputStyle.Paragraph).setRequired(true);

            const tempPath = path.join(__dirname, 'designs', 'temp_board.json');
            if (fs.existsSync(tempPath)) {
                try {
                    const tempData = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
                    if (tempData.title) titleInput.setValue(tempData.title);
                    if (tempData.desc) descInput.setValue(tempData.desc);
                } catch(e) {}
            }
            modal.addComponents(new ActionRowBuilder().addComponents(titleInput), new ActionRowBuilder().addComponents(descInput));
            await interaction.showModal(modal);
            return;
        }

        // 💡 【追加】臨時看板の削除コマンド
        if (interaction.commandName === 'temp_remove') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const tempPath = path.join(__dirname, 'designs', 'temp_board.json');
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
                await interaction.editReply('🗑️ 臨時看板を取り下げたちゅ！');
            } else {
                await interaction.editReply('🤔 今は臨時看板は出てないみたいだちゅ！');
            }
            return;
        }
    }


    // Modal & Menu Triggers
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_pet_train_menu') {
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_pet_train')
                    .setPlaceholder('どの特訓をするちゅ？💪')
                    .addOptions([
                        { label: '🗡️ 攻撃', description: 'ATK重視', value: 'atk' },
                        { label: '🛡️ 防御', description: 'DEF重視', value: 'def' },
                        { label: '💨 敏捷', description: 'SPD重視', value: 'spd' },
                        { label: '🌀 精神', description: 'SP・混乱耐性重視', value: 'sp' },
                        { label: '🌟 総合', description: 'バランス良く', value: 'all' }
                    ])
            );
            await interaction.reply({ content: '相棒の特訓コースを選んでちゅ！', components: [row], flags: MessageFlags.Ephemeral });
            return;
        }
        if (interaction.customId === 'btn_pet_battle_menu') {
            const row = new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId('select_pet_battle')
                    .setPlaceholder('対戦相手のテイマーを選んでちゅ！⚔️')
            );
            await interaction.reply({ content: 'バトルを挑む相手を選んでちゅ！', components: [row], flags: MessageFlags.Ephemeral });
            return;
        }
        if (interaction.customId === 'btn_weather_modal') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder().setCustomId('modal_weather').setTitle('天気予報の設定だちゅ！');
            const input = new TextInputBuilder()
                .setCustomId('input_prefecture')
                .setLabel('都道府県を入力してちゅ！')
                .setPlaceholder('例：東京、北海道、大阪')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
            return;
        }
        if (interaction.customId === 'btn_hitandblow_modal') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder().setCustomId('modal_hitandblow').setTitle('Hit & Blow');
            const input = new TextInputBuilder()
                .setCustomId('input_guess')
                .setLabel('4桁の数字を予想してちゅ！(重複なし)')
                .setPlaceholder('例：1234')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(input));
            await interaction.showModal(modal);
            return;
        }
        // カラオケ機能のボタン処理
        if (['btn_karaoke_join', 'btn_karaoke_leave', 'btn_karaoke_force_skip'].includes(interaction.customId)) {
            await karaokeLogic.handleKaraokeInteraction(interaction);
            return;
        }
    }

    // Interaction Handling logic
    try {
        let currentFlags = 0;
        if (interaction.message && interaction.message.flags.has(MessageFlags.Ephemeral)) {
            currentFlags = MessageFlags.Ephemeral;
        }

        // Ownership check
        if ((interaction.isButton() || interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) && interaction.message && interaction.message.interaction) {
            if (interaction.user.id !== interaction.message.interaction.user.id) {
                return interaction.reply({ 
                    content: 'これは他の人のメニューだちゅ！自分で `/nezumi` を打って遊んでちゅ！🐭', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }

        // Defer logic
        if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
            const skipDeferIds = ['sushi_select_order', 'oaiso_add_item', 'oaiso_bill_please', 'catch_attempt', 'catch_ignore', 'kibun_select_channel', 'correct_nezumi', 'incorrect_nezumi', 'select_pet_train', 'select_pet_battle'];
            if (!skipDeferIds.includes(interaction.customId) && !interaction.customId.startsWith('btn_atk')) {
                if (interaction.isModalSubmit()) await interaction.deferReply({ flags: currentFlags });
                else {
                    await interaction.deferUpdate();
                    await interaction.editReply({ components: [] });
                }
            }
        }

        // --- COMMAND LOGIC ---

        // 💡 【追加】臨時看板のモーダル送信を受け取る
        if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_temp_setup')) {
            const parts = interaction.customId.split('_');
            const templateType = parts.slice(3).join('_') || 'alert_red';
            const title = interaction.fields.getTextInputValue('title');
            const desc = interaction.fields.getTextInputValue('desc');
            
            const designsDir = path.join(__dirname, 'designs');
            if (!fs.existsSync(designsDir)) fs.mkdirSync(designsDir);
            const tempPath = path.join(designsDir, 'temp_board.json');
            
            fs.writeFileSync(tempPath, JSON.stringify({ title, desc, template: templateType }, null, 2));
            await interaction.editReply({ content: '🚨 臨時看板をセットしたちゅ！次のメッセージから表示されるちゅよ！' });
            return;
        }

        // Tarot 1
        if (interaction.customId === 'btn_tarot') {
            await interaction.editReply({ content: '🌌 星の導きを読み解きながら、今日の1枚を描いているちゅ…！🐭🎨' });
            const personalSeed = getPersonalDailyRandom(interaction.user.id);
            const selectedCard = tarotCards[Math.floor(personalSeed * tarotCards.length)];
            const isReversed = getPersonalDailyRandom(interaction.user.id, 999) < 0.5;
            const mouseWhisper = tarotLogic.getSingleCardComment(selectedCard, isReversed);
            const geminiExplanation = await llmService.getGeminiReading(selectedCard.name, isReversed, interaction.user.id);
            const buffer = await tarotLogic.generateTarot1Canvas(interaction.user, selectedCard, isReversed, mouseWhisper, geminiExplanation);
            await interaction.editReply({ content: 'お待たせしたちゅ！今日のお告げだちゅ！✨', files: [new AttachmentBuilder(buffer, { name: 'tarot1.png' })] });
        }

        // Tarot 3
        else if (interaction.customId === 'btn_tarot3') {
            await interaction.editReply({ content: '🌌 運命の3枚を読み解いているちゅ…！🐭🎨' });
            const positions = ['過去', '現在', '未来'];
            const drawnResults = [];
            let tempDeck = [...tarotCards];
            for (let i = 0; i < 3; i++) {
                const pSeed = getPersonalDailyRandom(interaction.user.id, (i + 1) * 777);
                const card = tempDeck.splice(Math.floor(pSeed * tempDeck.length), 1)[0];
                const isR = getPersonalDailyRandom(interaction.user.id, (i + 1) * 999) < 0.5;
                drawnResults.push({ position: positions[i], card, isReversed: isR });
            }
            const story = tarotLogic.generateTarotStory(drawnResults[0], drawnResults[1], drawnResults[2]);
            const geminiExp = await llmService.getGeminiReading3(drawnResults, interaction.user.username);
            const buffer = await tarotLogic.generateTarot3Canvas(interaction.user, drawnResults, story, geminiExp);
            await interaction.editReply({ content: 'お待たせしたちゅ！運命の3枚引きだちゅ！✨', files: [new AttachmentBuilder(buffer, { name: 'tarot3.png' })] });
        }

        // Horoscope
        else if (interaction.customId === 'btn_horoscope') {
            await interaction.editReply({ content: '🌌 星座の瞬きを読み解いているちゅ…！🐭🎨' });
            const ranking = signs.map((name, index) => ({
                name,
                score: Math.floor(getDailyRandom(index) * 100) + 1,
                luckyItem: luckyItems[Math.floor(getDailyRandom(index + 100) * luckyItems.length)]
            })).sort((a, b) => b.score - a.score);
            const fullMsg = await llmService.getGeminiFullHoroscope(ranking);
            const buffer = await horoscopeLogic.generateHoroscopeCanvas(ranking, fullMsg);
            await interaction.editReply({ content: 'お待たせしたちゅ！今日の星座ランキングだちゅ！✨', files: [new AttachmentBuilder(buffer, { name: 'horoscope.png' })] });
        }

        // Rune
        else if (interaction.customId === 'btn_rune') {
            await interaction.editReply({ content: '🌌 古代の石の言葉を聞いているちゅ…！🐭🎨' });
            const rune = runeAlphabet[Math.floor(getPersonalDailyRandom(interaction.user.id, 777) * runeAlphabet.length)];
            const noReverse = ['ᛗ', 'ᚷ', 'ᚹ', 'ᚻ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛊ', 'ᛝ', 'ᛞ'];
            let isR = getPersonalDailyRandom(interaction.user.id, 888) < 0.5;
            if (noReverse.includes(rune.symbol)) isR = false;
            const geminiExp = await llmService.getGeminiRuneReading(rune.name, isR, interaction.user.username);
            const buffer = await runeLogic.generateRuneCanvas(rune, isR, geminiExp);
            await interaction.editReply({ content: 'お待たせしたちゅ！石の言葉だちゅ！✨', files: [new AttachmentBuilder(buffer, { name: 'rune.png' })] });
        }

        // Weather Modal Submit
        else if (interaction.isModalSubmit() && interaction.customId === 'modal_weather') {
            const pref = interaction.fields.getTextInputValue('input_prefecture');
            const coords = prefCoords[pref.replace(/(都|府|県)$/, '')];
            if (!coords) return interaction.editReply({ content: 'その都道府県は見つからなかったちゅ…。' });
            await interaction.editReply({ content: '🌤️ 空模様を調べているちゅ…！🐭🎨' });
            const weatherData = await weatherService.getWeatherData(coords.lat, coords.lon);
            const buffer = await weatherLogic.generateWeatherCanvas(pref, weatherData, { 
                getWeatherStatus: weatherService.getWeatherStatus, 
                getMouseComment: weatherService.getMouseComment 
            });
            await interaction.editReply({ content: 'お待たせしたちゅ！今週の予報だちゅ！🌤️✨', files: [new AttachmentBuilder(buffer, { name: 'weather.png' })] });
        }

        // Hit & Blow Modal Submit
        else if (interaction.isModalSubmit() && interaction.customId === 'modal_hitandblow') {
            const guess = interaction.fields.getTextInputValue('input_guess');
            const answer = hitandblowLogic.generateAnswer();
            const result = hitandblowLogic.checkHitAndBlow(answer, guess);
            const embed = new EmbedBuilder()
                .setColor(result.hit === 4 ? 0xFFD700 : 0x0099FF)
                .setTitle('🔢 Hit & Blow')
                .setDescription(`予想: **${guess}**\n結果: **${result.hit}** Hit / **${result.blow}** Blow`)
                .setFooter({ text: '※1回ごとの使い捨て対戦だちゅ！' });
            await interaction.editReply({ content: '結果だちゅ！🎯', embeds: [embed] });
        }

        // Animal Images & Quiz
        else if (['btn_mouse', 'btn_rat'].includes(interaction.customId)) {
            const type = interaction.customId === 'btn_mouse' ? 'mouse' : 'rat';
            const chosen = extraImages[type][Math.floor(Math.random() * extraImages[type].length)];
            const buffer = await animalLogic.generateAnimalCanvas(chosen, type === 'mouse' ? '可愛いねずみだちゅ！' : 'かっこいいラットだちゅ！', type === 'mouse' ? '#FFB6C1' : '#87CEFA');
            await interaction.editReply({ content: 'お友達を連れてきたちゅ！🐾', files: [new AttachmentBuilder(buffer, { name: 'animal.png' })] });
        }
        else if (interaction.customId === 'btn_quiz') {
            const isNezumi = Math.random() < 0.5;
            const category = isNezumi ? (Math.random() < 0.5 ? 'mouse' : 'rat') : 'not_mouse';
            const chosen = extraImages[category][Math.floor(Math.random() * extraImages[category].length)];
            const buffer = await animalLogic.generateQuizCanvas(chosen);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('correct_nezumi').setLabel('ねずみだちゅ！').setEmoji('🐭').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('incorrect_nezumi').setLabel('違うちゅ！').setEmoji('❌').setStyle(ButtonStyle.Danger)
            );
            await interaction.editReply({ content: '❓ クイズだちゅ！この子はねずみかな？', files: [new AttachmentBuilder(buffer, { name: 'quiz.png' })], components: [row] });
            
            const msg = await interaction.fetchReply();
            try {
                const conf = await msg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 });
                const correct = (conf.customId === 'correct_nezumi') === isNezumi;
                const resBuffer = await animalLogic.generateQuizCanvas(chosen, true, correct);
                await conf.update({ content: correct ? '🎊 正解だちゅ！' : '😢 どんまいだちゅ…', files: [new AttachmentBuilder(resBuffer, { name: 'result.png' })], components: [] });
            } catch(e) { await interaction.editReply({ content: '時間切れだちゅ…', components: [] }); }
        }

        // Sushi
        else if (interaction.customId === 'btn_sushi_order') {
            const buffer = await sushiLogic.generateSushiWelcomeCanvas();
            const options = sushiMenu.map((s, i) => ({ label: `${s.name} (${s.price}円)`, value: i.toString(), emoji: '🍣' }));
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('sushi_select_order').setPlaceholder('注文を選んでね！').addOptions(options));
            await interaction.editReply({ content: 'へいらっしゃい！', files: [new AttachmentBuilder(buffer, { name: 'sushi.png' })], components: [row] });
        }
        else if (interaction.isStringSelectMenu() && interaction.customId === 'sushi_select_order') {
            await interaction.deferUpdate();
            const sushi = sushiMenu[parseInt(interaction.values[0])];
            await interaction.editReply({ content: `🍣 **${sushi.name}** を握ったちゅ！美味しく食べてね！`, components: [] });
        }
        else if (interaction.customId === 'btn_sushi_oaiso') {
            const target = (Math.floor(Math.random() * 4) * 1000) + 2000;
            oaisoGames.set(interaction.user.id, { target, currentTotal: 0, orderedItems: [] });
            const options = sushiMenu.map((s, i) => ({ label: s.name, value: i.toString(), emoji: '🍣' }));
            const row1 = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('oaiso_add_item').setPlaceholder('追加注文(値段は内緒!)').addOptions(options));
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('oaiso_bill_please').setLabel('おあいそ！💰').setStyle(ButtonStyle.Success));
            const buffer = await sushiLogic.generateOaisoCanvas(oaisoGames.get(interaction.user.id), 'playing', 'ぴったりを狙ってちゅ！', 'daisho.jpg');
            await interaction.editReply({ content: '大将と勝負だちゅ！', files: [new AttachmentBuilder(buffer, { name: 'oaiso.png' })], components: [row1, row2] });
        }
        else if (interaction.isStringSelectMenu() && interaction.customId === 'oaiso_add_item') {
            await interaction.deferUpdate();
            const game = oaisoGames.get(interaction.user.id);
            if (!game) return;
            const sushi = sushiMenu[parseInt(interaction.values[0])];
            game.currentTotal += sushi.price;
            game.orderedItems.push(sushi.name);
            const buffer = await sushiLogic.generateOaisoCanvas(game, 'playing', `${sushi.name} を追加したちゅ！`, sushi.image);
            await interaction.editReply({ files: [new AttachmentBuilder(buffer, { name: 'oaiso.png' })] });
        }
        else if (interaction.isButton() && interaction.customId === 'oaiso_bill_please') {
            await interaction.deferUpdate();
            const game = oaisoGames.get(interaction.user.id);
            if (!game) return;
            const diff = Math.abs(game.currentTotal - game.target);
            const msg = diff === 0 ? '神業だちゅ！無料にするちゅ！' : diff <= 200 ? '惜しい！おまけするちゅ！' : '修行が足りないちゅ！';
            const buffer = await sushiLogic.generateOaisoCanvas(game, 'result', msg, 'daisho.jpg');
            await interaction.editReply({ content: 'お会計だちゅ！', files: [new AttachmentBuilder(buffer, { name: 'result.png' })], components: [] });
            oaisoGames.delete(interaction.user.id);
        }

        // Pets
        else if (interaction.customId === 'btn_pet_catch') {
            const pet = petSpecies[Math.floor(Math.random() * petSpecies.length)];
            petCatches.set(interaction.user.id, pet);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('catch_attempt').setLabel('捕まえる！').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('catch_ignore').setLabel('見逃す').setStyle(ButtonStyle.Secondary)
            );
            const buffer = await petLogic.generatePetCatchCanvas(pet, 'appear', pet.desc);
            await interaction.editReply({ content: 'ガサガサッ…！🌿', files: [new AttachmentBuilder(buffer, { name: 'appear.png' })], components: [row] });
        }
        else if (interaction.isButton() && interaction.customId === 'catch_attempt') {
            await interaction.deferUpdate();
            const pet = petCatches.get(interaction.user.id);
            if (!pet) return;
            const success = Math.random() < 0.5;
            if (success) {
                userPets[interaction.user.id] = { 
                    name: pet.name, 
                    level: 1, exp: 0, 
                    hp: pet.baseHp, maxHp: pet.baseHp, 
                    atk: pet.baseAtk, def: pet.baseDef, spd: pet.baseSpd, 
                    maxSp: pet.maxSp || 15, staggerMax: pet.staggerMax || 20,
                    rank: Object.keys(userPets).length + 1
                };
                savePets();
            }
            const buffer = await petLogic.generatePetCatchCanvas(pet, success ? 'success' : 'fail', success ? '今日からよろしくちゅ！' : '逃げられちゃった…');
            await interaction.editReply({ content: success ? 'ゲットだちゅ！✨' : '残念…', files: [new AttachmentBuilder(buffer, { name: 'res.png' })], components: [] });
            petCatches.delete(interaction.user.id);
        }
        else if (interaction.isButton() && interaction.customId === 'catch_ignore') {
            await interaction.deferUpdate();
            await interaction.editReply({ content: '静かにその場を離れたちゅ…💨', components: [], files: [] });
            petCatches.delete(interaction.user.id);
        }
        else if (interaction.customId === 'btn_pet_status') {
            const myPet = userPets[interaction.user.id];
            if (!myPet) return interaction.editReply({ content: '相棒がいないちゅ！探しに行こうちゅ！' });
            await interaction.editReply({ content: '相棒の調子を調べてきたちゅ！📊✨' });
            const buffer = await petLogic.generatePetStatusCanvas(interaction.user, myPet);
            await interaction.editReply({ files: [new AttachmentBuilder(buffer, { name: 'pet_status.png' })] });
        }
        else if (interaction.isStringSelectMenu() && interaction.customId === 'select_pet_train') {
            await interaction.deferUpdate();
            const course = interaction.values[0];
            const userId = interaction.user.id;
            const myPet = userPets[userId];
            if (!myPet) return interaction.editReply({ content: '特訓する相棒がいないちゅ！', components: [] });
            const COOLDOWN_TIME = 5 * 60 * 1000;
            const lastTrain = global.trainCooldowns.get(userId);
            if (lastTrain && (Date.now() - lastTrain) < COOLDOWN_TIME) {
                const timeLeft = Math.ceil((COOLDOWN_TIME - (Date.now() - lastTrain)) / 60000);
                return interaction.editReply({ content: `💦 特訓したばかりだちゅ！あと ${timeLeft}分 待ってちゅ！`, components: [] });
            }
            global.trainCooldowns.set(userId, Date.now());
            const { gainedExp, levelUpInfo, flavorText } = petLogic.calculateTraining(myPet, course);
            savePets();
            const buffer = await petLogic.generatePetTrainCanvas(myPet, gainedExp, levelUpInfo, flavorText);
            await interaction.editReply({ content: '特訓お疲れ様だちゅ！💪✨', files: [new AttachmentBuilder(buffer, { name: 'train.png' })], components: [] });
        }
        else if (interaction.isUserSelectMenu() && interaction.customId === 'select_pet_battle') {
            const targetUser = interaction.users.first();
            const challengerId = interaction.user.id;
            const opponentId = targetUser.id;
            if (!userPets[challengerId]) return interaction.reply({ content: '相棒がいないちゅ！', flags: MessageFlags.Ephemeral });
            if (!userPets[opponentId]) return interaction.reply({ content: '相手が相棒を持っていないちゅ…。', flags: MessageFlags.Ephemeral });
            if (challengerId === opponentId) return interaction.reply({ content: '自分とは戦えないちゅ！', flags: MessageFlags.Ephemeral });

            let myState = { hp: userPets[challengerId].maxHp, sp: 0, stagger: userPets[challengerId].staggerMax || 20 };
            let oppState = { hp: userPets[opponentId].maxHp, sp: 0, stagger: userPets[opponentId].staggerMax || 20 };
            let turn = 1;
            let log = "⚔️ BATTLE START ⚔️";

            const updateBattle = async (isFinal = false) => {
                const buffer = await petLogic.generatePetBattleCanvas(userPets[challengerId], userPets[opponentId], myState, oppState, log, turn);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('btn_atk').setLabel('🗡️ 攻撃').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('btn_def').setLabel('🛡️ 防御').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('btn_sp').setLabel('🌀 集中').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('btn_special').setLabel('🔥 必殺技').setStyle(ButtonStyle.Danger).setDisabled(myState.sp < 10)
                );
                await interaction.editReply({ content: isFinal ? '決着！' : `バトル進行中 (ターン ${turn})`, files: [new AttachmentBuilder(buffer, { name: 'battle.png' })], components: isFinal ? [] : [row] });
            };

            await updateBattle();
            const msg = await interaction.fetchReply();
            const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === challengerId, time: 300000 });

            collector.on('collect', async i => {
                await i.deferUpdate();
                log = "";
                // Simple AI for opponent
                const myAction = i.customId;
                const oppAction = oppState.sp >= 10 ? 'btn_special' : ['btn_atk', 'btn_atk', 'btn_def', 'btn_sp'][Math.floor(Math.random() * 4)];
                
                const resolve = (isMe, act, defAct) => {
                    const attacker = isMe ? userPets[challengerId] : userPets[opponentId];
                    const atStat = isMe ? myState : oppState;
                    const dfStat = isMe ? oppState : myState;
                    if (act === 'btn_atk') {
                        const dmg = Math.max(1, (attacker.atk + Math.floor(Math.random() * 4)) - (defAct === 'btn_def' ? 10 : 0));
                        dfStat.hp = Math.max(0, dfStat.hp - dmg);
                        log += `${attacker.name}の攻撃: ${dmg}ダメ!\n`;
                    } else if (act === 'btn_def') {
                        log += `${attacker.name}は身を固めた!\n`;
                    } else if (act === 'btn_sp') {
                        atStat.sp += 5;
                        log += `${attacker.name}は集中した(SP+5)\n`;
                    } else if (act === 'btn_special') {
                        atStat.sp -= 10;
                        dfStat.hp = Math.max(0, dfStat.hp - (attacker.atk * 2));
                        log += `${attacker.name}の必殺技!!\n`;
                    }
                };

                resolve(true, myAction, oppAction);
                if (oppState.hp > 0) resolve(false, oppAction, myAction);

                if (myState.hp <= 0 || oppState.hp <= 0) {
                    const winnerPet = myState.hp > 0 ? userPets[challengerId] : userPets[opponentId];
                    const winnerName = myState.hp > 0 ? interaction.user.username : targetUser.username;
                    // Rank Swap
                    if (myState.hp > 0 && userPets[challengerId].rank > userPets[opponentId].rank) {
                        const tmp = userPets[challengerId].rank;
                        userPets[challengerId].rank = userPets[opponentId].rank;
                        userPets[opponentId].rank = tmp;
                        savePets();
                    }
                    const resBuffer = await petLogic.generatePetBattleResultCanvas(winnerPet, winnerName, "勝負あり！", "激しい戦いだったちゅ！");
                    await interaction.editReply({ files: [new AttachmentBuilder(resBuffer, { name: 'result.png' })], components: [] });
                    collector.stop();
                } else {
                    turn++;
                    await updateBattle();
                }
            });
        }
        else if (interaction.customId === 'btn_pet_ranking') {
            const sorted = Object.keys(userPets).map(id => ({ ...userPets[id], userId: id })).sort((a,b) => a.rank - b.rank);
            const buffer = await petLogic.generatePetRankingCanvas(sorted);
            await interaction.editReply({ files: [new AttachmentBuilder(buffer, { name: 'ranking.png' })] });
        }
        else if (interaction.customId === 'btn_pet_release') {
            const pet = userPets[interaction.user.id];
            if (!pet) return interaction.editReply({ content: '相棒がいないちゅ！' });
            const buffer = await petLogic.generatePetReleaseCanvas(pet, interaction.user.username);
            delete userPets[interaction.user.id];
            savePets();
            await interaction.editReply({ content: '自然に還したちゅ…🌿', files: [new AttachmentBuilder(buffer, { name: 'release.png' })] });
        }

    } catch (error) {
        console.error('Interaction Error:', error);
    }
});

// --- Reactions ---
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    const emojiId = reaction.emoji.id || reaction.emoji.name;
    const house = Object.keys(HOUSE_EMOJIS).find(h => HOUSE_EMOJIS[h] === emojiId);
    if (house) {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (member.roles.cache.has(HOUSE_ROLES[house])) {
            housePoints[house] = (housePoints[house] || 0) + 1;
            saveHouses();
        }
    }
});

// --- Cron: Weekly Report ---
cron.schedule('0 22 * * 0', async () => {
    for (const userId in kibunSettings) {
        const channelId = kibunSettings[userId];
        const data = userKibun[userId] || [];
        if (data.length === 0) continue;
        const channel = await client.channels.fetch(channelId);
        if (channel) {
            const report = data.map(d => `${new Date(d.date).toLocaleDateString()}: Lv.${d.level} ${d.memo}`).join('\n');
            await channel.send(`📊 <@${userId}> さんの今週の心の天気図だちゅ！\n${report}`);
            userKibun[userId] = []; // Clear for next week
        }
    }
    saveKibun();
}, { timezone: "Asia/Tokyo" });

client.login(process.env.DISCORD_TOKEN);