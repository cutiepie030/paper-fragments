/* ============================================================
   PAPER FRAGMENTS · 碎纸诗  —  应用逻辑
   纯前端（HTML/CSS/JS），无后台、无账号、无外部 API。
   随机词库本地生成；localStorage 保存；Canvas 导出 PNG。
   统一使用 Pointer Events 支持鼠标与触摸。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 常量 ---------- */
  const CANVAS_W = 1080;
  const CANVAS_H = 1440;

  const FONTS = {
    serif:   '"Noto Serif SC", "Songti SC", "STSong", serif',
    en:      '"Playfair Display", "Cormorant Garamond", Georgia, serif',
    hand:    '"Long Cang", "Ma Shan Zheng", cursive',
    display: '"ZCOOL XiaoWei", "Noto Serif SC", serif'
  };

  const BG_LIST = [
    { id: 'old',  label: 'OLD PAPER' },
    { id: 'pink', label: 'SOFT PINK' },
    { id: 'blue', label: 'BLUE DIARY' },
    { id: 'news', label: 'NEWSPAPER' }
  ];
  const BG_COLORS = { old: '#E9DCC9', pink: '#F3E4E6', blue: '#DCE6EC', news: '#EAE3D2' };

  // 新纸条默认外观（拼贴质感：字体/底色/字色略有差异）
  const LOOKS = [
    { font: 'serif', color: '#302B29', bg: '#fbf6ec' },
    { font: 'serif', color: '#302B29', bg: '#efe6d6' },
    { font: 'en',    color: '#302B29', bg: '#ffffff' },
    { font: 'hand',  color: '#854A56', bg: '#f6ecec' },
    { font: 'serif', color: '#302B29', bg: '#e3e9ed' }
  ];

  const TEXT_COLORS = ['#302B29', '#854A56', '#D7ADB0', '#B7C7D4', '#ffffff', '#6f5b3e'];
  const BG_COLORS_PALETTE = ['#fbf6ec', '#efe6d6', '#ffffff', '#ded7c7', '#302B29', '#D7ADB0', '#B7C7D4', '#F3E4E6'];
  const EDIT_FONTS = [
    { key: 'serif',   label: '宋' },
    { key: 'en',      label: 'Aa' },
    { key: 'hand',    label: '手' },
    { key: 'display', label: '章' }
  ];

  const STYLE_PRESETS = [
    { id: 'sp1', name: '旧书', cls: '',        font: 'serif',   color: '#302B29', bg: '#fbf6ec' },
    { id: 'sp2', name: '标题', cls: 'sp-2',    font: 'en',      color: '#302B29', bg: '#ffffff' },
    { id: 'sp3', name: '报纸', cls: 'sp-3',    font: 'serif',   color: '#3a352f', bg: '#ded7c7' },
    { id: 'sp4', name: '手账', cls: 'sp-4',    font: 'hand',    color: '#854A56', bg: '#D7ADB0' },
    { id: 'sp5', name: '黑底', cls: 'sp-5',    font: 'serif',   color: '#fbf6ec', bg: '#302B29' }
  ];

  const STICKER_BASE = 96;   // 贴纸设计尺寸（px）
  const TAPE_LEN = 260;      // 胶带设计长度
  const TAPE_H = 30;         // 胶带设计高度

  const SAVE_KEY = 'paper-fragments-v1';

  /* ---------- 状态 ---------- */
  let elements = [];
  let background = 'old';
  let selectedId = null;
  let defaultLook = null;          // 预设样式作为新纸条默认
  let editingId = null;
  let undoStack = [];
  let redoStack = [];
  const nodeMap = {};
  let trayWords = [];

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const paper = $('paper');
  const paperTexture = $('paper-texture');
  const elementsLayer = $('elements-layer');
  const canvasHint = $('canvas-hint');
  const tray = $('tray');
  const editMenu = $('edit-menu');
  let zCounter = 1;

  /* ---------- 工具函数 ---------- */
  const uid = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const nextZ = () => ++zCounter;
  const getScale = () => paper.clientWidth / CANVAS_W;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const deepClone = (o) => JSON.parse(JSON.stringify(o));
  const getSelected = () => elements.find((e) => e.id === selectedId) || null;

  function snapshotState() {
    return { elements: deepClone(elements), background };
  }
  function recordUndo(s) {
    undoStack.push(s);
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    updateUndoButtons();
  }
  function pushUndo() { recordUndo(snapshotState()); }
  function updateUndoButtons() {
    $('btn-undo').disabled = undoStack.length === 0;
    $('btn-redo').disabled = redoStack.length === 0;
  }
  function applyState(s) {
    elements = deepClone(s.elements);
    background = s.background;
    selectedId = null;
    renderAll();
    applyBackground();
    hideEditMenu();
    updateCanvasHint();
    updateUndoButtons();
  }

  /* ---------- 保存 / 恢复 ---------- */
  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ elements, background, v: 1 })); } catch (e) {}
    }, 350);
  }
  function loadSavedData() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.elements)) return null;
      return data;
    } catch (e) { return null; }
  }
  function restoreFrom(data) {
    elements = deepClone(data.elements);
    background = data.background || 'old';
    selectedId = null;
    renderAll();
    applyBackground();
    updateCanvasHint();
    updateUndoButtons();
    redrawTray(); // 恢复创作时同样需要填充素材区
  }

  /* ---------- 渲染：单个元素 ---------- */
  function renderNode(el) {
    let node;
    if (el.type === 'frag') {
      node = document.createElement('div');
      node.className = 'frag';
      node.textContent = el.content;
    } else if (el.type === 'sticker') {
      node = document.createElement('div');
      node.className = 'sticker';
      const def = window.STICKERS.find((s) => s.id === el.content);
      node.innerHTML = def ? def.svg : '';
    } else if (el.type === 'tape') {
      node = document.createElement('div');
      node.className = 'tape';
      const def = window.TAPES.find((t) => t.id === el.content);
      const color = def ? def.color : 'rgba(233,220,201,0.8)';
      const pattern = def ? def.pattern : 'plain';
      node.style.background = color;
      applyTapePattern(node, pattern);
    }
    node.dataset.id = el.id;
    nodeMap[el.id] = node;
    elementsLayer.appendChild(node);
    updateNode(el);
    attachElementDrag(node, el);
    if (el.type === 'frag') {
      node.addEventListener('dblclick', (e) => { e.preventDefault(); startEdit(el); });
    }
    return node;
  }

  function applyTapePattern(node, pattern) {
    if (pattern === 'grid') {
      node.style.backgroundImage =
        'repeating-linear-gradient(0deg, rgba(48,43,41,0.10) 0 1px, transparent 1px 9px),' +
        'repeating-linear-gradient(90deg, rgba(48,43,41,0.10) 0 1px, transparent 1px 9px)';
    } else if (pattern === 'stripe') {
      node.style.backgroundImage =
        'repeating-linear-gradient(90deg, rgba(48,43,41,0.10) 0 2px, transparent 2px 12px)';
    } else {
      node.style.backgroundImage = 'none';
    }
  }

  function updateNode(el) {
    const node = nodeMap[el.id];
    if (!node) return;
    const scale = getScale();
    node.style.left = (el.x * scale) + 'px';
    node.style.top = (el.y * scale) + 'px';
    node.style.transform = 'rotate(' + el.rotation + 'deg)';
    if (el.type === 'frag') {
      node.style.fontFamily = FONTS[el.font] || FONTS.serif;
      node.style.fontSize = (el.fontSize * scale) + 'px';
      node.style.color = el.color;
      node.style.background = el.background;
      node.textContent = el.content;
    } else if (el.type === 'sticker') {
      const size = STICKER_BASE * el.scale * scale;
      node.style.width = size + 'px';
      node.style.height = size + 'px';
    } else if (el.type === 'tape') {
      node.style.width = (TAPE_LEN * el.scale * scale) + 'px';
      node.style.height = (TAPE_H * scale) + 'px';
    }
    node.classList.toggle('selected', el.id === selectedId);
  }

  function renderAll() {
    elementsLayer.innerHTML = '';
    for (const k in nodeMap) delete nodeMap[k];
    const sorted = elements.slice().sort((a, b) => a.zIndex - b.zIndex);
    sorted.forEach(renderNode);
  }

  function centerOn(el, cx, cy) {
    const node = nodeMap[el.id];
    if (!node) return;
    const scale = getScale();
    const w = node.getBoundingClientRect().width / scale;
    const h = node.getBoundingClientRect().height / scale;
    el.x = cx - w / 2;
    el.y = cy - h / 2;
    updateNode(el);
  }

  function updateCanvasHint() {
    const hasContent = elements.some((e) => e.type === 'frag' || e.type === 'sticker' || e.type === 'tape');
    canvasHint.style.opacity = hasContent ? '0' : '1';
  }

  /* ---------- 添加元素 ---------- */
  function addFrag(text, cx, cy, opts) {
    opts = opts || {};
    if (opts.record !== false) pushUndo();
    const look = defaultLook || pick(LOOKS);
    const el = {
      id: uid(), type: 'frag', content: text,
      font: look.font, fontSize: 26 + Math.random() * 12,
      color: look.color, background: look.bg,
      rotation: Math.random() * 10 - 5,
      x: cx, y: cy, zIndex: nextZ()
    };
    elements.push(el);
    renderNode(el);
    if (cx != null) centerOn(el, cx, cy);
    updateCanvasHint();
    scheduleSave();
    return el;
  }

  function addSticker(def) {
    pushUndo();
    const el = {
      id: uid(), type: 'sticker', content: def.id,
      rotation: Math.random() * 16 - 8, scale: 1,
      x: CANVAS_W / 2, y: CANVAS_H / 2, zIndex: nextZ()
    };
    elements.push(el);
    renderNode(el);
    centerOn(el, CANVAS_W / 2, CANVAS_H / 2);
    updateCanvasHint();
    scheduleSave();
  }

  function addTape(def) {
    pushUndo();
    const el = {
      id: uid(), type: 'tape', content: def.id,
      tapeColor: def.color, tapePattern: def.pattern,
      rotation: Math.random() * 20 - 10, scale: 1,
      x: CANVAS_W / 2 - TAPE_LEN / 2, y: CANVAS_H / 2, zIndex: nextZ()
    };
    elements.push(el);
    renderNode(el);
    updateCanvasHint();
    scheduleSave();
  }

  /* ---------- 拖拽：素材区 → 画布 ---------- */
  function makeTrayClone(text) {
    const c = document.createElement('div');
    c.className = 'frag';
    c.style.position = 'fixed';
    c.style.pointerEvents = 'none';
    c.style.zIndex = '30000';
    c.style.opacity = '0.92';
    c.style.transform = 'rotate(' + (Math.random() * 8 - 4) + 'deg)';
    c.style.fontFamily = FONTS.serif;
    c.style.fontSize = '20px';
    c.style.boxShadow = '4px 10px 18px rgba(48,43,41,0.30)';
    c.textContent = text;
    return c;
  }

  function onTrayPointerDown(e, wordEl, wordData) {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    let moved = false, clone = null;
    function move(ev) {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 6) {
        moved = true;
        clone = makeTrayClone(wordData.text);
        document.body.appendChild(clone);
      }
      if (clone) {
        clone.style.left = (ev.clientX - 24) + 'px';
        clone.style.top = (ev.clientY - 18) + 'px';
      }
    }
    function up(ev) {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      if (clone) clone.remove();
      const pr = paper.getBoundingClientRect();
      const inside = ev.clientX >= pr.left && ev.clientX <= pr.right && ev.clientY >= pr.top && ev.clientY <= pr.bottom;
      if (moved) {
        if (inside) {
          const scale = pr.width / CANVAS_W;
          const dx = (ev.clientX - pr.left) / scale;
          const dy = (ev.clientY - pr.top) / scale;
          addFrag(wordData.text, dx, dy);
          wordEl.remove();
        }
      } else {
        // 轻点：添加到画布中心附近
        addFrag(wordData.text, CANVAS_W / 2 + (Math.random() * 140 - 70), CANVAS_H / 2 + (Math.random() * 180 - 90));
        wordEl.remove();
      }
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }

  /* ---------- 拖拽：画布内元素 ---------- */
  function attachElementDrag(node, el) {
    node.addEventListener('pointerdown', (e) => onElementPointerDown(e, node, el));
  }

  function onElementPointerDown(e, node, el) {
    if (editingId === el.id) return; // 编辑文字时不触发拖拽
    e.preventDefault();
    e.stopPropagation();
    selectEl(el);
    const pr = paper.getBoundingClientRect();
    const scale = pr.width / CANVAS_W;
    const startPX = e.clientX, startPY = e.clientY;
    const startX = el.x, startY = el.y;
    let pendingUndo = false, moved = false;
    try { node.setPointerCapture(e.pointerId); } catch (err) {}
    node.classList.add('dragging');
    function move(ev) {
      const dpx = ev.clientX - startPX, dpy = ev.clientY - startPY;
      if (!moved && Math.hypot(dpx, dpy) > 4) {
        moved = true;
        if (!pendingUndo) { pushUndo(); pendingUndo = true; }
      }
      if (moved) {
        el.x = startX + dpx / scale;
        el.y = startY + dpy / scale;
        node.style.left = (el.x * scale) + 'px';
        node.style.top = (el.y * scale) + 'px';
        positionEditMenu();
      }
    }
    function up(ev) {
      try { node.releasePointerCapture(e.pointerId); } catch (err) {}
      node.classList.remove('dragging');
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      if (moved) scheduleSave();
    }
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
  }

  /* ---------- 选中 / 编辑菜单 ---------- */
  function selectEl(el) {
    selectedId = el.id;
    for (const k in nodeMap) nodeMap[k].classList.toggle('selected', k === el.id);
    positionEditMenu();
    $('btn-delete').disabled = false;
  }
  function deselect() {
    selectedId = null;
    for (const k in nodeMap) nodeMap[k].classList.remove('selected');
    hideEditMenu();
    $('btn-delete').disabled = true;
  }
  function hideEditMenu() { editMenu.hidden = true; }

  function positionEditMenu() {
    const sel = getSelected();
    if (!sel) { hideEditMenu(); return; }
    const node = nodeMap[sel.id];
    if (!node) { hideEditMenu(); return; }
    const r = node.getBoundingClientRect();
    editMenu.hidden = false;
    const mw = editMenu.offsetWidth, mh = editMenu.offsetHeight;
    let left = r.left + r.width / 2 - mw / 2;
    let top = r.top - mh - 10;
    if (top < 8) top = r.bottom + 10;
    left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - mh - 8));
    editMenu.style.left = left + 'px';
    editMenu.style.top = top + 'px';
    // 高亮当前字色/底色/字体
    highlightSwatch('em-colors', sel.color);
    highlightSwatch('em-bgcolors', sel.background);
    highlightFont(sel.font);
  }
  function highlightSwatch(containerId, value) {
    const c = $(containerId);
    Array.from(c.children).forEach((ch) => {
      ch.classList.toggle('active', ch.dataset.value === value);
    });
  }
  function highlightFont(fontKey) {
    Array.from($('em-fonts').children).forEach((ch) => {
      ch.classList.toggle('active', ch.dataset.value === fontKey);
    });
  }

  /* ---------- 行内编辑文字 ---------- */
  function startEdit(el) {
    const node = nodeMap[el.id];
    if (!node) return;
    editingId = el.id;
    const pr = paper.getBoundingClientRect();
    const scale = pr.width / CANVAS_W;
    const before = node.getBoundingClientRect();
    const cx = (before.left - pr.left + before.width / 2) / scale;
    const cy = (before.top - pr.top + before.height / 2) / scale;
    const snap = snapshotState();
    node.contentEditable = 'true';
    node.style.cursor = 'text';
    node.focus();
    try { document.getSelection().selectAllChildren(node); } catch (e) {}
    function finish() {
      node.removeEventListener('blur', finish);
      node.removeEventListener('keydown', key);
      node.contentEditable = 'false';
      node.style.cursor = 'grab';
      editingId = null;
      const txt = node.textContent.replace(/\n/g, '').trim();
      if (txt && txt !== el.content) {
        recordUndo(snap);
        el.content = txt;
      }
      node.textContent = el.content;
      updateNode(el);
      centerOn(el, cx, cy);
      positionEditMenu();
      scheduleSave();
    }
    function key(e) {
      if (e.key === 'Enter') { e.preventDefault(); node.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); node.textContent = el.content; node.blur(); }
    }
    node.addEventListener('blur', finish);
    node.addEventListener('keydown', key);
  }

  /* ---------- 删除 ---------- */
  function deleteSelected() {
    const sel = getSelected();
    if (!sel) return;
    pushUndo();
    elements = elements.filter((e) => e.id !== sel.id);
    const node = nodeMap[sel.id];
    if (node) node.remove();
    delete nodeMap[sel.id];
    deselect();
    updateCanvasHint();
    scheduleSave();
  }

  /* ---------- 背景 ---------- */
  function applyBackground() {
    paper.className = 'paper bg-' + background;
  }
  function setBackground(id) {
    pushUndo();
    background = id;
    applyBackground();
    scheduleSave();
  }

  /* ---------- 素材区 ---------- */
  function renderTray(words) {
    trayWords = words;
    tray.innerHTML = '';
    words.forEach((w, i) => {
      const el = document.createElement('div');
      el.className = 'tray-word';
      el.textContent = w.text;
      el.style.opacity = '0';
      el.addEventListener('pointerdown', (e) => onTrayPointerDown(e, el, w));
      tray.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.35s ease, transform 0.12s ease';
        setTimeout(() => { el.style.opacity = '1'; }, i * 18);
      });
    });
  }
  function redrawTray() {
    renderTray(window.drawWords());
  }

  /* ---------- 工具栏构建 ---------- */
  function buildToolbar() {
    // 背景色板
    const bgWrap = $('bg-swatches');
    BG_LIST.forEach((b) => {
      const s = document.createElement('div');
      s.className = 'bg-swatch s-' + b.id;
      s.textContent = b.label;
      s.dataset.bg = b.id;
      s.addEventListener('click', () => {
        setBackground(b.id);
        Array.from(bgWrap.children).forEach((c) => c.classList.toggle('active', c.dataset.bg === b.id));
      });
      bgWrap.appendChild(s);
    });
    Array.from(bgWrap.children).forEach((c) => c.classList.toggle('active', c.dataset.bg === background));

    // 样式预设
    const spWrap = $('style-presets');
    STYLE_PRESETS.forEach((p) => {
      const s = document.createElement('div');
      s.className = 'style-preset ' + p.cls;
      s.textContent = p.name;
      s.title = p.name;
      s.addEventListener('click', () => applyPreset(p));
      spWrap.appendChild(s);
    });

    // 贴纸
    const sg = $('sticker-grid');
    window.STICKERS.forEach((def) => {
      const cell = document.createElement('div');
      cell.className = 'sticker-cell';
      cell.title = def.name;
      cell.innerHTML = def.svg;
      cell.addEventListener('click', () => addSticker(def));
      sg.appendChild(cell);
    });

    // 胶带
    const tg = $('tape-grid');
    window.TAPES.forEach((def) => {
      const cell = document.createElement('div');
      cell.className = 'tape-cell';
      cell.title = def.name;
      cell.style.background = def.color;
      applyTapePattern(cell, def.pattern);
      cell.addEventListener('click', () => addTape(def));
      tg.appendChild(cell);
    });

    // 编辑菜单色板
    const ec = $('em-colors');
    TEXT_COLORS.forEach((c) => {
      const d = document.createElement('div');
      d.className = 'em-color';
      d.style.background = c;
      d.dataset.value = c;
      d.addEventListener('click', () => applyFragColor(c));
      ec.appendChild(d);
    });
    const ebc = $('em-bgcolors');
    BG_COLORS_PALETTE.forEach((c) => {
      const d = document.createElement('div');
      d.className = 'em-color';
      d.style.background = c;
      d.dataset.value = c;
      d.addEventListener('click', () => applyFragBg(c));
      ebc.appendChild(d);
    });
    const ef = $('em-fonts');
    EDIT_FONTS.forEach((f) => {
      const d = document.createElement('div');
      d.className = 'em-font f-' + f.key;
      d.textContent = f.label;
      d.dataset.value = f.key;
      d.addEventListener('click', () => applyFragFont(f.key));
      ef.appendChild(d);
    });
  }

  function applyPreset(p) {
    const sel = getSelected();
    if (sel && sel.type === 'frag') {
      pushUndo();
      sel.font = p.font; sel.color = p.color; sel.background = p.bg;
      updateNode(sel);
      positionEditMenu();
      scheduleSave();
    } else {
      defaultLook = { font: p.font, color: p.color, bg: p.bg };
      flashNotice('已设为新纸条默认样式');
    }
  }
  function applyFragColor(c) {
    const sel = getSelected();
    if (!sel || sel.type !== 'frag') return;
    pushUndo(); sel.color = c; updateNode(sel); positionEditMenu(); scheduleSave();
  }
  function applyFragBg(c) {
    const sel = getSelected();
    if (!sel || sel.type !== 'frag') return;
    pushUndo(); sel.background = c; updateNode(sel); positionEditMenu(); scheduleSave();
  }
  function applyFragFont(f) {
    const sel = getSelected();
    if (!sel || sel.type !== 'frag') return;
    pushUndo(); sel.font = f; updateNode(sel); positionEditMenu(); scheduleSave();
  }

  /* ---------- 撤销 / 恢复 ---------- */
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapshotState());
    applyState(undoStack.pop());
    scheduleSave();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapshotState());
    applyState(redoStack.pop());
    scheduleSave();
  }

  /* ---------- 提示 ---------- */
  let noticeTimer = null;
  function flashNotice(msg) {
    const h = $('foot-hint');
    h.textContent = msg;
    h.style.color = 'var(--wine)';
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      h.textContent = '无需教程 — 拖、贴、拼，剩下的交给偶然。';
      h.style.color = '';
    }, 1800);
  }

  /* ---------- 清空 / 重置 ---------- */
  function clearAll(keepUndo) {
    elements = [];
    selectedId = null;
    renderAll();
    applyBackground();
    hideEditMenu();
    updateCanvasHint();
  }
  function resetAll() {
    if (!confirm('确定清空画布并重新开始？此操作可以撤销。')) return;
    pushUndo();
    clearAll();
    redrawTray();
    scheduleSave();
  }

  /* ---------- PNG 导出 ---------- */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function svgToImage(svg, w, h) {
    return new Promise((resolve, reject) => {
      const s = svg.replace('<svg ', '<svg width="' + w + '" height="' + h + '" ');
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  async function exportCanvas() {
    // 确保字体已加载
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    const scale = getScale();

    // 背景
    ctx.fillStyle = BG_COLORS[background] || '#E9DCC9';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 纸张纹理（轻噪点 + 暗角）
    ctx.save();
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * CANVAS_W, y = Math.random() * CANVAS_H;
      ctx.fillStyle = 'rgba(48,43,41,' + (Math.random() * 0.035) + ')';
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.restore();
    if (background === 'news') {
      ctx.strokeStyle = 'rgba(48,43,41,0.05)';
      ctx.lineWidth = 1;
      for (let y = 40; y < CANVAS_H; y += 38) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
      }
    }
    const vign = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.3, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.75);
    vign.addColorStop(0, 'rgba(0,0,0,0)');
    vign.addColorStop(1, 'rgba(48,43,41,0.10)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 预加载贴纸图片
    const stickerEls = elements.filter((e) => e.type === 'sticker');
    const imgMap = {};
    await Promise.all(stickerEls.map(async (el) => {
      const def = window.STICKERS.find((s) => s.id === el.content);
      if (!def) return;
      const node = nodeMap[el.id];
      const r = node.getBoundingClientRect();
      const w = r.width / scale, h = r.height / scale;
      try { imgMap[el.id] = await svgToImage(def.svg, Math.round(w), Math.round(h)); } catch (e) {}
    }));

    // 绘制元素（按 zIndex）
    const sorted = elements.slice().sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      const node = nodeMap[el.id];
      if (!node) continue;
      const r = node.getBoundingClientRect();
      const dispX = r.left - paper.getBoundingClientRect().left;
      const dispY = r.top - paper.getBoundingClientRect().top;
      const w = r.width / scale, h = r.height / scale;
      const cx = dispX / scale + w / 2;
      const cy = dispY / scale + h / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((el.rotation * Math.PI) / 180);

      if (el.type === 'frag') {
        ctx.shadowColor = 'rgba(48,43,41,0.22)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1.5;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = el.background;
        roundRect(ctx, -w / 2, -h / 2, w, h, 3);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        const fs = (el.fontSize);
        ctx.fillStyle = el.color;
        ctx.font = fs + 'px ' + (FONTS[el.font] || FONTS.serif);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, 0, 0);
      } else if (el.type === 'sticker') {
        const img = imgMap[el.id];
        if (img) ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else if (el.type === 'tape') {
        ctx.globalAlpha = 1;
        ctx.fillStyle = el.tapeColor || 'rgba(233,220,201,0.8)';
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = 'rgba(48,43,41,0.12)';
        ctx.lineWidth = 1;
        if (el.tapePattern === 'grid') {
          for (let gx = -w / 2; gx < w / 2; gx += 12) { ctx.beginPath(); ctx.moveTo(gx, -h / 2); ctx.lineTo(gx, h / 2); ctx.stroke(); }
          for (let gy = -h / 2; gy < h / 2; gy += 12) { ctx.beginPath(); ctx.moveTo(-w / 2, gy); ctx.lineTo(w / 2, gy); ctx.stroke(); }
        } else if (el.tapePattern === 'stripe') {
          for (let gx = -w / 2; gx < w / 2; gx += 14) { ctx.beginPath(); ctx.moveTo(gx, -h / 2); ctx.lineTo(gx, h / 2); ctx.stroke(); }
        }
      }
      ctx.restore();
    }

    // 品牌署名（底部极小）
    ctx.fillStyle = 'rgba(48,43,41,0.45)';
    ctx.font = '20px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('PAPER FRAGMENTS', CANVAS_W / 2, CANVAS_H - 42);
    ctx.font = '15px "Noto Serif SC", serif';
    ctx.fillText('made of little words.', CANVAS_W / 2, CANVAS_H - 20);

    return canvas.toDataURL('image/png');
  }

  async function openExport() {
    deselect();
    flashNotice('正在生成你的诗…');
    try {
      const url = await exportCanvas();
      $('modal-img').src = url;
      $('modal').dataset.url = url;
      $('modal').hidden = false;
    } catch (e) {
      alert('导出失败：' + e.message);
    }
  }
  function downloadImage() {
    const url = $('modal').dataset.url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paper-fragments.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    $('btn-undo').addEventListener('click', undo);
    $('btn-redo').addEventListener('click', redo);
    $('btn-delete').addEventListener('click', deleteSelected);
    $('btn-redraw').addEventListener('click', redrawTray);
    $('btn-redraw2').addEventListener('click', redrawTray);
    $('btn-reset-top').addEventListener('click', resetAll);
    $('btn-save').addEventListener('click', () => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ elements, background, v: 1 })); } catch (e) {}
      flashNotice('已保存到本地 ✓');
    });
    $('btn-export').addEventListener('click', openExport);

    // 弹窗
    $('btn-download').addEventListener('click', downloadImage);
    $('btn-continue').addEventListener('click', () => { $('modal').hidden = true; });
    $('btn-restart').addEventListener('click', () => {
      $('modal').hidden = true;
      resetAll();
    });

    // 编辑菜单按钮
    $('em-smaller').addEventListener('click', () => resizeSelected(0.88));
    $('em-bigger').addEventListener('click', () => resizeSelected(1.14));
    $('em-rotL').addEventListener('click', () => rotateSelected(-12));
    $('em-rotR').addEventListener('click', () => rotateSelected(12));
    $('em-edit').addEventListener('click', () => { const s = getSelected(); if (s) startEdit(s); });
    $('em-delete').addEventListener('click', deleteSelected);

    // 点击空白画布取消选中
    paper.addEventListener('pointerdown', (e) => {
      if (e.target === paper || e.target === paperTexture || e.target === elementsLayer || e.target === canvasHint) {
        deselect();
      }
    });

    window.addEventListener('resize', () => {
      renderAll();
      if (selectedId) positionEditMenu();
    });
    window.addEventListener('scroll', () => { if (selectedId) positionEditMenu(); }, true);
  }

  function resizeSelected(factor) {
    const sel = getSelected();
    if (!sel || sel.type !== 'frag') return;
    pushUndo();
    sel.fontSize = Math.max(14, Math.min(80, sel.fontSize * factor));
    updateNode(sel);
    positionEditMenu();
    scheduleSave();
  }
  function rotateSelected(deg) {
    const sel = getSelected();
    if (!sel) return;
    pushUndo();
    sel.rotation += deg;
    updateNode(sel);
    positionEditMenu();
    scheduleSave();
  }

  /* ---------- 恢复弹窗 ---------- */
  function bindRestore(data) {
    $('restore-modal').hidden = false;
    $('btn-restore-yes').addEventListener('click', () => {
      $('restore-modal').hidden = true;
      restoreFrom(data);
    });
    $('btn-restore-no').addEventListener('click', () => {
      $('restore-modal').hidden = true;
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      initFresh();
    });
  }

  function initFresh() {
    background = 'old';
    applyBackground();
    renderAll();
    updateCanvasHint();
    redrawTray();
    updateUndoButtons();
  }

  /* ---------- 启动 ---------- */
  function init() {
    buildToolbar();
    bindEvents();
    const saved = loadSavedData();
    if (saved) {
      bindRestore(saved);
    } else {
      initFresh();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
