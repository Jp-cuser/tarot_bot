const { getJSTInfo } = require('./time');

function getPersonalDailyRandom(userId, seedOffset = 0) {
    const jst = getJSTInfo();
    const dateNum = jst.seedDate;
    const userNumericId = parseInt(userId.slice(-8), 10);
    const finalSeed = dateNum + userNumericId + seedOffset;
    const x = Math.sin(finalSeed) * 10000;
    return x - Math.floor(x);
}

function getDailyRandom(seedOffset = 0) {
    const jst = getJSTInfo();
    const dateNum = jst.seedDate;
    const finalSeed = dateNum + seedOffset;
    const x = Math.sin(finalSeed) * 10000;
    return x - Math.floor(x);
}

module.exports = {
    getPersonalDailyRandom,
    getDailyRandom
};
