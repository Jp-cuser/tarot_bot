const fs = require('fs');
const path = require('path');
const satori = require('satori').default;
const { html } = require('satori-html');
const { Resvg } = require('@resvg/resvg-js');
const axios = require('axios');
const { AttachmentBuilder } = require('discord.js');

// 💡 index.js から階層が深くなったので、ファイルのパスを調整しているちゅ！
const FONT_PATH = path.join(__dirname, '../../fonts', 'LINESeedJP-Regular.ttf');
const DESIGNS_DIR = path.join(__dirname, '../../designs');

// ==========================================================
// 🚨 臨時看板（案内板）の画像を作る魔法
// ==========================================================
const generateTempStickyImage = async (tempData) => {
    const fontBuffer = fs.readFileSync(FONT_PATH);
    const descLines = tempData.desc.split('\n').map(line => `<div style="display: flex;">${line || '　'}</div>`).join('');
    const tType = tempData.template || 'alert_red';
    let markup = '';

    const headerHtml = `
        <div style="display: flex; font-size: 20px; font-weight: bold; color: #666; margin-bottom: 5px; opacity: 0.8;">
            🐭 ねずみの案内板 🧀
        </div>`;

    if (tType === 'elegant_gold') {
        markup = `<div style="display: flex; flex-direction: column; justify-content: center; width: 600px; height: 180px; background-color: #1a1a1a; border: 6px solid #FFD700; border-radius: 15px; padding: 20px;">${headerHtml}<div style="display: flex; font-size: 26px; font-weight: bold; color: #FFD700; margin-bottom: 8px; border-bottom: 2px dashed #FFD700; padding-bottom: 5px;">${tempData.title}</div><div style="display: flex; flex-direction: column; font-size: 18px; color: #e0e0e0; line-height: 1.5;">${descLines}</div></div>`;
    } else if (tType === 'ticket_green') {
        markup = `<div style="display: flex; flex-direction: column; justify-content: center; width: 600px; height: 180px; background-color: #e8f5e9; border: 6px solid #2e7d32; border-radius: 15px; padding: 20px;">${headerHtml}<div style="display: flex; font-size: 26px; font-weight: bold; color: #1b5e20; margin-bottom: 8px; border-bottom: 2px dashed #2e7d32; padding-bottom: 5px;">${tempData.title}</div><div style="display: flex; flex-direction: column; font-size: 18px; color: #1b5e20; line-height: 1.5;">${descLines}</div></div>`;
    } else if (tType === 'pop_pink') {
        markup = `<div style="display: flex; flex-direction: column; justify-content: center; width: 600px; height: 180px; background-color: #fff0f5; border: 6px solid #ff6fa5; border-radius: 15px; padding: 20px;">${headerHtml}<div style="display: flex; font-size: 26px; font-weight: bold; color: #ff1493; margin-bottom: 8px; border-bottom: 2px dashed #ff69b4; padding-bottom: 5px;">${tempData.title}</div><div style="display: flex; flex-direction: column; font-size: 18px; color: #c71585; line-height: 1.5;">${descLines}</div></div>`;
    } else if (tType === 'mystic_purple') {
        markup = `<div style="display: flex; flex-direction: column; justify-content: center; width: 600px; height: 180px; background-color: #f5f0fa; border: 6px solid #ab8dd6; border-radius: 15px; padding: 20px;">${headerHtml}<div style="display: flex; font-size: 26px; font-weight: bold; color: #5a3c85; margin-bottom: 8px; border-bottom: 2px dashed #ab8dd6; padding-bottom: 5px;">${tempData.title}</div><div style="display: flex; flex-direction: column; font-size: 18px; color: #4b2b73; line-height: 1.5;">${descLines}</div></div>`;
    } else if (tType === 'aqua_blue') {
        markup = `<div style="display: flex; flex-direction: column; justify-content: center; width: 600px; height: 180px; background-color: #f2fcff; border: 6px solid #ace9ff; border-radius: 15px; padding: 20px;">${headerHtml}<div style="display: flex; font-size: 26px; font-weight: bold; color: #25769c; margin-bottom: 8px; border-bottom: 2px dashed #84d2f0; padding-bottom: 5px;">${tempData.title}</div><div style="display: flex; flex-direction: column; font-size: 18px; color: #175d7e; line-height: 1.5;">${descLines}</div></div>`;
    } else {
        markup = `<div style="display: flex; flex-direction: column; justify-content: center; width: 600px; height: 180px; background-color: #fff5f5; border: 6px solid #e53e3e; border-radius: 15px; padding: 20px;">${headerHtml}<div style="display: flex; font-size: 26px; font-weight: bold; color: #c53030; margin-bottom: 8px; border-bottom: 2px dashed #fc8181; padding-bottom: 5px;">${tempData.title}</div><div style="display: flex; flex-direction: column; font-size: 18px; color: #2d3748; line-height: 1.5;">${descLines}</div></div>`;
    }

    const svg = await satori(html(markup), {
        width: 600, height: 180,
        fonts: [{ name: 'NotoSansJP', data: fontBuffer, weight: 400, style: 'normal' }],
        loadAdditionalAsset: async (languageCode, segment) => {
            if (languageCode === 'emoji') {
                try {
                    const codePoints = Array.from(segment).map(char => char.codePointAt(0).toString(16));
                    const u = codePoints.filter(c => c !== 'fe0f').join('-');
                    const res = await axios.get(`https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${u}.svg`, { responseType: 'arraybuffer' });
                    return `data:image/svg+xml;base64,${Buffer.from(res.data).toString('base64')}`;
                } catch (e) { return ''; }
            }
            return '';
        }
    });

    const resvg = new Resvg(svg, { background: 'transparent', fitTo: { mode: 'original' } });
    return resvg.render().asPng();
};

// ==========================================================
// 🐭 デフォルト案内板の画像を作る魔法
// ==========================================================
const generateDefaultStickyImage = async (text) => {
    const fontBuffer = fs.readFileSync(FONT_PATH);
    const markup = `
    <div style="display: flex; flex-direction: column; background-color: #2b2d31; color: white; width: 600px; height: 180px; align-items: center; justify-content: center; border: 6px solid #f5c4c9; border-radius: 15px;">
        <div style="display: flex; font-size: 36px; font-weight: bold; margin-bottom: 15px; color: #f5c4c9;">
            🐭 ねずみの案内板 🧀
        </div>
        <div style="display: flex; font-size: 20px; color: #e0e0e0;">
            ${text}
        </div>
    </div>`;

    const svg = await satori(html(markup), {
        width: 600, height: 180,
        fonts: [{ name: 'NotoSansJP', data: fontBuffer, weight: 400, style: 'normal' }],
        loadAdditionalAsset: async (languageCode, segment) => {
            if (languageCode === 'emoji') {
                try {
                    const codePoints = Array.from(segment).map(char => char.codePointAt(0).toString(16));
                    const u = codePoints.filter(c => c !== 'fe0f').join('-');
                    const res = await axios.get(`https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${u}.svg`, { responseType: 'arraybuffer' });
                    return `data:image/svg+xml;base64,${Buffer.from(res.data).toString('base64')}`;
                } catch (e) { return ''; }
            }
            return '';
        }
    });

    const resvg = new Resvg(svg, { background: 'transparent', fitTo: { mode: 'original' } });
    return resvg.render().asPng();
};
// ==========================================================
// 📦 画像を準備するまとめ役（外から呼び出せるようにするちゅ！）
// ==========================================================
const getStickyAttachments = async () => {
    const tempPath = path.join(DESIGNS_DIR, 'temp_board.json');
    
    // 💡 お知らせデータがある時だけ、画像を作って返すちゅ！
    if (fs.existsSync(tempPath)) {
        try {
            const tempData = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
            const tempBuffer = await generateTempStickyImage(tempData);
            return [new AttachmentBuilder(tempBuffer, { name: 'sticky_banner.png' })];
        } catch(e) { console.error('臨時看板エラー:', e); }
    }
    
    // 💡 お知らせがない時は、「空っぽの配列」を返して何もしないちゅ！
    return [];
};

module.exports = {
    getStickyAttachments
};