const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } = require('discord.js'); // AttachmentBuilderを追加
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const tarotCards = [
    { name: '0. 愚者', tone: 'positive', upright: '自由、冒険、新しい始まり', reversed: '無計画、わがまま、不注意', image: '00_Fool.jpg' },
    { name: 'I. 魔術師', tone: 'positive', upright: '創造、才能、自信', reversed: '混迷、消極的、技術不足', image: '01_Magician.jpg' },
    { name: 'II. 女教皇', tone: 'neutral', upright: '直感、知性、静寂', reversed: 'わがまま、神経質、批判的', image: '02_High_Priestess.jpg' },
    { name: 'III. 女帝', tone: 'positive', upright: '豊穣、母性、愛情', reversed: 'わがまま、嫉嫉、停滞', image: '03_Empress.jpg' },
    { name: 'IV. 皇帝', tone: 'positive', upright: '支配、安定、責任', reversed: '独裁、傲慢、無責任', image: '04_Emperor.jpg' },
    { name: 'V. 教皇', tone: 'positive', upright: '慈悲、連帯、信頼', reversed: '保守的、不信感、束縛', image: '05_Hierophant.jpg' },
    { name: 'VI. 恋人', tone: 'positive', upright: '選択、情熱、調和', reversed: '誘惑、不調和、優柔不断', image: '06_Lovers.jpg' },
    { name: 'VII. 戦車', tone: 'positive', upright: '勝利、前進、自制心', reversed: '暴走、挫折、好戦的', image: '07_Chariot.jpg' },
    { name: 'VIII. 正義', tone: 'neutral', upright: '公正、均衡、正しい判断', reversed: '不当、偏見、優柔不断', image: '08_Justice.jpg' },
    { name: 'IX. 隠者', tone: 'neutral', upright: '内省、探求、孤独', reversed: '閉鎖的、陰湿、疑い深い', image: '09_Hermit.jpg' },
    { name: 'X. 運命の輪', tone: 'positive', upright: '幸運、転換点、チャンス', reversed: '暗転、不運、一時的な停滞', image: '10_Wheel_of_Fortune.jpg' },
    { name: 'XI. 力', tone: 'positive', upright: '勇気、忍耐、強い意志', reversed: '自信喪失、甘え、無力', image: '11_Strength.jpg' },
    { name: 'XII. 刑死者', tone: 'neutral', upright: '忍耐、奉仕、視点の変化', reversed: '報われない、わがまま、無駄な努力', image: '12_Hanged_Man.jpg' },
    { name: 'XIII. 死神', tone: 'negative', upright: '終焉、再出発、変化', reversed: '執着、停滞、再起への不安', image: '13_Death.jpg' },
    { name: 'XIV. 節制', tone: 'positive', upright: '調和、自制、献身', reversed: '消耗、不摂生、不調和', image: '14_Temperance.jpg' },
    { name: 'XV. 悪魔', tone: 'negative', upright: '誘惑、束縛、執着', reversed: '解放、覚醒、再生', image: '15_Devil.jpg' },
    { name: 'XVI. 塔', tone: 'negative', upright: '崩壊、災難、突然の変化', reversed: '緊迫、不名誉、屈辱', image: '16_Tower.jpg' },
    { name: 'XVII. 星', tone: 'positive', upright: '希望、願い、ひらめき', reversed: '失望、無力感、高望み', image: '17_Star.jpg' },
    { name: 'XVIII. 月', tone: 'negative', upright: '不安、迷い、潜在意識', reversed: '不安の解消、好転、徐々に明るくなる', image: '18_Moon.jpg' },
    { name: 'XIX. 太陽', tone: 'positive', upright: '成功、誕生、明るい未来', reversed: '不調、延期、衰退', image: '19_Sun.jpg' },
    { name: 'XX. 審判', tone: 'positive', upright: '復活、再生、覚醒', reversed: '再起不能、後悔、行き詰まり', image: '20_Judgement.jpg' },
    { name: 'XXI. 世界', tone: 'positive', upright: '完成、成功、完璧', reversed: '未完成、中途半端、スランプ', image: '21_World.jpg' }
];

// --- [追加] 画像をダウンロードして、必要なら反転させる関数 ---
async function getCardImage(imageFileName, isReversed) {
    try {
        // 1. ローカルフォルダ内の画像パスを作成
        // 'images' フォルダの中に画像が入っている前提です
        const imagePath = path.join(__dirname, 'images', imageFileName);

        // 2. sharpにファイルのパスを直接渡す
        let imageProcessor = sharp(imagePath);
        
        if (isReversed) {
            // 逆位置なら上下反転（flip）させる
            imageProcessor = imageProcessor.flip();
        }

        // 3. 処理した画像をBufferとして出力
        const processedImageBuffer = await imageProcessor.png().toBuffer();
        
        // 4. Discord用の添付ファイルオブジェクトを作成
        const filename = `card_${Math.floor(Math.random() * 10000)}.png`;
        return new AttachmentBuilder(processedImageBuffer, { name: filename });

    } catch (error) {
        console.error('ローカル画像処理エラー:', error.message);
        return null; 
    }
}

// 1. スコア計算関数（パターンB：悪いカードの逆位置は緩和と捉える）
function calculateScore(card, isReversed) {
    if (card.tone === 'positive') {
        return isReversed ? 1 : 2;  // 正位置：大吉(+2)、逆位置：停滞(+1)
    } else if (card.tone === 'negative') {
        return isReversed ? -1 : -2; // 正位置：凶(-2)、逆位置：緩和(-1)
    } else {
        return 0; // 中立
    }
}

// 2. メインの診断ロジック
function generateTarotStory(past, present, future) {
    // 各カードのスコアを算出
    const s1 = calculateScore(past.card, past.isReversed);
    const s2 = calculateScore(present.card, present.isReversed);
    const s3 = calculateScore(future.card, future.isReversed);
    const totalScore = s1 + s2 + s3;

    let storyType = "";
    let message = "";

    // 3. ストーリータイプの判定
    if (s1 < s2 && s2 < s3) {
        // 右肩上がりのパターン
        if (s1 < 0) {
            storyType = "夜明け（V字回復） 🌅";
            message = "過去は厳しい状況にありましたが、いよいよ光が差してきました。最悪の時期は脱出し、未来には素晴らしい成功が待っています。";
        } else {
            storyType = "飛躍（右肩上がり） 🚀";
            message = "今の順調な流れは本物です。積み重ねてきた努力がさらに加速し、想像以上の高みへ到達できるでしょう。";
        }
    } else if (s1 > s2 && s2 > s3) {
        // 右肩下がりのパターン
        storyType = "警告（右肩下がり） ⚠️";
        message = "運気が少しずつ陰りを見せています。今は攻めるよりも守りを固め、足元を再点検してトラブルを未然に防ぎましょう。";
    } else {
        // それ以外（上下がある、または変化なし）
        storyType = "つかの間の停滞 ☕";
        if (totalScore >= 0) {
            message = "今は次の飛躍に向けた充電期間です。焦らずエネルギーを蓄えることで、また良い波に乗ることができます。";
        } else {
            message = "変化の激しい時期ですが、今は耐える時。一歩ずつ着実に進むことで、道が開けていくはずです。";
        }
    }

    return { storyType, totalScore, message };
}// --------------------------------------------------------

// Botのインスタンスを作成
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

// 1. ログイン確認用のコードを追加（client.onの上に入れる）
client.once('ready', async (c) => {
    console.log(`${c.user.tag} がログインしました！🔮`);

    // スラッシュコマンドの定義
    const data = [
        {
            name: 'tarot',
            description: 'タロットカードを1枚引きます',
        },
        {
            name: 'tarot3',
            description: '3枚のカードで過去・現在・未来を占います',
        },
    ];

    // サーバーにコマンドを登録（全サーバーに反映されるまで数分かかる場合があります）
    await client.application.commands.set(data);
    console.log('スラッシュコマンドの登録が完了しました！✅');
});

// 2. メッセージ反応部分（全角スペースを除去し、構造を整理）
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // --- 1枚引き (/tarot) ---
    if (interaction.commandName === 'tarot') {
        // 「考え中...」の状態にする（画像処理に時間がかかるため）
        await interaction.deferReply();

        const selectedCard = tarotCards[Math.floor(Math.random() * tarotCards.length)];
        const isReversed = Math.random() < 0.5;

        // [重要] 画像を取得・処理する
        const imageAttachment = await getCardImage(selectedCard.image, isReversed);

        const embed = new EmbedBuilder()
            .setColor(isReversed ? 0xFF0000 : 0x00FF00)
            .setTitle(`🔮 占い結果: ${selectedCard.name}`)
            .setDescription(`**${isReversed ? '逆位置 🙃' : '正位置 ✨'}**`)
            .addFields({ name: '意味', value: isReversed ? selectedCard.reversed : selectedCard.upright });

        if (imageAttachment) {
            // 画像が正常に処理できた場合、Embedに設定
            embed.setImage(`attachment://${imageAttachment.name}`); // 添付ファイルを指定する特殊な書き方
            // 添付ファイルと一緒に返信する
            await interaction.editReply({ embeds: [embed], files: [imageAttachment] });
        } else {
            // エラー時は文字だけで返信
            await interaction.editReply({ embeds: [embed], content: '画像の読み込みに失敗しました。' });
        }
    }

	// --- 3枚引き (/tarot3) ---
	if (interaction.commandName === 'tarot3') {
    	await interaction.deferReply();
	
    	let deck = [...tarotCards];
    	const positions = ['過去 🕰️', '現在 📍', '未来 🚀'];
    	const drawnResults = []; // 診断用にデータを溜める配列
	
    	for (let i = 0; i < 3; i++) {
        	const randomIndex = Math.floor(Math.random() * deck.length);
        	const card = deck.splice(randomIndex, 1)[0];
        	const isReversed = Math.random() < 0.5;
	
        	// 診断ロジックに渡すために保存
        	drawnResults.push({ card, isReversed });
	
        	const imageAttachment = await getCardImage(card.image, isReversed);
	
        	const embed = new EmbedBuilder()
            	.setColor(isReversed ? 0xFF0000 : 0x00FF00)
            	.setTitle(`${positions[i]}: ${card.name}`)
            	.setDescription(`**${isReversed ? '逆位置 🙃' : '正位置 ✨'}**\n\n${isReversed ? card.reversed : card.upright}`);
	
        	if (imageAttachment) {
            	embed.setImage(`attachment://${imageAttachment.name}`);
            	await interaction.followUp({ embeds: [embed], files: [imageAttachment] });
        	} else {
            	await interaction.followUp({ embeds: [embed], content: '画像の読み込みに失敗しました。' });
        	}
    	}
	
    	// --- 🏆 3枚引き終わった後に総合診断を表示 ---
    	const storyResult = generateTarotStory(drawnResults[0], drawnResults[1], drawnResults[2]);
	
    	const storyEmbed = new EmbedBuilder()
        	.setColor(0x5865F2) // Discordのブランドカラー（青色）
        	.setTitle(`📖 あなたの物語: ${storyResult.storyType}`)
        	.setDescription(storyResult.message)
        	.setFooter({ text: 'タロットはあなたの可能性を示しています。' });
	
    	await interaction.followUp({ embeds: [storyEmbed] });
}});
// ここに先ほどコピーした「トークン」を貼り付けます
client.login(process.env.DISCORD_TOKEN);