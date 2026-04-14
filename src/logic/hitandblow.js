function generateAnswer() {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let res = "";
    for (let i = 0; i < 4; i++) {
        const idx = Math.floor(Math.random() * digits.length);
        res += digits.splice(idx, 1)[0];
    }
    return res;
}

function checkHitAndBlow(ans, gus) {
    let hit = 0, blow = 0;
    for (let i = 0; i < 4; i++) {
        if (gus[i] === ans[i]) hit++;
        else if (ans.includes(gus[i])) blow++;
    }
    return { hit, blow };
}

module.exports = {
    generateAnswer,
    checkHitAndBlow
};
