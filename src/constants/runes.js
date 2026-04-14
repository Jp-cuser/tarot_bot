const runeAlphabet = [
    { name: 'フェイヒュー (Fehu)', symbol: 'ᚠ', meaning: '富・家畜', upright: '金運上昇。努力が形になる時だちゅ！', reversed: '無駄遣いや損失に注意が必要だちゅ。', image: 'R_01_Fehu.jpg' },
    { name: 'ウルズ (Uruz)', symbol: 'ᚢ', meaning: '力・野生牛', upright: '強いエネルギーに満ちているちゅ！前進あるのみ。', reversed: '力が空回りしそう。休息も大事だちゅ。', image: 'R_02_Uruz.jpg' },
    { name: 'ソーン (Thurisaz)', symbol: 'ᚦ', meaning: '巨人・トゲ', upright: '守護と決断。慎重に状況を見極めてちゅ。', reversed: '強引な行動はトラブルの元。立ち止まってちゅ。', image: 'R_03_Thurisaz.jpg' },
    { name: 'アンスズ (Ansuz)', symbol: 'ᚨ', meaning: '口・神', upright: '良い知らせや知恵が届くちゅ。対話を大切に。', reversed: '誤解や情報の混乱に気をつけてちゅ。', image: 'R_04_Ansuz.jpg' },
    { name: 'ライド (Raido)', symbol: 'ᚱ', meaning: '旅・車輪', upright: 'スムーズな進行。旅行や移動にツキがあるちゅ！', reversed: '計画の遅延や足止めの予感。焦りは禁物だちゅ。', image: 'R_05_Raidho.jpg' },
    { name: 'ケナズ (Kenaz)', symbol: 'ᚲ', meaning: '松明・火', upright: '才能の開花。アイデアが次々湧いてくるちゅ！', reversed: '情熱の減退。今は無理に動かず充電してちゅ。', image: 'R_06_Kenaz.jpg' },
    { name: 'ゲーボ (Gebo)', symbol: 'ᚷ', meaning: '贈り物・愛', upright: '対等な関係や素晴らしいギフトが届く予感だちゅ。', reversed: '対等な関係や素晴らしいギフトが届く予感だちゅ。', image: 'R_07_Gebo.jpg' },
    { name: 'ウンニョ (Wunjo)', symbol: 'ᚹ', meaning: '喜び・勝利', upright: '願いが叶う幸運期だちゅ！心から楽しんで。', reversed: '期待しすぎに注意。小さな幸せを大切にしてちゅ。', image: 'R_08_Wunjo.jpg' },
    { name: 'ハガラズ (Hagalaz)', symbol: 'ᚻ', meaning: '雹（ひょう）', upright: '予期せぬ変化。古いものを壊して次に進むちゅ！', reversed: '予期せぬ変化。古いものを壊して次に進むちゅ！', image: 'R_09_Hagalaz.jpg' },
    { name: 'ナウズ (Nauthiz)', symbol: 'ᚾ', meaning: '欠乏・束縛', upright: '忍耐の時。不自由さの中から学びがあるちゅ。', reversed: '焦って動くと裏目に出るちゅ。慎重に。', image: 'R_10_Nauthiz.jpg' },
    { name: 'イサ (Isa)', symbol: 'ᛁ', meaning: '氷・停止', upright: '今は停止の時。静かにチャンスを待つんだちゅ。', reversed: '今は停止の時。静かにチャンスを待つんだちゅ。', image: 'R_11_Isa.jpg' },
    { name: 'ジェラ (Jera)', symbol: 'ᛃ', meaning: '収穫・一年', upright: 'これまでの努力が実を結ぶ収穫の時だちゅ！', reversed: 'これまでの努力が実を結ぶ収穫の時だちゅ！', image: 'R_12_Jera.jpg' },
    { name: 'エイワズ (Eihwaz)', symbol: 'ᛇ', meaning: 'イチイの木・死', upright: '変化と再生。古い自分から脱皮する時だちゅ。', reversed: '変化と再生。古い自分から脱皮する時だちゅ。', image: 'R_13_Eihwaz.jpg' },
    { name: 'パース (Pertho)', symbol: 'ᛈ', meaning: '運命の袋・秘密', upright: '隠れた才能や予期せぬ幸運が見つかるちゅ！', reversed: '秘密が漏れるかも。軽はずみな言動に注意だちゅ。', image: 'R_14_Pertho.jpg' },
    { name: 'アルジズ (Algiz)', symbol: 'ᛉ', meaning: '保護・ヘラジカ', upright: '強い守護があるちゅ。直感を信じて進んで！', reversed: '無防備な状態。隙を見せないように用心してちゅ。', image: 'R_15_Algiz.jpg' },
    { name: 'ソウィロ (Sowilo)', symbol: 'ᛊ', meaning: '太陽・勝利', upright: '大成功の兆し！明るい未来が待っているちゅ. ', reversed: '大成功の兆し！明るい未来が待っているちゅ。', image: 'R_16_Sowilo.jpg' },
    { name: 'ティワズ (Tiwaz)', symbol: 'ᛏ', meaning: '戦士・勝利', upright: '強い意志で勝利を掴めるちゅ。勇気を出して。', reversed: '意欲の低下。自信を失わないようにしてちゅ。', image: 'R_17_Tiwaz.jpg' },
    { name: 'ベルカナ (Berkana)', symbol: 'ᛒ', meaning: '樺の木・誕生', upright: '新しい始まりや成長。優しさが鍵になるちゅ。', reversed: '成長の停滞。家庭内の不和に注意してちゅ。', image: 'R_18_Berkana.jpg' },
    { name: 'エワズ (Ehwaz)', symbol: 'ᛖ', meaning: '馬・協力', upright: '良きパートナーシップ。協力して進むと吉だちゅ。', reversed: '足並みが揃わない。無理に合わせず様子を見てちゅ。', image: 'R_19_Ehwaz.jpg' },
    { name: 'マナズ (Mannaz)', symbol: 'ᛗ', meaning: '人間・自己', upright: '自分自身を見つめ直す時。謙虚さが運を呼ぶちゅ。', reversed: '自己中心的な考えに注意。周囲を大切にしてちゅ。', image: 'R_20_Mannaz.jpg' },
    { name: 'ラグズ (Laguz)', symbol: 'ᛚ', meaning: '水・直感', upright: '豊かな感性。インスピレーションを大切にちゅ。', reversed: '感情に流されやすい時。冷静さを保ってちゅ。', image: 'R_21_Laguz.jpg' },
    { name: 'イングズ (Inguz)', symbol: 'ᛝ', meaning: '豊穣の神・完成', upright: '一つの区切り。満たされた気持ちになれるちゅ。', reversed: '一つの区切り。満たされた気持ちになれるちゅ。', image: 'R_22_Inguz.jpg' },
    { name: 'ダガズ (Dagaz)', symbol: 'ᛞ', meaning: '一日・光', upright: '暗闇が終わり、光が差す時。希望を持ってちゅ！', reversed: '暗闇が終わり、光が差す時。希望を持ってちゅ！', image: 'R_23_Dagaz.jpg' },
    { name: 'オサラ (Othala)', symbol: 'ᛟ', meaning: '故郷・伝統', upright: '伝統や家族からの恩恵。基盤を固める時だちゅ。', reversed: '執着しすぎに注意。新しい風を取り入れてちゅ。', image: 'R_24_Othala.jpg' }
];

module.exports = {
    runeAlphabet
};
