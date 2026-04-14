const extraImages = {
    mouse: [
        { file: 'mouse01_hatsukanezumi.jpg', name: 'ハツカネズミ' },
        { file: 'mouse02_akanezumi.jpg', name: 'アカネズミ' },
        { file: 'mouse03_sunanezumi.jpg', name: 'スナネズミ' },
        { file: 'mouse04_hamster.jpg', name: 'ハムスター' },
        { file: 'mouse05_hatanezumi.jpg', name: 'ハタネズミ' },
        { file: 'mouse06_tobinezumi.jpg', name: 'トビネズミ' },
        { file: 'mouse07_yamane.jpg', name: 'ヤマネ' }
    ],
    rat: [
        { file: 'rat01_kumanezumi.jpg', name: 'クマネズミ' },
        { file: 'rat02_fansyrat.jpg', name: 'ファンシーラット' },
        { file: 'rat04_africaoninezumi.jpg', name: 'アフリカオニネズミ' },
        { file: 'rat03_dobunezumi.jpg', name: 'ドブネズミ' },
        { file: 'rat05_mizuhatanezumi.jpg', name: 'ミズハタネズミ' },
        { file: 'rat06_mekuranezumi.jpg', name: 'メクラネズミ' }
    ],
    not_mouse: [
        { file: 'not01_mouse.jpg', name: 'マウス' },
        { file: 'not02_namako_uminezumi.jpg', name: 'ナマコ（海鼠）' },
        { file: 'not03_hukuronezumi.jpg', name: 'フクロネズミ' },
        { file: 'not04_hanejinezumi.jpg', name: 'ハネジネズミ' },
        { file: 'not05_harinezumi.jpg', name: 'ハリネズミ' },
        { file: 'not06_kawanezumi.jpg', name: 'カワネズミ' },
        { file: 'not07_jakounezumi.jpg', name: 'ジャコウネズミ' },
        { file: 'not08_togarinezumi.jpg', name: 'トガリネズミ' },
        { file: 'not09_debanezumi.jpg', name: 'デバネズミ' },
        { file: 'not10_africatogenezumi.jpg', name: 'アフリカトゲネズミ' },
        { file: 'not11_morumotto.jpg', name: 'モルモット' },
        { file: 'not12_kapibara.jpg', name: 'カピバラ' },
        { file: 'not13_mara.jpg', name: 'マーラ' },
        { file: 'not14_tintira.jpg', name: 'チンチラ' },
        { file: 'not15_degu.jpg', name: 'デグー' },
        { file: 'not16_tobiusagi.jpg', name: 'トビウサギ' },
        { file: 'not17_biba.jpg', name: 'ビーバー' },
        { file: 'not18_kanngaru-nezumi.jpg', name: 'カンガルーネズミ' },
        { file: 'not19_horinezumi.jpg', name: 'ホリネズミ' },
    ]
};

const petSpecies = [
    {
        name: 'カワウソ', emoji: '🦦',
        baseHp: 30, baseAtk: 3, baseDef: 3, baseSpd: 3, maxSp: 3, staggerMax: 10,
        desc: 'ネズミに倒される哀れな生き物だっちゅ。',
        growth: { hp: [1, 1], atk: [1, 1], def: [1, 1], spd: [1, 1], maxSp: [1, 1], staggerMax: [1, 1] },
        image: 'p_kawauso.jpg'
    },
    {
        name: 'ヒノネズミ', emoji: '🔥',
        baseHp: 45, baseAtk: 7, baseDef: 3, baseSpd: 5, maxSp: 15, staggerMax: 20,
        desc: '燃える闘志を持ったバランス型。攻撃と素早さが安定して育つちゅ。',
        growth: { hp: [2, 4], atk: [1, 3], def: [0, 1], spd: [1, 2], maxSp: [0, 2], staggerMax: [1, 2] },
        image: 'p_hino.jpg'
    },
    {
        name: 'ミズネズミ', emoji: '💧',
        baseHp: 55, baseAtk: 4, baseDef: 5, baseSpd: 2, maxSp: 15, staggerMax: 25,
        desc: 'マイペースな要塞。HP・防御力・混乱耐性がグングン伸びる最強の壁役だちゅ。',
        growth: { hp: [3, 6], atk: [0, 2], def: [1, 3], spd: [0, 1], maxSp: [0, 1], staggerMax: [1, 3] },
        image: 'p_mizu.jpg'
    },
    {
        name: 'クサネズミ', emoji: '🌿',
        baseHp: 50, baseAtk: 5, baseDef: 4, baseSpd: 4, maxSp: 20, staggerMax: 15,
        desc: '自然を愛する優しいねずみ。SP上限が圧倒的に伸びやすく、必殺技を狙いやすいちゅ。',
        growth: { hp: [2, 5], atk: [1, 2], def: [0, 2], spd: [0, 2], maxSp: [2, 4], staggerMax: [0, 2] },
        image: 'p_kusa.jpg'
    },
    {
        name: 'エレキネズミ', emoji: '⚡',
        baseHp: 35, baseAtk: 8, baseDef: 2, baseSpd: 7, maxSp: 10, staggerMax: 15,
        desc: '超高速の紙装甲アタッカー。素早さと攻撃力は最強だけど、とっても打たれ弱いちゅ。',
        growth: { hp: [1, 3], atk: [2, 4], def: [0, 1], spd: [1, 3], maxSp: [0, 1], staggerMax: [0, 1] },
        image: 'p_eleki.jpg'
    }
];

module.exports = {
    extraImages,
    petSpecies
};
