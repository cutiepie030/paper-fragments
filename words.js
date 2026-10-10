/* ============================================================
   PAPER FRAGMENTS · 碎纸诗
   原创中文 / 英文文学词库（常见词组与简短表达，非任何作品摘录）
   分类：名词 / 动词 / 形容词 / 时间 / 连接短语 / 文学意象 / 情感短语 / 英文
   全部为原创组合，不复制现代文学、歌词或受版权保护文本。
   ============================================================ */
(function () {
  const WORD_LIBRARY = {
    noun: [
      '月亮', '风', '街道', '夏天', '海', '窗', '信', '影子', '灯', '雨',
      '雪', '云', '花', '书', '钟', '镜子', '杯子', '羽毛', '船', '桥',
      '树', '星', '黄昏', '梦', '火', '名字', '河流', '山', '照片', '雨伞',
      '钥匙', '钟声', '落叶', '月光', '脚印', '毛衣', '窗台', '抽屉', '信封', '潮汐',
      '玻璃', '台阶', '屋顶', '车站', '邮筒', '烛光', '夜色', '屋檐', '麦田', '海岸'
    ],
    verb: [
      '想念', '遗忘', '等待', '靠近', '逃离', '落下', '醒来', '听见', '离开', '拥抱',
      '寻找', '停止', '呼吸', '坠落', '盛开', '消失', '收藏', '梦见', '走向', '停留',
      '覆盖', '告别', '记得', '盼望', '沉入', '飞过', '书写', '回望', '相遇', '路过',
      '关上', '拾起', '凝望', '漂浮', '搁浅', '盛开', '漫步', '呢喃', '远去', '驻足'
    ],
    adjective: [
      '温柔的', '潮湿的', '漫长的', '遥远的', '安静的', '孤独的', '古老的', '微小的',
      '透明的', '疲倦的', '苍白的', '缓慢的', '荒凉的', '稚嫩的', '柔软的', '沉默的',
      '明亮的', '冰凉的', '陌生的', '熟悉的', '轻盈的', '笨拙的', '淡淡的', '小小的',
      '旧旧的', '干净的', '安静的', '温热的', '雾蒙蒙的', '毛茸茸的', '泛黄的', '发光的'
    ],
    time: [
      '某个黄昏', '十七岁', '昨天', '凌晨三点', '一个夏天', '多年以后', '立春那天',
      '某个清晨', '年末', '初雪时', '黄昏前', '毕业那年', '那个冬天', '某个午后',
      '天亮之前', '旧年', '新年的夜', '九月的风', '某个雨夜', '时光里', '夏至',
      '傍晚六点', '去年秋天', '深夜里', '少年时', '黄昏以后'
    ],
    connector: [
      '我仍然', '于是', '如果', '直到', '在……之后', '或许', '然后', '可是', '忽然',
      '后来', '原来', '终于', '而', '却', '只是', '也许', '终究', '此刻', '从此', '又',
      '因为', '所以', '不如', '好像', '其实', '终于'
    ],
    imagery: [
      '未寄出的信', '褪色的花', '旧电影的结尾', '窗台上的雨', '抽屉里的春天',
      '一封迟到的信', '落满灰尘的吉他', '半杯凉掉的茶', '没有写完的日记', '风中的信封',
      '墙上的日历', '远方的灯塔', '熄灭的烟', '折角的书页', '雨后的街道',
      '海边的旧木屋', '窗外的梧桐', '一个人的电影院', '被遗忘的生日', '深夜的站台',
      '褪色的电影票', '旧相册', '空了的鱼缸', '散场的电影院', '夕阳下的铁轨',
      '雨打在玻璃上', '写满字的便签', '枕边的书', '窗上的雾气', '未接的电话'
    ],
    emotion: [
      '没有说出口', '最后一次', '像从未发生', '我们之间', '关于你', '来不及',
      '没有关系', '不说再见', '一个人的', '很想你', '还是会', '不敢', '假装',
      '没关系', '后来啊', '慢慢来', '都好了', '早知道', '在心里', '说不出的',
      '远方的你', '某个人', '那一年', '还记得吗', '别回头', '趁现在', '一起走',
      '别走', '别怕', '就很好'
    ],
    english: [
      'perhaps', 'someday', 'forever', 'almost', 'dear you', 'summer rain',
      'maybe', 'yours', 'quietly', 'again', 'little things', 'the moon',
      'goodnight', 'after all', 'let go', 'stay', 'missing you', 'old days',
      'paper boat', 'tiny words', 'half past', 'still here', 'write soon', 'our song'
    ]
  };

  // 每类在随机抽取时的权重（保证可组合：名词/动词/连接/意象占比较高）
  const CATEGORY_WEIGHTS = {
    noun: 26, verb: 18, adjective: 13, time: 11,
    connector: 11, imagery: 11, emotion: 6, english: 9
  };

  // 兼顾平衡的分类抽取：避免一次全是名词
  function drawWords(count) {
    count = count || (14 + Math.floor(Math.random() * 5)); // 14–18
    const cats = Object.keys(CATEGORY_WEIGHTS);
    const totalW = cats.reduce((s, c) => s + CATEGORY_WEIGHTS[c], 0);

    // 按权重分配数量
    const plan = {};
    let assigned = 0;
    cats.forEach((c, i) => {
      let n = i === cats.length - 1
        ? count - assigned
        : Math.round((CATEGORY_WEIGHTS[c] / totalW) * count);
      n = Math.max(1, n);
      plan[c] = n;
      assigned += n;
    });
    // 修正总数
    let diff = count - assigned;
    while (diff !== 0) {
      const c = diff > 0 ? 'noun' : 'english';
      plan[c] = Math.max(1, plan[c] + Math.sign(diff));
      diff -= Math.sign(diff);
    }

    const picked = [];
    const usedKeys = new Set();
    cats.forEach((c) => {
      const pool = WORD_LIBRARY[c].slice();
      // 洗牌
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      for (let k = 0; k < plan[c] && k < pool.length; k++) {
        const w = pool[k];
        const key = c + ':' + w;
        if (usedKeys.has(key)) continue;
        usedKeys.add(key);
        picked.push({ text: w, category: c });
      }
    });

    // 打乱最终顺序，避免同类扎堆
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    return picked;
  }

  window.WORD_LIBRARY = WORD_LIBRARY;
  window.drawWords = drawWords;
})();
