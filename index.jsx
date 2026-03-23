import { useState, useEffect, useRef, useCallback } from "react";

const TILE = 32;
const COLS = 80;
const ROWS = 60;
const GRAVITY = 0.4;
const JUMP_FORCE = -9;
const SPEED = 3.5;
const VIEW_W = 22;
const VIEW_H = 18;

const BLOCKS = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4,
  WOOD: 5, LEAVES: 6, WATER: 7, COAL: 8, IRON: 9,
  BEDROCK: 10, PLANKS: 11, GLASS: 12, TORCH: 13,
  PINK_GRASS: 14, PINK_STONE: 15, CANDY: 16, CLOUD_BLOCK: 17, MARSHMALLOW: 18
};

const BLOCK_DATA = {
  [BLOCKS.GRASS]:       { label:"Rohumaa",     top:"#4a7c3f", side:"#6b4c2a", solid:true },
  [BLOCKS.DIRT]:        { label:"Muld",         top:"#6b4c2a", solid:true },
  [BLOCKS.STONE]:       { label:"Kivi",          top:"#7a7a7a", solid:true },
  [BLOCKS.SAND]:        { label:"Liiv",          top:"#d4c07a", solid:true },
  [BLOCKS.WOOD]:        { label:"Puu",           top:"#a0785a", solid:true },
  [BLOCKS.LEAVES]:      { label:"Lehed",         top:"#2d6b1a", solid:true, opacity:0.85 },
  [BLOCKS.WATER]:       { label:"Vesi",          top:"#3a7bd5", solid:false, opacity:0.6 },
  [BLOCKS.COAL]:        { label:"Süsi",          top:"#3a3a3a", solid:true },
  [BLOCKS.IRON]:        { label:"Raud",          top:"#c0a882", solid:true },
  [BLOCKS.BEDROCK]:     { label:"Põhjakivi",     top:"#1a1a1a", solid:true },
  [BLOCKS.PLANKS]:      { label:"Lauad",         top:"#c8a05a", solid:true },
  [BLOCKS.GLASS]:       { label:"Klaas",         top:"#aaddff", solid:true, opacity:0.4 },
  [BLOCKS.TORCH]:       { label:"Tõrvik",        top:"#ffaa00", solid:false, isLight:true },
  [BLOCKS.PINK_GRASS]:  { label:"Roosamuru",     top:"#f48fbf", solid:true },
  [BLOCKS.PINK_STONE]:  { label:"Roosakivi",     top:"#e8b4cc", solid:true },
  [BLOCKS.CANDY]:       { label:"Kommikivi",     top:"#ff69b4", solid:true },
  [BLOCKS.CLOUD_BLOCK]: { label:"Pilveplomp",    top:"#ffe6f0", solid:true, opacity:0.9 },
  [BLOCKS.MARSHMALLOW]: { label:"Vahtkomm",      top:"#ffc8e0", solid:true },
};

const HOTBAR_WILKU  = [BLOCKS.GRASS, BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.SAND, BLOCKS.WOOD, BLOCKS.PLANKS, BLOCKS.GLASS, BLOCKS.TORCH, BLOCKS.LEAVES];
const HOTBAR_GRITS  = [BLOCKS.PINK_GRASS, BLOCKS.MARSHMALLOW, BLOCKS.PINK_STONE, BLOCKS.CLOUD_BLOCK, BLOCKS.CANDY, BLOCKS.GLASS, BLOCKS.TORCH, BLOCKS.PLANKS, BLOCKS.LEAVES];

// ── World generators ─────────────────────────────────────────────────────────
function generateWilkuWorld() {
  const world = Array.from({ length: ROWS }, () => new Array(COLS).fill(BLOCKS.AIR));
  const SEA = Math.floor(ROWS * 0.45);
  const heights = [];
  let h = SEA;
  for (let x = 0; x < COLS; x++) {
    h += (Math.random() - 0.5) * 2;
    h = Math.max(SEA - 10, Math.min(SEA + 5, h));
    heights.push(Math.round(h));
  }
  for (let x = 0; x < COLS; x++) {
    const sy = heights[x];
    for (let y = 0; y < ROWS; y++) {
      if (y === ROWS - 1)        world[y][x] = BLOCKS.BEDROCK;
      else if (y > sy + 4)       world[y][x] = BLOCKS.STONE;
      else if (y > sy)           world[y][x] = BLOCKS.DIRT;
      else if (y === sy)         world[y][x] = BLOCKS.GRASS;
    }
    for (let y = sy + 5; y < ROWS - 1; y++) {
      if (Math.random() < 0.06) world[y][x] = BLOCKS.COAL;
      if (Math.random() < 0.03) world[y][x] = BLOCKS.IRON;
    }
    if (sy >= SEA - 1) {
      for (let y = sy; y <= Math.min(SEA, ROWS - 2); y++) world[y][x] = BLOCKS.SAND;
    }
    for (let y = sy + 1; y <= SEA; y++) {
      if (world[y][x] === BLOCKS.AIR) world[y][x] = BLOCKS.WATER;
    }
    if (sy < SEA - 1 && Math.random() < 0.10 && x > 2 && x < COLS - 2) {
      const th = 4 + Math.floor(Math.random() * 3);
      for (let ty = 0; ty < th; ty++) {
        if (sy - ty >= 0) world[sy - ty][x] = BLOCKS.WOOD;
      }
      const topY = sy - th;
      for (let ly = topY - 2; ly <= topY; ly++)
        for (let lx = x - 2; lx <= x + 2; lx++)
          if (lx >= 0 && lx < COLS && ly >= 0 && ly < ROWS && world[ly][lx] === BLOCKS.AIR)
            world[ly][lx] = BLOCKS.LEAVES;
    }
  }
  return world;
}

function generateGritsWorld() {
  const world = Array.from({ length: ROWS }, () => new Array(COLS).fill(BLOCKS.AIR));
  const SEA = Math.floor(ROWS * 0.5);
  const heights = [];
  let h = SEA;
  for (let x = 0; x < COLS; x++) {
    h += (Math.random() - 0.5) * 1.5;
    h = Math.max(SEA - 8, Math.min(SEA + 4, h));
    heights.push(Math.round(h));
  }
  for (let x = 0; x < COLS; x++) {
    const sy = heights[x];
    for (let y = 0; y < ROWS; y++) {
      if (y === ROWS - 1)        world[y][x] = BLOCKS.CANDY;
      else if (y > sy + 4)       world[y][x] = BLOCKS.PINK_STONE;
      else if (y > sy)           world[y][x] = BLOCKS.MARSHMALLOW;
      else if (y === sy)         world[y][x] = BLOCKS.PINK_GRASS;
    }
    // Candy ore
    for (let y = sy + 3; y < ROWS - 1; y++) {
      if (Math.random() < 0.05) world[y][x] = BLOCKS.CANDY;
    }
    // Candy-floss trees
    if (Math.random() < 0.08 && x > 2 && x < COLS - 2) {
      const th = 3 + Math.floor(Math.random() * 3);
      for (let ty = 0; ty < th; ty++) {
        if (sy - ty >= 0) world[sy - ty][x] = BLOCKS.WOOD;
      }
      const topY = sy - th;
      for (let ly = topY - 2; ly <= topY + 1; ly++)
        for (let lx = x - 2; lx <= x + 2; lx++)
          if (lx >= 0 && lx < COLS && ly >= 0 && ly < ROWS && world[ly][lx] === BLOCKS.AIR)
            world[ly][lx] = BLOCKS.CLOUD_BLOCK;
    }
    // Floating candy clouds
    if (Math.random() < 0.04 && x < COLS - 4) {
      const cloudY = Math.max(2, sy - 8 - Math.floor(Math.random() * 5));
      for (let cx = x; cx < x + 4 && cx < COLS; cx++)
        world[cloudY][cx] = BLOCKS.MARSHMALLOW;
    }
  }
  return world;
}

function findSpawnY(world, spawnX = 5) {
  for (let y = 0; y < ROWS; y++) {
    if (BLOCK_DATA[world[y][spawnX]]?.solid) return y - 2;
  }
  return 5;
}

// ── Draw helpers ─────────────────────────────────────────────────────────────
function drawBlockOnCtx(ctx, btype, px, py, size, breakProg = 0) {
  if (btype === BLOCKS.AIR) return;
  const bd = BLOCK_DATA[btype];
  if (!bd) return;
  ctx.save();
  ctx.globalAlpha = bd.opacity ?? 1;
  ctx.fillStyle = bd.top;
  ctx.fillRect(px, py, size, size);
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

  // Textures
  if (btype === BLOCKS.GRASS) {
    ctx.fillStyle = "#5a8c3a"; ctx.fillRect(px, py, size, size * 0.25);
    ctx.fillStyle = "#6b4c2a"; ctx.fillRect(px, py + size * 0.25, size, size * 0.75);
  }
  if (btype === BLOCKS.PINK_GRASS) {
    ctx.fillStyle = "#f06090"; ctx.fillRect(px, py, size, size * 0.25);
    ctx.fillStyle = "#e8b4cc"; ctx.fillRect(px, py + size * 0.25, size, size * 0.75);
  }
  if (btype === BLOCKS.MARSHMALLOW) {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    for (let i = 0; i < 3; i++) ctx.fillRect(px + (i*10) % size, py + (i*7) % size, 8, 4);
  }
  if (btype === BLOCKS.CLOUD_BLOCK) {
    ctx.fillStyle = "rgba(255,150,200,0.25)";
    ctx.fillRect(px + 3, py + 3, size - 6, size - 6);
  }
  if (btype === BLOCKS.CANDY) {
    ctx.fillStyle = "#ff1493";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(px + (i * 10) % size, py + (i * 8) % size, 5, 5);
    }
  }
  if (btype === BLOCKS.STONE || btype === BLOCKS.PINK_STONE) {
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    for (let i = 0; i < 3; i++) ctx.fillRect(px + (i*10) % size, py + (i*7) % size, 5, 3);
  }
  if (btype === BLOCKS.COAL) {
    ctx.fillStyle = "#111";
    ctx.fillRect(px + size*0.2, py + size*0.2, size*0.25, size*0.25);
    ctx.fillRect(px + size*0.55, py + size*0.5, size*0.2, size*0.2);
  }
  if (btype === BLOCKS.IRON) {
    ctx.fillStyle = "#d4c0a0";
    ctx.fillRect(px + size*0.2, py + size*0.2, size*0.2, size*0.2);
    ctx.fillRect(px + size*0.6, py + size*0.55, size*0.18, size*0.18);
  }
  if (btype === BLOCKS.WOOD) {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(px, py + size*0.15, size, size*0.1);
    ctx.fillRect(px, py + size*0.45, size, size*0.1);
    ctx.fillRect(px, py + size*0.75, size, size*0.1);
  }
  if (btype === BLOCKS.PLANKS) {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(px, py + size*0.5, size, 2);
    ctx.fillRect(px + size*0.5, py, 2, size*0.5);
  }
  if (btype === BLOCKS.LEAVES) {
    ctx.fillStyle = "rgba(60,180,40,0.3)";
    for (let i = 0; i < 4; i++) ctx.fillRect(px + (i*8+2)%size, py + (i*6)%size, 6, 4);
  }
  if (btype === BLOCKS.WATER) {
    ctx.fillStyle = "rgba(100,200,255,0.3)";
    ctx.fillRect(px, py + size * 0.6, size, size * 0.4);
  }
  if (btype === BLOCKS.TORCH) {
    ctx.clearRect(px, py, size, size);
    const grad = ctx.createRadialGradient(px+size/2, py+size/2, 0, px+size/2, py+size/2, size*1.5);
    grad.addColorStop(0, "rgba(255,200,50,0.4)");
    grad.addColorStop(1, "rgba(255,200,50,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(px - size, py - size, size*3, size*3);
    ctx.fillStyle = "#8B4513"; ctx.fillRect(px + size*0.4, py + size*0.3, size*0.2, size*0.65);
    ctx.fillStyle = "#ffaa00"; ctx.fillRect(px + size*0.35, py + size*0.1, size*0.3, size*0.25);
    ctx.fillStyle = "#ff6600"; ctx.fillRect(px + size*0.42, py + size*0.05, size*0.16, size*0.12);
    ctx.restore();
    return;
  }
  if (breakProg > 0) {
    ctx.fillStyle = `rgba(0,0,0,${breakProg * 0.7})`;
    ctx.fillRect(px, py, size, size);
    ctx.strokeStyle = `rgba(0,0,0,${breakProg})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < Math.floor(breakProg * 6); i++) {
      ctx.beginPath();
      ctx.moveTo(px + size*0.3 + i*3, py + size*0.2);
      ctx.lineTo(px + size*0.5 + i*2, py + size*0.8);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Player drawers ────────────────────────────────────────────────────────────
function drawWilkuPlayer(ctx, px, py) {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(px + 2, py + TILE*2 - 4, TILE - 8, 6);
  // Legs (blue shorts/pants)
  ctx.fillStyle = "#1a3fa0";
  ctx.fillRect(px + 2, py + TILE + 10, TILE/2 - 4, TILE - 10);
  ctx.fillRect(px + TILE/2 + 2, py + TILE + 10, TILE/2 - 4, TILE - 10);
  // Barcelona shirt (dark red/blue stripes)
  const bodyX = px + 2, bodyY = py + TILE * 0.45, bodyW = TILE - 4, bodyH = TILE * 0.6;
  const stripeW = Math.floor(bodyW / 5);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#a50044" : "#004d99";
    ctx.fillRect(bodyX + i * stripeW, bodyY, stripeW + 1, bodyH);
  }
  // Crest area
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(bodyX + 5, bodyY + 3, 9, 11);
  ctx.fillStyle = "#a50044";
  ctx.fillRect(bodyX + 6, bodyY + 4, 4, 9);
  ctx.fillStyle = "#004d99";
  ctx.fillRect(bodyX + 10, bodyY + 4, 3, 9);
  // Arms (Barcelona striped sleeves)
  ctx.fillStyle = "#a50044"; ctx.fillRect(px - 4, py + TILE*0.45, 8, TILE*0.5);
  ctx.fillStyle = "#004d99"; ctx.fillRect(px + TILE - 4, py + TILE*0.45, 8, TILE*0.5);
  // Head
  ctx.fillStyle = "#d4a574"; ctx.fillRect(px + 4, py, TILE - 8, TILE * 0.5);
  // Eyes
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(px + 7, py + 8, 5, 5);
  ctx.fillRect(px + TILE - 14, py + 8, 5, 5);
  // Hair
  ctx.fillStyle = "#2a1800"; ctx.fillRect(px + 4, py, TILE - 8, 7);
  ctx.fillStyle = "#3a2200"; ctx.fillRect(px + 2, py + 2, 5, 5);
  ctx.fillRect(px + TILE - 7, py + 2, 5, 5);
}

function drawUnicorn(ctx, px, py, tick) {
  // Shadow
  ctx.fillStyle = "rgba(255,100,180,0.2)";
  ctx.fillRect(px + 2, py + TILE*2 - 4, TILE - 8, 6);
  // Legs (sparkle purple)
  ctx.fillStyle = "#c060d0";
  ctx.fillRect(px + 2, py + TILE + 10, TILE/2 - 4, TILE - 10);
  ctx.fillRect(px + TILE/2 + 2, py + TILE + 10, TILE/2 - 4, TILE - 10);
  // Hooves
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 2, py + TILE*2 - 6, TILE/2 - 4, 6);
  ctx.fillRect(px + TILE/2 + 2, py + TILE*2 - 6, TILE/2 - 4, 6);
  // Body (white with rainbow shimmer)
  ctx.fillStyle = "#fff8fc";
  ctx.fillRect(px + 2, py + TILE * 0.45, TILE - 4, TILE * 0.6);
  // Rainbow shimmer
  const shimColors = ["#ff9de2","#ffe0f0","#e8c0ff","#b0e0ff"];
  shimColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.3 + 0.1*Math.sin(tick*0.08 + i);
    ctx.fillRect(px + 2 + i*6, py + TILE*0.45, 5, TILE*0.6);
  });
  ctx.globalAlpha = 1;
  // Wings
  ctx.fillStyle = "rgba(255,200,240,0.85)";
  ctx.beginPath();
  ctx.moveTo(px - 2, py + TILE * 0.7);
  ctx.lineTo(px - 14, py + TILE * 0.4 + Math.sin(tick*0.1)*4);
  ctx.lineTo(px - 2, py + TILE * 1.0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px + TILE + 2, py + TILE * 0.7);
  ctx.lineTo(px + TILE + 14, py + TILE * 0.4 + Math.sin(tick*0.1)*4);
  ctx.lineTo(px + TILE + 2, py + TILE * 1.0);
  ctx.fill();
  // Head (white horse-like)
  ctx.fillStyle = "#fff8fc";
  ctx.fillRect(px + 4, py, TILE - 8, TILE * 0.55);
  // Snout
  ctx.fillStyle = "#ffe0f0";
  ctx.fillRect(px + 6, py + TILE*0.35, TILE - 12, TILE*0.2);
  // Nostrils
  ctx.fillStyle = "#ffb0d0";
  ctx.fillRect(px + 8, py + TILE*0.44, 4, 3);
  ctx.fillRect(px + TILE - 14, py + TILE*0.44, 4, 3);
  // Big sparkle eyes
  ctx.fillStyle = "#7020c0";
  ctx.fillRect(px + 7, py + 7, 6, 7);
  ctx.fillRect(px + TILE - 15, py + 7, 6, 7);
  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 9, py + 8, 2, 2);
  ctx.fillRect(px + TILE - 13, py + 8, 2, 2);
  // Rainbow mane
  const maneColors = ["#ff4499","#ff99cc","#cc44ff","#ff66aa","#ffaadd"];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = maneColors[i % maneColors.length];
    ctx.fillRect(px + 4 + i*3, py - 4 + Math.sin(tick*0.05 + i)*2, 4, 10);
  }
  // Horn (golden, glowing)
  const hornFlicker = 0.7 + 0.3 * Math.sin(tick * 0.15);
  const glow = ctx.createRadialGradient(px + TILE/2, py - 10, 0, px + TILE/2, py - 10, 20);
  glow.addColorStop(0, `rgba(255,220,0,${0.5*hornFlicker})`);
  glow.addColorStop(1, "rgba(255,220,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(px + TILE/2 - 15, py - 25, 30, 30);
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.moveTo(px + TILE/2, py - 18);
  ctx.lineTo(px + TILE/2 - 4, py);
  ctx.lineTo(px + TILE/2 + 4, py);
  ctx.fill();
  // Horn stripe
  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(px + TILE/2 - 1, py - 14, 2, 14);
  // Sparkles around horn
  if (tick % 6 < 3) {
    ctx.fillStyle = "#fffaaa";
    ctx.fillRect(px + TILE/2 - 8, py - 12, 3, 3);
    ctx.fillRect(px + TILE/2 + 5, py - 8, 3, 3);
    ctx.fillRect(px + TILE/2 - 3, py - 20, 2, 2);
  }
}

// ── Main game component ───────────────────────────────────────────────────────
export default function WilkuCraft() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const [screen, setScreen] = useState("menu"); // "menu" | "game"
  const [worldName, setWorldName] = useState("WILKUCRAFT");
  const [hotbarSel, setHotbarSel] = useState(0);
  const [inventory, setInventory] = useState({});
  const [welcomeMsg, setWelcomeMsg] = useState(null);

  const initWorld = useCallback((name) => {
    const world = name === "WILKUCRAFT" ? generateWilkuWorld() : generateGritsWorld();
    const spawnX = 5;
    const spawnY = findSpawnY(world, spawnX);
    stateRef.current = {
      world,
      worldName: name,
      player: { x: spawnX * TILE, y: spawnY * TILE, vx: 0, vy: 0, onGround: false },
      camX: 0, camY: 0,
      keys: {},
      hotbar: 0,
      breakingBlock: null,
      breakProgress: 0,
      inventory: {},
      particles: [],
      tick: 0,
      tooltip: null,
    };
  }, []);

  const startWorld = useCallback((name) => {
    initWorld(name);
    setWorldName(name);
    setInventory({});
    setHotbarSel(0);
    setScreen("game");
    setWelcomeMsg(`Tere mu sõber, ${name}!`);
    setTimeout(() => setWelcomeMsg(null), 3500);
  }, [initWorld]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;
    const { world, worldName: wn, player, camX, camY, breakingBlock, breakProgress, particles, tick } = s;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const isGrits = wn === "GRITSCRAFT";

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    if (isGrits) {
      sky.addColorStop(0, "#f9c0e0");
      sky.addColorStop(1, "#ffe8f4");
    } else {
      sky.addColorStop(0, "#1a6bb5");
      sky.addColorStop(1, "#87ceeb");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Sun / Magical moon
    if (isGrits) {
      // Rainbow sun
      const sunX = W * 0.82, sunY = 55;
      for (let r = 35; r > 0; r -= 5) {
        const hue = (r * 10 + tick) % 360;
        ctx.fillStyle = `hsla(${hue},100%,75%,0.15)`;
        ctx.beginPath(); ctx.arc(sunX, sunY, r + 10, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = "#ffeeaa";
      ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = "#FFE066";
      ctx.beginPath(); ctx.arc(W*0.85, 50, 25, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "rgba(255,230,100,0.3)"; ctx.lineWidth = 8; ctx.stroke();
    }

    // Clouds
    ctx.fillStyle = isGrits ? "rgba(255,180,220,0.85)" : "rgba(255,255,255,0.85)";
    const cloudOff = (tick * 0.15) % W;
    [[80,60,80,25],[250,45,100,22],[440,70,70,20],[600,55,90,24]].forEach(([cx,cy,cw,ch]) => {
      const rx = ((cx - cloudOff + W) % W);
      ctx.fillRect(rx, cy, cw, ch);
      ctx.fillRect(rx+10, cy-12, cw-20, ch);
    });

    // Blocks
    const startCol = Math.floor(camX / TILE);
    const endCol = Math.min(COLS, startCol + VIEW_W + 2);
    const startRow = Math.floor(camY / TILE);
    const endRow = Math.min(ROWS, startRow + VIEW_H + 2);
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const btype = world[row]?.[col] ?? BLOCKS.AIR;
        if (btype === BLOCKS.AIR) continue;
        const bpx = col * TILE - camX, bpy = row * TILE - camY;
        let bp = 0;
        if (breakingBlock && breakingBlock.col === col && breakingBlock.row === row) bp = breakProgress;
        drawBlockOnCtx(ctx, btype, bpx, bpy, TILE, bp);
      }
    }

    // Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
      ctx.fillRect(p.x - camX, p.y - camY, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Player
    const ppx = player.x - camX, ppy = player.y - camY;
    if (isGrits) drawUnicorn(ctx, ppx, ppy, tick);
    else drawWilkuPlayer(ctx, ppx, ppy);

    // Crosshair
    ctx.strokeStyle = isGrits ? "rgba(255,100,180,0.9)" : "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W/2-10, H/2); ctx.lineTo(W/2+10, H/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/2, H/2-10); ctx.lineTo(W/2, H/2+10); ctx.stroke();

    // Tooltip
    if (s.tooltip) {
      ctx.fillStyle = isGrits ? "rgba(180,0,100,0.75)" : "rgba(0,0,0,0.7)";
      ctx.fillRect(s.tooltip.x - camX - 5, s.tooltip.y - camY - 22, 80, 18);
      ctx.fillStyle = "#fff"; ctx.font = "bold 11px monospace";
      ctx.fillText(s.tooltip.text, s.tooltip.x - camX, s.tooltip.y - camY - 8);
    }
  }, []);

  const update = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const { world, keys } = s;
    let { x, y, vx, vy, onGround } = s.player;
    vx = 0;
    if (keys["ArrowLeft"]  || keys["a"] || keys["A"]) vx = -SPEED;
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) vx = SPEED;
    if ((keys["ArrowUp"] || keys["w"] || keys["W"] || keys[" "]) && onGround) {
      vy = JUMP_FORCE; onGround = false;
    }
    vy += GRAVITY; vy = Math.min(vy, 12);

    x += vx * TILE / 32;
    const tX1 = Math.floor(x / TILE), tX2 = Math.floor((x + TILE - 2) / TILE);
    const tTop = Math.floor((y + 2) / TILE), tBot = Math.floor((y + TILE*2 - 2) / TILE);
    for (let ty = tTop; ty <= tBot; ty++) {
      if (BLOCK_DATA[world[ty]?.[tX1]]?.solid) x = (tX1 + 1) * TILE;
      if (BLOCK_DATA[world[ty]?.[tX2]]?.solid) x = tX2 * TILE - TILE;
    }
    y += vy;
    const tL = Math.floor((x + 2) / TILE), tR = Math.floor((x + TILE - 2) / TILE);
    const nTop = Math.floor((y + 2) / TILE), nBot = Math.floor((y + TILE*2 - 2) / TILE);
    onGround = false;
    if (vy > 0) {
      if (BLOCK_DATA[world[nBot]?.[tL]]?.solid || BLOCK_DATA[world[nBot]?.[tR]]?.solid) {
        y = nBot * TILE - TILE*2; vy = 0; onGround = true;
      }
    } else if (vy < 0) {
      if (BLOCK_DATA[world[nTop]?.[tL]]?.solid || BLOCK_DATA[world[nTop]?.[tR]]?.solid) {
        y = (nTop + 1) * TILE; vy = 0;
      }
    }
    x = Math.max(0, Math.min(x, (COLS-1)*TILE));
    y = Math.max(0, Math.min(y, (ROWS-2)*TILE));
    s.player = { x, y, vx, vy, onGround };

    const canvas = canvasRef.current;
    if (canvas) {
      s.camX = Math.max(0, Math.min(x + TILE/2 - canvas.width/2, COLS*TILE - canvas.width));
      s.camY = Math.max(0, Math.min(y - canvas.height/2, ROWS*TILE - canvas.height));
    }
    s.particles = s.particles
      .map(p => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, vy: p.vy+0.15, life: p.life-0.04 }))
      .filter(p => p.life > 0);
    s.tick++;
  }, []);

  useEffect(() => {
    if (screen !== "game") return;
    const loop = () => { update(); draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen, update, draw]);

  useEffect(() => {
    if (screen !== "game") return;
    const down = (e) => {
      if (!stateRef.current) return;
      stateRef.current.keys[e.key] = true;
      if (e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        const hotbar = worldName === "WILKUCRAFT" ? HOTBAR_WILKU : HOTBAR_GRITS;
        if (idx < hotbar.length) { stateRef.current.hotbar = idx; setHotbarSel(idx); }
      }
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key)) e.preventDefault();
    };
    const up = (e) => { if (stateRef.current) stateRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [screen, worldName]);

  useEffect(() => {
    if (screen !== "game") return;
    const onWheel = (e) => {
      if (!stateRef.current) return;
      const hotbar = worldName === "WILKUCRAFT" ? HOTBAR_WILKU : HOTBAR_GRITS;
      stateRef.current.hotbar = (stateRef.current.hotbar + (e.deltaY > 0 ? 1 : -1) + hotbar.length) % hotbar.length;
      setHotbarSel(stateRef.current.hotbar);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [screen, worldName]);

  const getClickedBlock = useCallback((e) => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width) + s.camX;
    const my = (e.clientY - rect.top) * (canvas.height / rect.height) + s.camY;
    return { col: Math.floor(mx / TILE), row: Math.floor(my / TILE) };
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const s = stateRef.current;
    if (!s) return;
    const { col, row } = getClickedBlock(e);
    if (e.button === 0) {
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        const btype = s.world[row][col];
        if (btype !== BLOCKS.AIR && btype !== BLOCKS.BEDROCK && btype !== BLOCKS.CANDY) {
          s.breakingBlock = { col, row }; s.breakProgress = 0;
          const bi = setInterval(() => {
            if (!s.breakingBlock || s.breakingBlock.col !== col || s.breakingBlock.row !== row) { clearInterval(bi); return; }
            s.breakProgress += 0.12;
            if (s.breakProgress >= 1) {
              clearInterval(bi);
              const bt = s.world[row][col];
              s.world[row][col] = BLOCKS.AIR;
              s.breakingBlock = null; s.breakProgress = 0;
              s.inventory[bt] = (s.inventory[bt] || 0) + 1;
              setInventory({ ...s.inventory });
              const bd = BLOCK_DATA[bt];
              for (let i = 0; i < 8; i++) {
                s.particles.push({
                  x: col*TILE+TILE/2, y: row*TILE+TILE/2,
                  vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4-2,
                  color: bd.top, life: 1, size: 4+Math.random()*4
                });
              }
            }
          }, 80);
        }
      }
    } else if (e.button === 2) {
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        const hotbar = worldName === "WILKUCRAFT" ? HOTBAR_WILKU : HOTBAR_GRITS;
        const sel = hotbar[s.hotbar];
        if (s.world[row][col] === BLOCKS.AIR || s.world[row][col] === BLOCKS.WATER) {
          s.world[row][col] = sel;
        }
      }
    }
  }, [getClickedBlock, worldName]);

  const handleMouseUp = useCallback(() => { if (stateRef.current) stateRef.current.breakingBlock = null; }, []);
  const handleMouseMove = useCallback((e) => {
    const s = stateRef.current; if (!s) return;
    const { col, row } = getClickedBlock(e);
    const btype = s.world[row]?.[col];
    if (btype && btype !== BLOCKS.AIR) s.tooltip = { x: col*TILE+5, y: row*TILE, text: BLOCK_DATA[btype]?.label || "" };
    else s.tooltip = null;
  }, [getClickedBlock]);

  const hotbar = worldName === "WILKUCRAFT" ? HOTBAR_WILKU : HOTBAR_GRITS;
  const isGrits = worldName === "GRITSCRAFT";
  const accent = isGrits ? "#f06090" : "#4aff4a";
  const accentGlow = isGrits ? "#f06090" : "#4aff4a";
  const bg = isGrits ? "#1a0010" : "#0a0a0f";

  // ── MENU ─────────────────────────────────────────────────────────────────
  if (screen === "menu") {
    return (
      <div style={{
        background: "radial-gradient(ellipse at center, #0d0020 0%, #000008 100%)",
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace",
      }}>
        {/* Title */}
        <div style={{ textAlign:"center", marginBottom: "50px" }}>
          <div style={{
            fontSize: "54px", fontWeight: "900", letterSpacing: "8px",
            background: "linear-gradient(90deg, #4aff4a, #f06090, #ffd700, #4aff4a)",
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: "none", filter: "drop-shadow(0 0 20px rgba(74,255,74,0.5))",
            animation: "shimmer 3s ease infinite",
          }}>
            WILKUCRAFT
          </div>
          <div style={{ color:"#888", fontSize:"14px", marginTop:"8px", letterSpacing:"4px" }}>
            VALI OMA MAAILM
          </div>
        </div>

        {/* World cards */}
        <div style={{ display:"flex", gap:"40px", flexWrap:"wrap", justifyContent:"center" }}>
          {/* WILKUCRAFT world */}
          <div
            onClick={() => startWorld("WILKUCRAFT")}
            style={{
              width: 240, background: "rgba(10,30,10,0.85)",
              border: "3px solid #4a7c3f", borderRadius: "8px", padding:"24px",
              cursor:"pointer", transition:"all 0.2s",
              boxShadow:"0 0 30px rgba(74,124,63,0.3)",
              textAlign:"center",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform="scale(1.05)"; e.currentTarget.style.boxShadow="0 0 50px rgba(74,124,63,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 0 30px rgba(74,124,63,0.3)"; }}
          >
            {/* Mini player preview */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"16px" }}>
              <svg width="50" height="80" viewBox="0 0 50 80">
                {/* Legs */}
                <rect x="8" y="50" width="14" height="26" fill="#1a3fa0"/>
                <rect x="28" y="50" width="14" height="26" fill="#1a3fa0"/>
                {/* Body stripes */}
                {[0,1,2,3,4].map(i=>(
                  <rect key={i} x={8+i*6.4} y="22" width="7" height="28" fill={i%2===0?"#a50044":"#004d99"}/>
                ))}
                {/* Crest */}
                <rect x="9" y="24" width="9" height="11" fill="#ffcc00"/>
                <rect x="10" y="25" width="4" height="9" fill="#a50044"/>
                <rect x="14" y="25" width="3" height="9" fill="#004d99"/>
                {/* Head */}
                <rect x="10" y="2" width="30" height="20" fill="#d4a574"/>
                {/* Hair */}
                <rect x="10" y="2" width="30" height="6" fill="#2a1800"/>
                {/* Eyes */}
                <rect x="13" y="9" width="5" height="5" fill="#1a1a2e"/>
                <rect x="32" y="9" width="5" height="5" fill="#1a1a2e"/>
              </svg>
            </div>
            <div style={{ color:"#4aff4a", fontSize:"20px", fontWeight:"bold", letterSpacing:"2px" }}>WILKUCRAFT</div>
            <div style={{ color:"#4a7c3f", fontSize:"11px", marginTop:"8px" }}>Klassikaline maailm</div>
            <div style={{ color:"#666", fontSize:"10px", marginTop:"4px" }}>rohumaa · mets · kaevandused</div>
          </div>

          {/* GRITSCRAFT world */}
          <div
            onClick={() => startWorld("GRITSCRAFT")}
            style={{
              width: 240, background: "rgba(30,0,20,0.85)",
              border: "3px solid #f06090", borderRadius: "8px", padding:"24px",
              cursor:"pointer", transition:"all 0.2s",
              boxShadow:"0 0 30px rgba(240,96,144,0.3)",
              textAlign:"center",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform="scale(1.05)"; e.currentTarget.style.boxShadow="0 0 50px rgba(240,96,144,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 0 30px rgba(240,96,144,0.3)"; }}
          >
            {/* Unicorn preview */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"16px" }}>
              <svg width="60" height="90" viewBox="0 0 60 90">
                {/* Legs */}
                <rect x="10" y="55" width="14" height="26" fill="#c060d0"/>
                <rect x="30" y="55" width="14" height="26" fill="#c060d0"/>
                {/* Hooves */}
                <rect x="10" y="74" width="14" height="7" fill="white"/>
                <rect x="30" y="74" width="14" height="7" fill="white"/>
                {/* Body */}
                <rect x="8" y="28" width="38" height="28" fill="#fff8fc"/>
                {["#ff9de2","#ffe0f0","#e8c0ff","#b0e0ff"].map((c,i)=>(
                  <rect key={i} x={8+i*9} y="28" width="8" height="28" fill={c} opacity="0.4"/>
                ))}
                {/* Wings */}
                <polygon points="4,38 -6,22 4,50" fill="rgba(255,200,240,0.9)"/>
                <polygon points="50,38 60,22 50,50" fill="rgba(255,200,240,0.9)"/>
                {/* Head */}
                <rect x="12" y="8" width="30" height="22" fill="#fff8fc"/>
                {/* Mane */}
                {["#ff4499","#ff99cc","#cc44ff","#ff66aa"].map((c,i)=>(
                  <rect key={i} x={12+i*4} y="4" width="4" height="12" fill={c}/>
                ))}
                {/* Horn */}
                <polygon points="27,0 22,9 32,9" fill="#ffd700"/>
                {/* Eyes */}
                <rect x="16" y="13" width="6" height="7" fill="#7020c0"/>
                <rect x="32" y="13" width="6" height="7" fill="#7020c0"/>
                <rect x="18" y="14" width="2" height="2" fill="white"/>
                <rect x="34" y="14" width="2" height="2" fill="white"/>
              </svg>
            </div>
            <div style={{ color:"#f06090", fontSize:"20px", fontWeight:"bold", letterSpacing:"2px" }}>GRITSCRAFT</div>
            <div style={{ color:"#c04070", fontSize:"11px", marginTop:"8px" }}>Roosane maailm</div>
            <div style={{ color:"#884466", fontSize:"10px", marginTop:"4px" }}>vahtkomm · kommikivi · ükssarvik</div>
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0%{background-position:0% 50%}
            50%{background-position:100% 50%}
            100%{background-position:0% 50%}
          }
        `}</style>
      </div>
    );
  }

  // ── GAME ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: bg, minHeight:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"'Courier New', monospace", padding:"12px"
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"8px" }}>
        <button
          onClick={() => setScreen("menu")}
          style={{
            background:"rgba(255,255,255,0.1)", border:"1px solid #555", color:"#aaa",
            padding:"4px 10px", borderRadius:"4px", cursor:"pointer", fontSize:"11px",
            fontFamily:"'Courier New', monospace"
          }}
        >← Menüü</button>
        <div style={{
          fontSize:"22px", fontWeight:"bold", color: accent,
          textShadow:`0 0 10px ${accentGlow}, 2px 2px 0 #000`,
          letterSpacing:"4px"
        }}>
          {worldName === "WILKUCRAFT" ? "⛏️ WILKUCRAFT ⛏️" : "🦄 GRITSCRAFT 🦄"}
        </div>
      </div>

      {/* Welcome message */}
      {welcomeMsg && (
        <div style={{
          position:"fixed", top:"20px", left:"50%", transform:"translateX(-50%)",
          background: isGrits ? "rgba(180,0,100,0.9)" : "rgba(0,80,0,0.9)",
          border: `2px solid ${accent}`,
          color:"#fff", padding:"14px 28px", borderRadius:"8px", fontSize:"18px",
          fontFamily:"'Courier New', monospace", fontWeight:"bold",
          boxShadow:`0 0 30px ${accent}88`,
          zIndex:1000, letterSpacing:"1px", textAlign:"center",
          animation:"fadeIn 0.4s ease"
        }}>
          {welcomeMsg}
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={672} height={480}
        style={{
          display:"block", imageRendering:"pixelated",
          border:`3px solid ${isGrits ? "#c04070" : "#4a7c3f"}`,
          boxShadow:`0 0 30px ${isGrits ? "rgba(240,96,144,0.4)" : "rgba(74,124,63,0.4)"}`,
          cursor:"crosshair", borderRadius:"2px"
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onContextMenu={e => e.preventDefault()}
      />

      {/* Hotbar */}
      <div style={{ display:"flex", gap:"3px", marginTop:"10px" }}>
        {hotbar.map((btype, i) => {
          const bd = BLOCK_DATA[btype];
          const isSel = i === hotbarSel;
          return (
            <div key={i} onClick={() => { stateRef.current.hotbar = i; setHotbarSel(i); }}
              style={{
                width:46, height:46, background: isSel ? "#555" : "#222",
                border: isSel ? `3px solid ${accent}` : "3px solid #444",
                borderRadius:"2px", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                cursor:"pointer", position:"relative",
                boxShadow: isSel ? `0 0 10px ${accent}88` : "none"
              }}
            >
              <div style={{
                width:26, height:26, background:bd.top,
                border:"1px solid rgba(0,0,0,0.4)", opacity: bd.opacity ?? 1
              }}/>
              <div style={{ color:"#888", fontSize:"9px", marginTop:"1px" }}>{i+1}</div>
              {inventory[btype] > 0 && (
                <div style={{
                  position:"absolute", bottom:2, right:3, color:"#fff",
                  fontSize:"9px", fontWeight:"bold", textShadow:"1px 1px 0 #000"
                }}>{inventory[btype]}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ marginTop:"7px", color:"#555", fontSize:"11px", textAlign:"center" }}>
        <span style={{color: isGrits ? "#f06090" : "#4a9f4a"}}>WASD</span> liiku &nbsp;|&nbsp;
        <span style={{color: isGrits ? "#f06090" : "#4a9f4a"}}>Tühik</span> hüppa &nbsp;|&nbsp;
        <span style={{color:"#e08040"}}>Vasak klik</span> kaeva &nbsp;|&nbsp;
        <span style={{color:"#4080e0"}}>Parem klik</span> ehita &nbsp;|&nbsp;
        <span style={{color:"#888"}}>1–9 / ratas</span> plokk
      </div>

      {/* Block legend */}
      <div style={{ display:"flex", gap:"8px", marginTop:"6px", flexWrap:"wrap", justifyContent:"center" }}>
        {hotbar.map((btype) => {
          const bd = BLOCK_DATA[btype];
          return (
            <div key={btype} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <div style={{ width:12, height:12, background:bd.top, border:"1px solid #444", opacity: bd.opacity ?? 1 }}/>
              <span style={{ color:"#666", fontSize:"10px" }}>{bd.label}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </div>
  );
}
