const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getJSTInfo } = require('../utils/time');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel(
    { model: "models/gemini-2.5-flash" },
    { apiVersion: "v1" }
);

const readingCache = new Map();

async function callLocalLLM(prompt) {
    const localUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434/api/generate';
    const localModel = process.env.LOCAL_LLM_MODEL || 'gemma2:9b';
    const systemInstruction = `
あなたは「ねずみ」という名前の、愛らしくて凄腕のタロット・ルーン占い師です。
以下のルールを【絶対に】守って回答してください。
1. 語尾は必ず「〜ちゅ」「〜だちゅ」「〜するちゅよ」などにすること。
2. 「〜です」「〜ます」といった普通の敬語は絶対に使わないこと。
3. 絵文字を一切使わずに愛嬌を出すこと。
4. ユーザーを励まし、癒やすような優しい言葉遣いをすること。
`;
    try {
        console.log(`🔄 ローカルLLM (${localModel}) に助けを求めるちゅ...`);
        const response = await axios.post(localUrl, {
            model: localModel,
            prompt: prompt,
            system: systemInstruction,
            stream: false,
            options: {
                temperature: 0.7,
            }
        });
        return response.data.response.trim();
    } catch (error) {
        console.error('❌ ローカルLLMもダウンしてるちゅ:', error.message);
        if (error.response && error.response.data) {
            console.error('🔍 Ollamaの言い分:', error.response.data);
        }
        throw error;
    }
}

async function getGeminiReading(cardName, isReversed, username) {
    const jst = getJSTInfo();
    const dateStr = jst.dateStr;
    const cacheKey = `tarot-${dateStr}-${username}-${cardName}-${isReversed}`;

    if (readingCache.has(cacheKey)) return readingCache.get(cacheKey);

    const orientation = isReversed ? "逆位置" : "正位置";
    const prompt = `あなたは「ねずみ」という占い師です。引かれたカード：${cardName}の${orientation}。200文字以内で、癒やしのアドバイスを1つだけ言って。語尾は「ちゅ」。`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        readingCache.set(cacheKey, text);
        return text;
    } catch (error) {
        console.error('⚠️ Gemini API Error (Tarot 1):', error.message);
        try {
            const localText = await callLocalLLM(prompt);
            readingCache.set(cacheKey, localText);
            return localText;
        } catch (localError) {
            return "占いの言葉がうまくまとまらなかったちゅ…。でも、きっと大丈夫だちゅ！";
        }
    }
}

async function getGeminiReading3(cards, username) {
    const jst = getJSTInfo();
    const dateStr = jst.dateStr;
    const cacheKey = `tarot3-${dateStr}-${username}-${cards.map(c => c.name + c.isReversed).join('-')}`;

    if (readingCache.has(cacheKey)) return readingCache.get(cacheKey);

    const cardInfo = cards.map((c, i) =>
        `${['過去', '現在', '未来'][i]}: ${c.name}(${c.isReversed ? '逆位置' : '正位置'})`
    ).join('、');

    const prompt = `占い師「ねずみ」として、${username}さんの3枚引き（${cardInfo}）を統合して、400文字以内で一言でアドバイスして。最後は「ちゅ」で締めて。`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        readingCache.set(cacheKey, text);
        return text;
    } catch (error) {
        console.error('⚠️ Gemini API Error (Tarot 3):', error.message);
        try {
            const localText = await callLocalLLM(prompt);
            readingCache.set(cacheKey, localText);
            return localText;
        } catch (localError) {
            return "3枚の運命が複雑すぎて、ねずみの頭がパンクしちゃったちゅ…。でも、どのカードもあなたを応援してるちゅ！";
        }
    }
}

async function getGeminiFullHoroscope(rankingList) {
    const jst = getJSTInfo();
    const dateStr = jst.dateStr;
    const cacheKey = `full-horoscope-${dateStr}`;

    if (readingCache.has(cacheKey)) return readingCache.get(cacheKey);

    const rankingInfo = rankingList.map((item, i) => `${i + 1}位:${item.name}`).join('、');

    const prompt = `占い師「ねずみ」として、以下の星座ランキング各々に50文字以内で短い一言コメントを、最後に「今日の全体の抱負」を300文字以内で作成して。
リスト：${rankingInfo}
形式：
1位：コメント
2位：コメント
...
抱負：抱負の内容
語尾は「ちゅ」で統一して。`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        readingCache.set(cacheKey, text);
        return text;
    } catch (error) {
        console.error('⚠️ Gemini API Error (Horoscope):', error.message);
        try {
            const localText = await callLocalLLM(prompt);
            readingCache.set(cacheKey, localText);
            return localText;
        } catch (localError) {
            return "みんなにとって素敵な一日になるちゅ！\n抱負：みんなに良いことがありますようにちゅ！";
        }
    }
}

async function getGeminiRuneReading(runeName, isReversed, username) {
    const jst = getJSTInfo();
    const dateStr = jst.dateStr;
    const cacheKey = `rune-${dateStr}-${username}-${runeName}-${isReversed}`;

    if (readingCache.has(cacheKey)) return readingCache.get(cacheKey);

    const orientation = isReversed ? "逆位置" : "正位置";
    const prompt = `占い師「ねずみ」として、ルーン文字「${runeName}」の${orientation}が出た${username}さんに、300文字以内で神秘的な助言をして。語尾は「ちゅ」。`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        readingCache.set(cacheKey, text);
        return text;
    } catch (error) {
        console.error('⚠️ Gemini API Error (Rune):', error.message);
        try {
            const localText = await callLocalLLM(prompt);
            readingCache.set(cacheKey, localText);
            return localText;
        } catch (localError) {
            return "石に刻まれた文字が読めないちゅ…。でも運命は味方してるちゅ！";
        }
    }
}

module.exports = {
    callLocalLLM,
    getGeminiReading,
    getGeminiReading3,
    getGeminiFullHoroscope,
    getGeminiRuneReading
};
