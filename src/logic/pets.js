const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const { measureTextHeight, drawCanvasText } = require('../utils/canvas');
const { getJSTInfo } = require('../utils/time');
const { petSpecies } = require('../constants/pets');

const generatePetCatchCanvas = async (pet, state, extraMsg) => {
    const canvasWidth = 600;
    const dummyCanvas = createCanvas(1, 1);
    const dummyCtx = dummyCanvas.getContext('2d');

    dummyCtx.font = 'bold 22px NotoSansJP';
    const msgHeight = extraMsg ? measureTextHeight(dummyCtx, extraMsg, canvasWidth - 120, 32) : 0;

    let img = null;
    let imgDrawHeight = 0;
    const imgContentWidth = 500;

    const imageFileName = pet.image || pet.file;
    const imagePath = path.resolve(__dirname, '..', '..', 'images', imageFileName);

    if (fs.existsSync(imagePath)) {
        img = await loadImage(imagePath);
        const aspectRatio = img.width / img.height;
        imgDrawHeight = imgContentWidth / Math.max(0.1, aspectRatio);
    } else {
        imgDrawHeight = 300;
    }

    const headerHeight = 100;
    const imgSectionHeight = imgDrawHeight + 40;
    const msgBoxHeight = extraMsg ? 40 + msgHeight : 0;
    const padding = 20;

    const canvasHeight = headerHeight + imgSectionHeight + msgBoxHeight + padding + 20;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    let mainColor = '#32CD32';
    if (state === 'success') mainColor = '#FFD700';
    else if (state === 'fail') mainColor = '#607B8B';

    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 36px NotoSansJP';
    ctx.fillStyle = mainColor;
    let titleText = '';
    if (state === 'appear') titleText = 'あっ！野生の仲間が飛び出してきた！';
    else if (state === 'success') titleText = 'やったー！捕獲成功だちゅ！';
    else titleText = 'あぁっ…逃げられちゃったちゅ…';
    ctx.fillText(titleText, canvasWidth / 2, 60);

    let currentY = headerHeight;

    const imgX = (canvasWidth - imgContentWidth) / 2;
    if (img) {
        ctx.drawImage(img, imgX, currentY, imgContentWidth, imgDrawHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(imgX, currentY, imgContentWidth, imgDrawHeight);
    } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(imgX, currentY, imgContentWidth, imgDrawHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText('画像なし', canvasWidth / 2, currentY + imgDrawHeight / 2);
    }
    currentY += imgSectionHeight;

    if (extraMsg) {
        ctx.fillStyle = '#2b2d31';
        ctx.fillRect(40, currentY, canvasWidth - 80, msgBoxHeight);
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(40, currentY, canvasWidth - 80, msgBoxHeight);

        ctx.textAlign = 'left';
        ctx.font = 'bold 24px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        drawCanvasText(ctx, extraMsg, 60, currentY + 45, canvasWidth - 120, 32);
    }

    return await canvas.encode('png');
};

const generatePetBattleCanvas = async (challenger, opponent, myState, oppState, log, turn) => {
    const canvasWidth = 800;
    const dummyCanvas = createCanvas(1, 1);
    const dummyCtx = dummyCanvas.getContext('2d');

    const stripEmoji = (str) => str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[\u2600-\u27BF]/g, '').trim();
    const safeLog = stripEmoji(log);
    dummyCtx.font = '16px NotoSansJP';
    const logHeight = measureTextHeight(dummyCtx, safeLog, canvasWidth - 80, 22);

    const headerHeight = 100;
    const arenaHeight = 350;
    const logBoxHeight = Math.max(150, logHeight + 40);
    const canvasHeight = headerHeight + arenaHeight + logBoxHeight + 60;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 32px NotoSansJP';
    ctx.fillStyle = '#FF4500';
    ctx.fillText(`死闘：ターン ${turn}`, canvasWidth / 2, 60);

    const drawPetSide = async (pet, state, x, isRight) => {
        const species = petSpecies.find(s => s.name === pet.name);
        const imgPath = path.join(__dirname, '..', '..', 'images', species.image);
        const pWidth = 200;

        if (fs.existsSync(imgPath)) {
            const img = await loadImage(imgPath);
            const ratio = img.width / img.height;
            const pHeight = pWidth / ratio;

            ctx.save();
            if (isRight) {
                ctx.translate(x + pWidth, 120);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0, pWidth, pHeight);
            } else {
                ctx.drawImage(img, x, 120, pWidth, pHeight);
            }
            ctx.restore();
        }

        const gaugeX = x;
        const gaugeY = 120 + 220;
        const barW = 200;

        ctx.fillStyle = '#333';
        ctx.fillRect(gaugeX, gaugeY, barW, 15);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(gaugeX, gaugeY, barW * (state.hp / pet.maxHp), 15);

        ctx.fillStyle = '#333';
        ctx.fillRect(gaugeX, gaugeY + 20, barW, 10);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(gaugeX, gaugeY + 20, barW * (state.stagger / (pet.staggerMax || 20)), 10);

        ctx.textAlign = 'left';
        ctx.font = 'bold 18px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stripEmoji(pet.name), gaugeX, gaugeY - 10);
    };

    await drawPetSide(challenger, myState, 80, false);
    await drawPetSide(opponent, oppState, 520, true);

    ctx.textAlign = 'center';
    ctx.font = 'bold 60px NotoSansJP';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('VS', canvasWidth / 2, 280);

    const logY = headerHeight + arenaHeight;
    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(40, logY, canvasWidth - 80, logBoxHeight);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, logY, canvasWidth - 80, logBoxHeight);

    ctx.textAlign = 'left';
    ctx.font = '16px NotoSansJP';
    ctx.fillStyle = '#ffffff';
    drawCanvasText(ctx, safeLog, 60, logY + 35, canvasWidth - 120, 22);

    return await canvas.encode('png');
};

const generatePetBattleResultCanvas = async (winnerPet, winnerUsername, rankMsg, aiCommentary) => {
    const canvasWidth = 600;
    const dummyCanvas = createCanvas(1, 1);
    const dummyCtx = dummyCanvas.getContext('2d');

    const stripEmoji = (str) => str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[\u2600-\u27BF]/g, '').trim();
    const safeRank = stripEmoji(rankMsg);
    const safeComment = stripEmoji(aiCommentary);

    const textPadding = 60;
    const maxWidth = canvasWidth - (textPadding * 2);

    dummyCtx.font = 'bold 22px NotoSansJP';
    const rankHeight = measureTextHeight(dummyCtx, safeRank, maxWidth, 32);

    dummyCtx.font = 'italic 20px NotoSansJP';
    const commentHeight = measureTextHeight(dummyCtx, safeComment, maxWidth, 28);

    const species = petSpecies.find(s => s.name === winnerPet.name);
    const imgPath = path.join(__dirname, '..', '..', 'images', species.image);
    let img = null;
    let drawHeight = 300;
    const contentWidth = 400;

    if (fs.existsSync(imgPath)) {
        img = await loadImage(imgPath);
        drawHeight = contentWidth / (img.width / img.height);
    }

    const headerHeight = 120;
    const imgSectionHeight = drawHeight + 40;
    const boxContentHeight = 80 + 40 + rankHeight + 30 + 40 + commentHeight + 60;
    const canvasHeight = headerHeight + imgSectionHeight + boxContentHeight + 40;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 42px NotoSansJP';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('🏆 BATTLE RESULT 🏆', canvasWidth / 2, 70);

    let currentY = headerHeight;

    const imgX = (canvasWidth - contentWidth) / 2;
    if (img) {
        ctx.drawImage(img, imgX, currentY, contentWidth, drawHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.strokeRect(imgX, currentY, contentWidth, drawHeight);
    }
    currentY += imgSectionHeight;

    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(40, currentY, canvasWidth - 80, boxContentHeight);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, currentY, canvasWidth - 80, boxContentHeight);

    ctx.font = 'bold 28px NotoSansJP';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`WINNER: ${winnerUsername}`, canvasWidth / 2, currentY + 50);

    ctx.textAlign = 'left';
    ctx.font = 'bold 22px NotoSansJP';
    ctx.fillStyle = '#00FF00';
    ctx.fillText('📊 ランク変動', 60, currentY + 110);
    ctx.fillStyle = '#ffffff';
    let nextY = drawCanvasText(ctx, safeRank, 60, currentY + 145, maxWidth, 32);

    nextY += 30;
    ctx.font = 'bold 22px NotoSansJP';
    ctx.fillStyle = '#87CEEB';
    ctx.fillText('🎙️ ねずみの実況', 60, nextY);
    ctx.font = 'italic 20px NotoSansJP';
    ctx.fillStyle = '#e0e0e0';
    drawCanvasText(ctx, safeComment, 60, nextY + 35, maxWidth, 28);

    return await canvas.encode('png');
};

const generatePetRankingCanvas = async (sortedPets) => {
    const canvasWidth = 800;
    const stripEmoji = (str) => str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[\u2600-\u27BF]/g, '').trim();

    const headerHeight = 150;
    const panelHeight = 90;
    const panelGap = 15;
    const footerHeight = 60;

    const displayCount = Math.min(10, sortedPets.length);
    const canvasHeight = headerHeight + (panelHeight + panelGap) * displayCount + footerHeight;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 40px NotoSansJP';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('🏆 ペットバトル 殿堂入りランキング 🏆', canvasWidth / 2, 70);

    ctx.font = '20px NotoSansJP';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText('最強のテイマーたちの記録だちゅ！', canvasWidth / 2, 110);

    let currentY = headerHeight;

    for (let i = 0; i < displayCount; i++) {
        const pet = sortedPets[i];
        const rank = i + 1;
        const startX = 40;
        const panelWidth = canvasWidth - 80;

        let panelColor = '#2b2d31';
        let borderColor = '#444';
        let rankColor = '#ffffff';

        if (rank === 1) { panelColor = '#4d4400'; borderColor = '#FFD700'; rankColor = '#FFD700'; }
        else if (rank === 2) { panelColor = '#333333'; borderColor = '#C0C0C0'; rankColor = '#C0C0C0'; }
        else if (rank === 3) { panelColor = '#3d2b1f'; borderColor = '#CD7F32'; rankColor = '#CD7F32'; }

        ctx.fillStyle = panelColor;
        ctx.fillRect(startX, currentY, panelWidth, panelHeight);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, currentY, panelWidth, panelHeight);

        ctx.textAlign = 'left';
        ctx.font = 'bold 32px NotoSansJP';
        ctx.fillStyle = rankColor;
        ctx.fillText(`${rank}位`, startX + 20, currentY + 55);

        const safePetName = stripEmoji(pet.name);
        const userName = pet.userName || '不明なテイマー';

        ctx.font = 'bold 24px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(safePetName, startX + 120, currentY + 40);

        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`テイマー: ${userName} (Lv.${pet.level})`, startX + 120, currentY + 70);

        ctx.textAlign = 'right';
        ctx.font = 'bold 18px NotoSansJP';
        ctx.fillStyle = '#87CEEB';
        ctx.fillText(`HP:${pet.maxHp} ATK:${pet.atk} DEF:${pet.def} SPD:${pet.spd}`, startX + panelWidth - 20, currentY + 55);

        currentY += panelHeight + panelGap;
    }

    ctx.textAlign = 'center';
    ctx.font = '14px NotoSansJP';
    ctx.fillStyle = '#666';
    ctx.fillText(`集計日：${getJSTInfo().displayDate}`, canvasWidth / 2, canvasHeight - 25);

    return await canvas.encode('png');
};

const generatePetReleaseCanvas = async (pet, username) => {
    const canvasWidth = 600;
    const dummyCanvas = createCanvas(1, 1);
    const dummyCtx = dummyCanvas.getContext('2d');

    const stripEmoji = (str) => str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[\u2600-\u27BF]/g, '').trim();
    const safePetName = stripEmoji(pet.name);

    const releaseMsg = `Lv.${pet.level}まで一緒に過ごした ${safePetName} を自然に還したちゅ。\n今まで本当にありがとう、元気でね…！`;
    const safeMsg = stripEmoji(releaseMsg);

    dummyCtx.font = 'italic 20px NotoSansJP';
    const msgHeight = measureTextHeight(dummyCtx, safeMsg, canvasWidth - 120, 30);

    const species = petSpecies.find(s => s.name === pet.name);
    const imgPath = path.join(__dirname, '..', '..', 'images', species ? species.image : 'default_pet.jpg');
    let img = null;
    let drawHeight = 300;
    const contentWidth = 400;

    if (fs.existsSync(imgPath)) {
        img = await loadImage(imgPath);
        drawHeight = contentWidth / (img.width / img.height);
    }

    const headerHeight = 100;
    const imgSectionHeight = drawHeight + 40;
    const boxHeight = msgHeight + 80;
    const canvasHeight = headerHeight + imgSectionHeight + boxHeight + 60;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 32px NotoSansJP';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText('🍃 自然へ還る相棒', canvasWidth / 2, 60);

    let currentY = headerHeight;

    const imgX = (canvasWidth - contentWidth) / 2;
    if (img) {
        ctx.drawImage(img, imgX, currentY, contentWidth, drawHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(imgX, currentY, contentWidth, drawHeight);
    }
    currentY += imgSectionHeight;

    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(40, currentY, canvasWidth - 80, boxHeight);
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, currentY, canvasWidth - 80, boxHeight);

    ctx.textAlign = 'left';
    ctx.font = 'italic 20px NotoSansJP';
    ctx.fillStyle = '#ffffff';
    drawCanvasText(ctx, safeMsg, 60, currentY + 50, canvasWidth - 120, 30);

    ctx.textAlign = 'right';
    ctx.font = '14px NotoSansJP';
    ctx.fillStyle = '#888';
    ctx.fillText(`${username} との思い出を胸に…`, canvasWidth - 50, canvasHeight - 20);

    return await canvas.encode('png');
};

const generatePetStatusCanvas = async (user, myPet) => {
    const stripEmoji = (str) => str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[\u2600-\u27BF]/g, '').trim();

    try {
        const speciesData = petSpecies.find(s => s.name === myPet.name);
        const imageFileName = speciesData ? speciesData.image : 'default_pet.jpg';
        const imagePath = path.join(__dirname, '..', '..', 'images', imageFileName);

        let img = null;
        let drawHeight = 300;
        const cardWidth = 300;

        if (fs.existsSync(imagePath)) {
            img = await loadImage(imagePath);
            const aspectRatio = img.width / img.height;
            drawHeight = cardWidth / Math.max(0.1, aspectRatio);
        }

        const canvasWidth = 600;
        const headerHeight = 100;
        const statusBoxHeight = 350; 
        const canvasHeight = headerHeight + drawHeight + statusBoxHeight + 60;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1a1c2c';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = 'center';
        ctx.font = 'bold 32px NotoSansJP';
        ctx.fillStyle = '#00BFFF';
        ctx.fillText(`第${myPet.rank}位：${user.username}の相棒`, canvasWidth / 2, 60);

        const centerX = canvasWidth / 2;
        const imgY = headerHeight;
        if (img) {
            ctx.drawImage(img, centerX - cardWidth / 2, imgY, cardWidth, drawHeight);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.strokeRect(centerX - cardWidth / 2, imgY, cardWidth, drawHeight);
        }

        const boxY = imgY + drawHeight + 30;
        ctx.fillStyle = '#2b2d31';
        ctx.fillRect(40, boxY, canvasWidth - 80, statusBoxHeight - 40);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, boxY, canvasWidth - 80, statusBoxHeight - 40);

        ctx.textAlign = 'left';
        ctx.font = 'bold 28px NotoSansJP';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${myPet.name} (Lv.${myPet.level})`, 60, boxY + 50);

        ctx.font = '22px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        const statsY = boxY + 100;
        ctx.fillText(`❤️ HP: ${myPet.hp} / ${myPet.maxHp}`, 60, statsY);
        ctx.fillText(`🗡️ ATK: ${myPet.atk}`, 60, statsY + 40);
        ctx.fillText(`🛡️ DEF: ${myPet.def}`, 60, statsY + 80);
        ctx.fillText(`💨 SPD: ${myPet.spd}`, 60, statsY + 120);

        const nextExp = myPet.level * 10;
        const expPercent = Math.min(1, myPet.exp / nextExp);
        const barWidth = canvasWidth - 120;
        const barY = statsY + 170;

        ctx.fillStyle = '#333';
        ctx.fillRect(60, barY, barWidth, 30);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(60, barY, barWidth * expPercent, 30);
        
        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`EXP: ${myPet.exp} / ${nextExp}`, canvasWidth / 2, barY + 22);

        ctx.textAlign = 'left';
        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText(`SP上限: ${myPet.maxSp || 15} | 混乱耐性: ${myPet.staggerMax || 20}`, 60, barY + 70);

        ctx.textAlign = 'right';
        ctx.font = '14px NotoSansJP';
        ctx.fillStyle = '#888';
        ctx.fillText(`ステータス確認日：${getJSTInfo().displayDate}`, canvasWidth - 50, canvasHeight - 20);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

const calculateTraining = (myPet, course) => {
    let bonus = { hp: 0, atk: 0, def: 0, spd: 0, sp: 0, stagger: 0 };
    let flavorText = "";
    if (course === 'atk') { bonus.atk = 2; bonus.hp = 1; flavorText = "重い丸太を持ち上げてスクワットをしたちゅ！筋肉がパンパンだちゅ！"; }
    else if (course === 'def') { bonus.def = 2; bonus.hp = 1; flavorText = "飛んでくる木の実をひたすらガードしたちゅ！打たれ強くなったちゅ！"; }
    else if (course === 'spd') { bonus.spd = 2; flavorText = "川沿いを全速力で猛ダッシュしたちゅ！足腰が鍛えられたちゅ！"; }
    else if (course === 'sp') { bonus.sp = 2; bonus.stagger = 2; flavorText = "冷たい滝に打たれて精神を統一したちゅ！心が研ぎ澄まされたちゅ！"; }
    else if (course === 'all') { bonus.hp = 1; bonus.atk = 1; bonus.def = 1; bonus.spd = 1; flavorText = "いろんな基礎特訓をまんべんなくこなしたちゅ！いい汗かいたちゅ！"; }

    const gainedExp = Math.floor(Math.random() * 11) + 5;
    myPet.exp += gainedExp;

    let levelUpInfo = null;
    let requiredExp = myPet.level * 10;

    if (myPet.exp >= requiredExp) {
        myPet.level += 1;
        myPet.exp -= requiredExp;
        const speciesData = petSpecies.find(s => s.name === myPet.name) || petSpecies[0];
        const g = speciesData.growth;
        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const grow = {
            hp: rand(g.hp[0], g.hp[1]) + bonus.hp,
            atk: rand(g.atk[0], g.atk[1]) + bonus.atk,
            def: rand(g.def[0], g.def[1]) + bonus.def,
            spd: rand(g.spd[0], g.spd[1]) + bonus.spd,
            sp: rand(g.maxSp[0], g.maxSp[1]) + bonus.sp,
            stg: rand(g.staggerMax[0], g.staggerMax[1]) + bonus.stagger
        };

        myPet.maxHp += grow.hp; myPet.hp = myPet.maxHp;
        myPet.atk += grow.atk; myPet.def += grow.def; myPet.spd += grow.spd;
        myPet.maxSp += grow.sp; myPet.staggerMax += grow.stg;
        levelUpInfo = grow;
    }

    return { gainedExp, levelUpInfo, flavorText };
};

const generatePetTrainCanvas = async (myPet, gainedExp, levelUpInfo, flavorText) => {
    const stripEmoji = (str) => str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[\u2600-\u27BF]/g, '').trim();

    try {
        const speciesData = petSpecies.find(s => s.name === myPet.name);
        const imagePath = path.join(__dirname, '..', '..', 'images', speciesData.image);
        let img = null; let drawHeight = 250; const cardWidth = 250;
        if (fs.existsSync(imagePath)) {
            img = await loadImage(imagePath);
            drawHeight = cardWidth / (img.width / img.height);
        }

        const canvasWidth = 600;
        const headerHeight = 100;
        const resultBoxHeight = levelUpInfo ? 450 : 300; 
        const canvasHeight = headerHeight + drawHeight + resultBoxHeight + 60;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e1e24'; ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = '#FFA500'; ctx.lineWidth = 10; ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = 'center'; ctx.font = 'bold 36px NotoSansJP'; ctx.fillStyle = '#FFA500';
        ctx.fillText(`${stripEmoji(myPet.name)}の猛特訓リザルト`, canvasWidth / 2, 60);

        if (img) {
            ctx.drawImage(img, (canvasWidth - cardWidth) / 2, headerHeight, cardWidth, drawHeight);
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect((canvasWidth - cardWidth) / 2, headerHeight, cardWidth, drawHeight);
        }

        let currentY = headerHeight + drawHeight + 30;
        ctx.fillStyle = '#2b2d31'; ctx.fillRect(40, currentY, canvasWidth - 80, resultBoxHeight - 40);
        ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.strokeRect(40, currentY, canvasWidth - 80, resultBoxHeight - 40);

        ctx.textAlign = 'left'; ctx.font = 'italic 20px NotoSansJP'; ctx.fillStyle = '#e0e0e0';
        currentY += 45;
        currentY = drawCanvasText(ctx, stripEmoji(flavorText), 60, currentY, canvasWidth - 120, 28);

        currentY += 30; ctx.font = 'bold 24px NotoSansJP'; ctx.fillStyle = '#00FF00';
        ctx.fillText(`+${gainedExp} EXP 獲得！`, 60, currentY);

        if (levelUpInfo) {
            currentY += 40; ctx.font = 'bold 28px NotoSansJP'; ctx.fillStyle = '#FFD700';
            ctx.fillText(`🎉 レベルアップ！ Lv.${myPet.level}`, 60, currentY);
            ctx.font = '18px NotoSansJP'; ctx.fillStyle = '#ffffff';
            currentY += 35;
            ctx.fillText(`HP+${levelUpInfo.hp} ATK+${levelUpInfo.atk} DEF+${levelUpInfo.def} SPD+${levelUpInfo.spd} SP+${levelUpInfo.sp}`, 60, currentY);
        }

        currentY = canvasHeight - 80;
        ctx.font = 'bold 20px NotoSansJP'; ctx.fillStyle = '#ffffff';
        ctx.fillText(`現在の能力：HP ${myPet.maxHp} | ATK ${myPet.atk} | DEF ${myPet.def} | SPD ${myPet.spd}`, 60, currentY);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generatePetCatchCanvas,
    generatePetBattleCanvas,
    generatePetBattleResultCanvas,
    generatePetRankingCanvas,
    generatePetReleaseCanvas,
    generatePetStatusCanvas,
    generatePetTrainCanvas,
    calculateTraining
};
