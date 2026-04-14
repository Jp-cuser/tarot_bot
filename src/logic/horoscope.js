const { createCanvas } = require('@napi-rs/canvas');
const { measureTextHeight, drawCanvasText } = require('../utils/canvas');
const { getJSTInfo } = require('../utils/time');
const { stripEmoji } = require('../utils/string');

/**
 * 星座占いのランキングCanvasを生成する
 */
const generateHoroscopeCanvas = async (ranking, fullMessage) => {
    const lines = fullMessage.split('\n');
    
    // 抱負の読み取り
    let rawHoufu = "楽しく過ごそうちゅ！";
    const houfuIndex = lines.findIndex(l => l.includes('抱負'));
    if (houfuIndex !== -1) {
        const parts = lines[houfuIndex].split(/[：:]/);
        let extracted = parts.slice(1).join(':').trim();
        
        if (extracted === '' && lines.length > houfuIndex + 1) {
            extracted = lines.slice(houfuIndex + 1).join(' ').trim();
        }
        
        if (extracted !== '') {
            rawHoufu = extracted.replace(/\*/g, '');
        }
    }

    let safeHoufu = stripEmoji(rawHoufu);
    if (!safeHoufu || safeHoufu === '') {
        safeHoufu = "今日も1日、自分のペースで楽しく過ごそうちゅ！";
    }

    try {
        const canvasWidth = 800;
        const dummyCanvas = createCanvas(1, 1);
        const dummyCtx = dummyCanvas.getContext('2d');
        
        // 抱負の高さ計算
        dummyCtx.font = 'italic 20px NotoSansJP';
        const houfuHeight = measureTextHeight(dummyCtx, safeHoufu, canvasWidth - 120, 28);
        
        const headerHeight = 180 + houfuHeight; 
        const panelsData = [];
        let totalPanelsHeight = 0;
        const panelPadding = 20;

        for (let i = 0; i < ranking.length; i++) {
            const item = ranking[i];
            
            const targetLine = lines.find(l => l.includes(`${i+1}位`));
            let comment = "";
            if (targetLine) {
                const parts = targetLine.split(/[：:]/);
                if (parts.length > 1) {
                    comment = parts.slice(1).join(':').replace(/\*/g, '').trim();
                } else {
                    comment = targetLine.replace(new RegExp(`.*${i+1}位.*`), '').replace(/\*/g, '').trim();
                }
            }
            comment = comment.replace(new RegExp(`${item.name}[:：]?`), '').trim();
            let safeComment = stripEmoji(comment);
            
            if (!safeComment || safeComment === '') {
                safeComment = "今日はきっといいことがあるちゅ！応援してるちゅ！";
            }

            dummyCtx.font = '18px NotoSansJP';
            const commentWidth = canvasWidth - 120;
            const commentHeight = measureTextHeight(dummyCtx, safeComment, commentWidth, 26);
            
            const isTop3 = i < 3;
            const extraHeight = isTop3 ? 30 : 0;
            const panelHeight = 40 + commentHeight + extraHeight + panelPadding * 2;
            
            panelsData.push({
                rankNum: i + 1,
                name: item.name,
                score: item.score,
                luckyItem: item.luckyItem,
                comment: safeComment,
                panelHeight,
                isTop3
            });
            
            totalPanelsHeight += panelHeight + 15;
        }

        const footerHeight = 60;
        const canvasHeight = headerHeight + totalPanelsHeight + footerHeight;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        // ヘッダー
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px NotoSansJP';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`ねずみ星座占い（${getJSTInfo().displayDate}）`, canvasWidth / 2, 60);

        // 抱負エリア
        ctx.fillStyle = '#2b2d31';
        ctx.fillRect(40, 90, canvasWidth - 80, 50 + houfuHeight);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 90, canvasWidth - 80, 50 + houfuHeight);

        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('今日の抱負', canvasWidth / 2, 125);
        
        ctx.textAlign = 'left';
        ctx.font = 'italic 20px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        drawCanvasText(ctx, safeHoufu, 60, 160, canvasWidth - 120, 28);

        // 各星座のパネル
        let currentY = headerHeight;
        const startX = 40;
        const panelWidth = canvasWidth - 80;

        for (let i = 0; i < panelsData.length; i++) {
            const day = panelsData[i];
            
            ctx.fillStyle = i === 0 ? '#3a3515' : i === 1 ? '#2a2a2a' : i === 2 ? '#362210' : '#2b2d31';
            ctx.fillRect(startX, currentY, panelWidth, day.panelHeight);
            ctx.strokeStyle = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#444';
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, currentY, panelWidth, day.panelHeight);

            ctx.textAlign = 'left';
            ctx.font = 'bold 24px NotoSansJP';
            ctx.fillStyle = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#87CEEB';
            
            const scoreText = day.isTop3 ? ` (${day.score}点)` : '';
            ctx.fillText(`第${day.rankNum}位 : ${day.name}${scoreText}`, startX + 20, currentY + 35);

            ctx.fillStyle = '#e0e0e0';
            ctx.font = '18px NotoSansJP';
            let nextY = drawCanvasText(ctx, day.comment, startX + 20, currentY + 70, panelWidth - 40, 26);

            if (day.isTop3) {
                ctx.fillStyle = '#FFB6C1';
                ctx.font = 'bold 18px NotoSansJP';
                ctx.fillText(`ラッキーアイテム: ${day.luckyItem}`, startX + 20, nextY + 10);
            }

            currentY += day.panelHeight + 15;
        }

        ctx.textAlign = 'right';
        ctx.font = '16px NotoSansJP';
        ctx.fillStyle = '#888';
        ctx.fillText(`今日調べた運勢だちゅ！`, canvasWidth - 30, canvasHeight - 20);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateHoroscopeCanvas
};
