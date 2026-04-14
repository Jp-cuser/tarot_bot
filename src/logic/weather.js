const { createCanvas } = require('@napi-rs/canvas');
const { measureTextHeight, drawCanvasText } = require('../utils/canvas');
const { getJSTInfo } = require('../utils/time');
const { stripEmoji } = require('../utils/string');

/**
 * 天気予報のCanvasを生成する
 */
const generateWeatherCanvas = async (pref, daily, weatherUtils) => {
    try {
        const { getWeatherStatus, getMouseComment } = weatherUtils;
        const canvasWidth = 800;
        const dummyCanvas = createCanvas(1, 1);
        const dummyCtx = dummyCanvas.getContext('2d');
        
        const daysData = [];
        let totalPanelsHeight = 0;
        const panelPadding = 20;

        for (let i = 0; i < 7; i++) {
            const code = daily.weathercode[i];
            const rainProb = daily.precipitation_probability_max[i];
            const maxTemp = daily.temperature_2m_max[i];
            const minTemp = daily.temperature_2m_min[i];
        
            const weatherStatus = stripEmoji(getWeatherStatus(code));
            const mouseComment = stripEmoji(getMouseComment(code, rainProb, maxTemp));
            const dateStr = daily.time[i];

            dummyCtx.font = '18px NotoSansJP';
            const commentAreaWidth = canvasWidth - 360 - panelPadding * 3;
            const commentHeight = measureTextHeight(dummyCtx, mouseComment, commentAreaWidth, 26);
            
            const panelHeight = Math.max(90, commentHeight + panelPadding * 2);
            
            daysData.push({
                date: dateStr,
                status: weatherStatus,
                maxTemp, minTemp, rainProb,
                comment: mouseComment,
                panelHeight
            });
            
            totalPanelsHeight += panelHeight + 15;
        }

        const headerHeight = 120;
        const footerHeight = 60;
        const canvasHeight = headerHeight + totalPanelsHeight + footerHeight;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = '#0099FF';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        // タイトル
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px NotoSansJP';
        ctx.fillStyle = '#87CEEB';
        ctx.fillText(`${pref}の1週間予報`, canvasWidth / 2, 60);
        
        ctx.font = '20px NotoSansJP';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText('ねずみが空模様を調べてきたちゅ！', canvasWidth / 2, 95);

        // 各曜日のパネル
        let currentY = headerHeight;
        const startX = 40;
        const panelWidth = canvasWidth - 80;

        for (let i = 0; i < 7; i++) {
            const day = daysData[i];
            
            ctx.fillStyle = '#2b2d31';
            ctx.fillRect(startX, currentY, panelWidth, day.panelHeight);
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, currentY, panelWidth, day.panelHeight);

            ctx.textAlign = 'left';
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 22px NotoSansJP';
            ctx.fillText(day.date, startX + 20, currentY + 35);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px NotoSansJP';
            ctx.fillText(day.status, startX + 160, currentY + 35);

            ctx.fillStyle = '#ff6b6b'; 
            ctx.font = '20px NotoSansJP';
            ctx.fillText(`${day.maxTemp}℃`, startX + 20, currentY + 70);
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`/`, startX + 80, currentY + 70);

            ctx.fillStyle = '#4dabf7'; 
            ctx.fillText(`${day.minTemp}℃`, startX + 100, currentY + 70);

            ctx.fillStyle = '#87CEEB'; 
            ctx.fillText(`降水確率: ${day.rainProb}%`, startX + 180, currentY + 70);

            ctx.fillStyle = '#e0e0e0';
            ctx.font = 'italic 18px NotoSansJP';
            drawCanvasText(ctx, day.comment, startX + 360, currentY + 35, panelWidth - 360 - 20, 26);

            currentY += day.panelHeight + 15;
        }

        ctx.textAlign = 'right';
        ctx.font = '16px NotoSansJP';
        ctx.fillStyle = '#888';
        ctx.fillText(`今日（${getJSTInfo().displayDate}）調べたお天気だちゅ！`, canvasWidth - 30, canvasHeight - 20);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateWeatherCanvas
};
