/* ============================================================
   PAPER FRAGMENTS · 碎纸诗
   原创装饰素材：SVG 贴纸 + 和纸胶带
   全部为手绘风格原创图形（线条简练、低饱和），非任何版权插画。
   ============================================================ */
(function () {
  // 调色板（与全局一致）
  const C = {
    ink: '#302B29', wine: '#854A56', rose: '#D7ADB0',
    blue: '#B7C7D4', cream: '#E9DCC9', gold: '#C9A14A'
  };

  // 每个 sticker：id / 名称 / svg（viewBox 0 0 100 100，单色线条为主）
  const STICKERS = [
    {
      id: 'star', name: '星星',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 8 L61 38 L93 40 L67 60 L76 92 L50 73 L24 92 L33 60 L7 40 L39 38 Z"
          fill="${C.gold}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>`
    },
    {
      id: 'moon', name: '月亮',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M62 12 a40 40 0 1 0 26 70 a30 30 0 1 1 -26 -70 Z"
          fill="${C.cream}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>`
    },
    {
      id: 'rose', name: '小玫瑰',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 88 C50 70 50 60 50 52" stroke="${C.ink}" stroke-width="2.5" fill="none"/>
        <path d="M50 64 C40 60 38 50 46 46 C40 54 50 58 50 58 C50 58 60 54 54 46 C62 50 60 60 50 64 Z"
          fill="${C.rose}" stroke="${C.wine}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="50" cy="40" r="12" fill="${C.wine}" stroke="${C.ink}" stroke-width="2"/>
        <path d="M50 40 m-8 0 a8 8 0 0 1 16 0" fill="${C.rose}" stroke="${C.ink}" stroke-width="1.5"/>
        <path d="M50 52 C58 56 64 54 66 46 C60 48 56 50 50 52 Z" fill="${C.rose}" stroke="${C.wine}" stroke-width="1.5"/>
      </svg>`
    },
    {
      id: 'butterfly', name: '蝴蝶',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 50 C30 20 8 26 14 46 C18 60 40 58 50 50 Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="2"/>
        <path d="M50 50 C70 20 92 26 86 46 C82 60 60 58 50 50 Z" fill="${C.rose}" stroke="${C.ink}" stroke-width="2"/>
        <path d="M50 52 C36 64 22 70 26 82 C34 86 46 72 50 60 Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="2"/>
        <path d="M50 52 C64 64 78 70 74 82 C66 86 54 72 50 60 Z" fill="${C.rose}" stroke="${C.ink}" stroke-width="2"/>
        <path d="M50 40 L50 78" stroke="${C.ink}" stroke-width="2.5"/>
        <path d="M50 44 C46 40 44 36 46 32 M50 44 C54 40 56 36 54 32" stroke="${C.ink}" stroke-width="1.5" fill="none"/>
      </svg>`
    },
    {
      id: 'heart', name: '爱心',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 82 C20 60 12 40 24 28 C34 18 48 24 50 36 C52 24 66 18 76 28 C88 40 80 60 50 82 Z"
          fill="${C.wine}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>`
    },
    {
      id: 'stamp', name: '邮戳',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="34" fill="none" stroke="${C.wine}" stroke-width="3"/>
        <circle cx="50" cy="50" r="24" fill="none" stroke="${C.wine}" stroke-width="1.5"/>
        <path d="M50 30 L50 70 M30 50 L70 50" stroke="${C.wine}" stroke-width="1.5"/>
        <text x="50" y="22" font-size="9" text-anchor="middle" fill="${C.wine}" font-family="serif">PAPER</text>
        <text x="50" y="82" font-size="9" text-anchor="middle" fill="${C.wine}" font-family="serif">FRAGMENTS</text>
      </svg>`
    },
    {
      id: 'bow', name: '蝴蝶结',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 50 C30 30 8 34 12 50 C8 66 30 70 50 50 Z" fill="${C.rose}" stroke="${C.ink}" stroke-width="2"/>
        <path d="M50 50 C70 30 92 34 88 50 C92 66 70 70 50 50 Z" fill="${C.rose}" stroke="${C.ink}" stroke-width="2"/>
        <circle cx="50" cy="50" r="7" fill="${C.wine}" stroke="${C.ink}" stroke-width="2"/>
        <path d="M46 54 L40 78 M54 54 L60 78" stroke="${C.wine}" stroke-width="2" fill="none"/>
      </svg>`
    },
    {
      id: 'tag', name: '复古标签',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 20 L70 20 L84 50 L70 80 L20 80 Z" fill="${C.cream}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="30" cy="50" r="5" fill="none" stroke="${C.ink}" stroke-width="2"/>
        <path d="M40 44 L74 44 M40 56 L68 56" stroke="${C.ink}" stroke-width="2"/>
      </svg>`
    },
    {
      id: 'clover', name: '四叶草',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 50 C36 36 24 44 30 30 C36 18 50 28 50 38 C50 28 64 18 70 30 C76 44 64 36 50 50 Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M50 50 C50 64 50 84 50 88" stroke="${C.ink}" stroke-width="2.5" fill="none"/>
      </svg>`
    },
    {
      id: 'sun', name: '太阳',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="20" fill="${C.gold}" stroke="${C.ink}" stroke-width="2.5"/>
        <g stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round">
          <path d="M50 16 L50 6 M50 94 L50 84 M16 50 L6 50 M94 50 L84 50"/>
          <path d="M26 26 L18 18 M74 26 L82 18 M26 74 L18 82 M74 74 L82 82"/>
        </g>
      </svg>`
    }
  ];

  // 和纸胶带：id / 名称 / 主色 / 条纹类型
  // pattern: 'grid' 格纹 | 'plain' 纯色 | 'stripe' 细条 | 'dot' 点纹
  const TAPES = [
    { id: 'tape-pink', name: '粉色格纹', color: 'rgba(215,173,176,0.78)', pattern: 'grid' },
    { id: 'tape-beige', name: '米色纸胶带', color: 'rgba(233,220,201,0.82)', pattern: 'plain' },
    { id: 'tape-gray', name: '透明灰白', color: 'rgba(183,199,212,0.55)', pattern: 'plain' },
    { id: 'tape-blue', name: '雾蓝细条', color: 'rgba(183,199,212,0.78)', pattern: 'stripe' }
  ];

  window.STICKERS = STICKERS;
  window.TAPES = TAPES;
})();
