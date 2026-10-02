/*
 * ═══════════════════════════════════════════════════════════
 *  <fifo-pet> — Web Component autocontido (gerado por
 *  tools/build_webcomponent.py — não edite à mão)
 *
 *  Uso em QUALQUER página/app web (PWA, WebView, site):
 *
 *    <script src="fifo-pet-webcomponent.js"></script>
 *    <fifo-pet mic-button></fifo-pet>
 *
 *  API:
 *    const el = document.querySelector('fifo-pet');
 *    el.setMood('curioso');
 *    el.remind('beber água', 60);        // segundos
 *    el.enableMic();                      // requer gesto do usuário
 *    el.addEventListener('fifo-reminder', e => console.log(e.detail.text));
 *
 *  Atributos: mood="neutro" · mic-button (mostra botão p/ liberar o mic)
 * ═══════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

/*
 * ═══════════════════════════════════════════════════════════
 *  PetCore v3 ⚡ — a esfera Fifo (canvas 2D, sem dependências)
 *  Minimalista Tamagotchi com OLHOS DE MANGÁ:
 *    - ovais verticais grandes + reflexo duplo (grande em cima, pequeno embaixo)
 *
 *  Vida própria (v3):
 *    - TÉDIO: quando o cursor fica parado e há silêncio, ele sorteia
 *      ações aleatórias: olhar em volta, pular, girar, remexer,
 *      suspirar, entediar ("…") e cochilar ("z")
 *    - ALERTA (lembrete): pula com um "!" na cabeça até você cutucar
 *
 *  Símbolos traçados: ? (dúvida) · 💧 gota (vergonha/lágrima) · z z (sono)
 *  ✦ (faíscas) · marca de irritação · … (tédio) · ! (lembrete)
 * ═══════════════════════════════════════════════════════════
 */
(function (global) {
  'use strict';

  // ---------- utilidades ----------
  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpRgb(c1, c2, t) {
    return { r: lerp(c1.r, c2.r, t), g: lerp(c1.g, c2.g, t), b: lerp(c1.b, c2.b, t) };
  }
  function rgba(c, a) {
    return 'rgba(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ',' + a + ')';
  }
  function mixHex(c, hex, t) { return lerpRgb(c, hexToRgb(hex), t); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function smoothstep(p) { return p * p * (3 - 2 * p); }
  function easeInOut(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  // ---------- climas ----------
  var MOODS = {
    neutro:     { label: 'neutro',     emoji: '🙂', color: '#6B8CAE', eyes: 'soft',    symbol: null,       turn: 0 },
    animado:    { label: 'animado',    emoji: '✨', color: '#E8B93E', eyes: 'sparkle', symbol: 'spark',    turn: 0 },
    focado:     { label: 'focado',     emoji: '🎯', color: '#D97B4F', eyes: 'narrow',  symbol: null,       turn: 0 },
    cansado:    { label: 'cansado',    emoji: '💤', color: '#8E86C9', eyes: 'closed',  symbol: 'zzz',      turn: 0 },
    estressado: { label: 'estressado', emoji: '💢', color: '#C4574E', eyes: 'angry',   symbol: 'anger',    turn: 0 },
    triste:     { label: 'triste',     emoji: '💧', color: '#7A8794', eyes: 'sad',     symbol: 'tear',     turn: 0 },
    curioso:    { label: 'curioso',    emoji: '👀', color: '#4FA98C', eyes: 'wide',    symbol: null,       turn: 0 },
    duvida:     { label: 'dúvida',     emoji: '❓', color: '#9A7BB8', eyes: 'squint',  symbol: 'question', turn: 0 },
    vergonha:   { label: 'vergonha',   emoji: '🙈', color: '#D98A9E', eyes: 'soft',    symbol: 'sweat',    turn: 1 },
  };
  var MOOD_ORDER = ['neutro', 'animado', 'focado', 'cansado', 'estressado', 'triste', 'curioso', 'duvida', 'vergonha'];

  function paramsOf(name) {
    var m = MOODS[name] || MOODS.neutro;
    return { eyes: m.eyes, symbol: m.symbol, turn: m.turn, rgb: hexToRgb(m.color) };
  }

  var EYE = '#14181D';
  var GLINT = 'rgba(255,255,255,0.88)';
  var GLINT_SOFT = 'rgba(255,255,255,0.55)';

  // ---------- ações de tédio ----------
  var ACTIONS = ['lookAround', 'hop', 'spin', 'wiggle', 'sigh', 'bored', 'nap'];
  var ACTION_DUR = {
    lookAround: 2800,
    hop: 950,
    spin: 1100,
    wiggle: 1200,
    sigh: 1500,
    bored: 2800,
    nap: 2800,
  };

  // ---------- um olho de mangá ----------
  function drawOneEye(ctx, style, x, y, s, open, side, t) {
    if (style === 'closed') {
      ctx.strokeStyle = EYE;
      ctx.lineWidth = s * 0.13;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(x, y - s * 0.12, s * 0.52, 0.18 * Math.PI, 0.82 * Math.PI);
      ctx.stroke();
      return;
    }

    open = clamp(open, 0.05, 1.3);
    ctx.save();
    ctx.translate(x, y);

    var rx, ry, tilt = 0, bigGlint = true, smallGlint = true, dull = false;
    switch (style) {
      case 'wide':    rx = s * 0.52; ry = s * 0.80 * open; break;                 // curioso: olhão
      case 'narrow':  rx = s * 0.50; ry = s * 0.24 * open; bigGlint = false; break; // focado
      case 'sparkle': rx = s * 0.46; ry = s * 0.70 * open; break;                 // animado
      case 'sad':     rx = s * 0.42; ry = s * 0.60 * open; tilt = side * 0.16; dull = true; break;
      default:        rx = s * 0.44; ry = s * 0.66 * open; break;                 // soft (manga clássico)
    }
    if (tilt) ctx.rotate(tilt);

    // globo (oval vertical de mangá)
    ctx.fillStyle = EYE;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    if (open > 0.4) {
      // reflexo grande (cima) — marca registrada do olho de mangá
      if (bigGlint) {
        ctx.fillStyle = dull ? GLINT_SOFT : GLINT;
        ctx.beginPath();
        ctx.ellipse(-rx * 0.28, -ry * 0.42, s * 0.15, s * 0.17, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // reflexo pequeno (baixo)
      if (smallGlint && ry > s * 0.3) {
        ctx.fillStyle = GLINT_SOFT;
        ctx.beginPath();
        ctx.arc(rx * 0.3, ry * 0.44, s * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
      // faísca extra do animado
      if (style === 'sparkle') {
        ctx.fillStyle = GLINT;
        ctx.save();
        ctx.translate(rx * 0.34, -ry * 0.5);
        ctx.rotate(t / 900);
        var ss = s * 0.1 * (0.8 + 0.2 * Math.sin(t / 240));
        ctx.beginPath();
        for (var i = 0; i < 8; i++) {
          var ang = (Math.PI / 4) * i - Math.PI / 2;
          var rad = i % 2 === 0 ? ss : ss * 0.35;
          var px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawBrows(ctx, ex, ey, s) {
    ctx.strokeStyle = EYE;
    ctx.lineWidth = s * 0.14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-ex - s * 0.62, ey - s * 1.0);
    ctx.lineTo(-ex + s * 0.44, ey - s * 0.66);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex + s * 0.62, ey - s * 1.0);
    ctx.lineTo(ex - s * 0.44, ey - s * 0.66);
    ctx.stroke();
  }

  function drawEyePair(ctx, style, alpha, r, s, openMul, look, t) {
    if (alpha <= 0.02) return;
    var ex = r * 0.315, ey = -r * 0.06;
    var shiftX = look.x * s * 0.5;
    var shiftY = look.y * s * 0.42;
    var fx = look.x * r * 0.05, fy = look.y * r * 0.04;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fx, fy);

    if (style === 'squint') {
      drawOneEye(ctx, 'soft', -ex + shiftX, ey + shiftY, s, openMul, -1, t);
      drawOneEye(ctx, 'narrow', ex + shiftX, ey + shiftY, s, openMul, 1, t);
    } else {
      drawOneEye(ctx, style, -ex + shiftX, ey + shiftY, s, openMul, -1, t);
      drawOneEye(ctx, style, ex + shiftX, ey + shiftY, s, openMul, 1, t);
      if (style === 'angry') drawBrows(ctx, shiftX, ey + shiftY, s);
    }
    ctx.restore();
  }

  // ---------- símbolos minimalistas ----------
  function drawDroplet(ctx, x, y, rr) {
    ctx.beginPath();
    ctx.moveTo(x, y - rr * 1.7);
    ctx.quadraticCurveTo(x + rr * 1.05, y - rr * 0.1, x + rr * 0.85, y + rr * 0.35);
    ctx.arc(x, y + rr * 0.35, rr * 0.85, 0, Math.PI);
    ctx.quadraticCurveTo(x - rr * 1.05, y - rr * 0.1, x, y - rr * 1.7);
    ctx.closePath();
    ctx.fill();
  }

  function drawSpark(ctx, x, y, ss) {
    ctx.beginPath();
    ctx.moveTo(x, y - ss);
    ctx.quadraticCurveTo(x + ss * 0.14, y - ss * 0.14, x + ss, y);
    ctx.quadraticCurveTo(x + ss * 0.14, y + ss * 0.14, x, y + ss);
    ctx.quadraticCurveTo(x - ss * 0.14, y + ss * 0.14, x - ss, y);
    ctx.quadraticCurveTo(x - ss * 0.14, y - ss * 0.14, x, y - ss);
    ctx.fill();
  }

  function drawZ(ctx, x, y, zs) {
    ctx.beginPath();
    ctx.moveTo(x - zs / 2, y - zs / 2);
    ctx.lineTo(x + zs / 2, y - zs / 2);
    ctx.lineTo(x - zs / 2, y + zs / 2);
    ctx.lineTo(x + zs / 2, y + zs / 2);
    ctx.stroke();
  }

  function drawAngerMark(ctx, x, y, m) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.15);
    for (var i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i * m * 0.18, -m * 0.5);
      ctx.quadraticCurveTo(i * m * 0.32, 0, i * m * 0.18, m * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-m * 0.5, i * m * 0.18);
      ctx.quadraticCurveTo(0, i * m * 0.32, m * 0.5, i * m * 0.18);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawQuestion(ctx, x, y, qs) {
    var lw = Math.max(2, qs * 0.24);
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(x, y, qs, Math.PI * 0.85, Math.PI * 1.98);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(Math.PI * 1.98) * qs, y + Math.sin(Math.PI * 1.98) * qs);
    ctx.quadraticCurveTo(x + qs * 0.8, y + qs * 0.55, x, y + qs * 0.68);
    ctx.lineTo(x, y + qs * 1.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + qs * 1.45, lw * 0.62, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBang(ctx, x, y, bs) {
    ctx.lineWidth = bs * 0.34;
    ctx.beginPath();
    ctx.moveTo(x, y - bs * 0.75);
    ctx.lineTo(x, y + bs * 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + bs * 0.62, bs * 0.19, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSymbol(ctx, kind, alpha, faceAlpha, r, symColor, t) {
    if (!kind || alpha <= 0.02) return;
    ctx.save();
    var floating = (kind !== 'tear');
    var a = alpha * (floating ? 1 : faceAlpha);
    ctx.globalAlpha = a;
    ctx.strokeStyle = symColor;
    ctx.fillStyle = symColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, r * 0.05);

    if (kind === 'question') {
      var qy = -r * 1.48 + Math.sin(t / 520) * r * 0.05;
      drawQuestion(ctx, 0, qy, r * 0.24);

    } else if (kind === 'zzz' || kind === 'z1') {
      var n = kind === 'z1' ? 1 : 2;
      for (var i = 0; i < n; i++) {
        var ph = ((t / 2000) + i * 0.5) % 1;
        var zx = r * (0.55 + i * 0.3);
        var zy = -r * (1.05 + i * 0.3) - ph * r * 0.35;
        ctx.save();
        ctx.globalAlpha = a * (1 - ph) * 0.9;
        drawZ(ctx, zx, zy, r * (0.16 + i * 0.07));
        ctx.restore();
      }

    } else if (kind === 'spark') {
      var spots = [[-r * 0.88, -r * 0.95, r * 0.15], [r * 0.78, -r * 1.12, r * 0.1]];
      for (var j = 0; j < spots.length; j++) {
        var tw = 0.65 + 0.35 * Math.sin(t / 280 + j * 2.4);
        ctx.save();
        ctx.globalAlpha = a * tw;
        drawSpark(ctx, spots[j][0], spots[j][1] + Math.sin(t / 460 + j) * r * 0.03, spots[j][2] * (0.8 + tw * 0.3));
        ctx.restore();
      }

    } else if (kind === 'anger') {
      var pulse = 1 + 0.09 * Math.sin(t / 170);
      ctx.save();
      ctx.translate(r * 0.78, -r * 1.02);
      ctx.scale(pulse, pulse);
      drawAngerMark(ctx, 0, 0, r * 0.24);
      ctx.restore();

    } else if (kind === 'sweat') {
      var wy = Math.sin(t / 420) * r * 0.045;
      drawDroplet(ctx, r * 0.82, -r * 0.92 + wy, r * 0.105);

    } else if (kind === 'tear') {
      var cyc = (t % 2800) / 2800;
      var ta = Math.sin(cyc * Math.PI) * 0.8 * faceAlpha;
      if (ta > 0.02) {
        ctx.save();
        ctx.globalAlpha = ta;
        ctx.fillStyle = EYE;
        drawDroplet(ctx, r * 0.46, r * 0.08 + cyc * r * 0.24, r * 0.055);
        ctx.restore();
      }

    } else if (kind === 'dots') {
      // "…" de tédio
      for (var d = 0; d < 3; d++) {
        var da = 0.5 + 0.5 * Math.sin(t / 380 + d * 0.9);
        ctx.save();
        ctx.globalAlpha = a * (0.35 + da * 0.6);
        ctx.beginPath();
        ctx.arc(r * 0.95 + d * r * 0.17, -r * 0.62, r * 0.045, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

    } else if (kind === 'bang') {
      // "!" de lembrete — pulsa chamando atenção
      var bp2 = 1 + 0.1 * Math.sin(t / 130);
      ctx.save();
      ctx.translate(0, -r * 1.42 + Math.sin(t / 200) * r * 0.05);
      ctx.scale(bp2, bp2);
      drawBang(ctx, 0, 0, r * 0.42);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- frases ----------
  var PHRASES = [
    'Ai! Teste de reflexos? Passei. 😌',
    'Se eu tivesse bolso, guardava sua produtividade nele.',
    'Tô de olho em você. Literalmente — só tenho olhos.',
    'Rir, pensar, produzir. Escolhe um que eu já começo.',
    'Cutucar uma IA solta piadas. Quer uma?',
    'Ei! Minha esfera tem garantia, mas meu humor não.',
    'Cada cutucada = 1 agachamento neural. Já fiz 3 hoje.',
    'Oi? Ah, é só você. Finge que eu tava meditando.',
  ];

  // ---------- fábrica da esfera ----------
  function createPet(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var SIZE = opts.size || 240;
    var DPR = opts.dpr || 1;
    var R = SIZE * 0.3;

    var cur = paramsOf('neutro');
    var from = paramsOf('neutro');
    var to = paramsOf('neutro');
    var moodName = 'neutro';
    var trans = 1;
    var turnCur = 0;

    var raw = 0, smoothed = 0, prevRaw = 0, lastRing = -9999;
    var rings = [];
    var look = { x: 0, y: 0 }, lookT = { x: 0, y: 0 };
    var lean = { x: 0, y: 0 }, leanT = { x: 0, y: 0 };
    var squish = 0, squishV = 0;
    var blinkUntil = 0, nextBlink = performance.now() + rand(1400, 4000);
    var last = performance.now();

    // --- vida própria: tédio + alerta ---
    var lastPointerMove = performance.now();
    var lastPT = { x: NaN, y: NaN };
    var nextActionAt = performance.now() + rand(5000, 10000);
    var action = null;          // { name, t0, dur }
    var alertUntil = 0;

    function setState(name) {
      if (!MOODS[name]) name = 'neutro';
      moodName = name;
      var p = smoothstep(clamp(trans, 0, 1));
      from = {
        eyes: p < 0.5 ? from.eyes : to.eyes,
        symbol: p < 0.5 ? from.symbol : to.symbol,
        rgb: lerpRgb(from.rgb, to.rgb, p),
        turn: turnCur,
      };
      to = paramsOf(name);
      trans = 0;
    }

    function setLevel(v) { raw = clamp(v || 0, 0, 1); }

    /** moving=true quando o cursor realmente se moveu (não só a janela). */
    function setPointer(dx, dy, moving) {
      if (moving !== false) {
        if (!isFinite(lastPT.x) || Math.abs(dx - lastPT.x) > 4 || Math.abs(dy - lastPT.y) > 4) {
          lastPointerMove = performance.now();
        }
        lastPT.x = dx; lastPT.y = dy;
      }
      lookT.x = clamp(dx / 170, -1, 1);
      lookT.y = clamp(dy / 170, -1, 1);
    }

    function setVelocity(vx, vy) {
      leanT.x = clamp(vx * 0.5, -8, 8);
      leanT.y = clamp(vy * 0.38, -6, 6);
    }

    /** Lembrete: pula com "!" até cutucar (ou até ms acabar). */
    function alert(ms) {
      alertUntil = performance.now() + (ms || 12000);
      action = null;
    }
    function clearAlert() { alertUntil = 0; }

    /** Força uma ação (teste/botão). Sem nome = sorteia. */
    function playAction(name) {
      if (!name) name = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      if (!ACTION_DUR[name]) name = 'lookAround';
      action = { name: name, t0: performance.now(), dur: ACTION_DUR[name] };
      if (name === 'sigh') squishV += 0.3;
      return name;
    }

    function poke() {
      squishV += -0.5;
      rings.push({ t0: performance.now(), strong: true });
      return PHRASES[Math.floor(Math.random() * PHRASES.length)];
    }

    function step(now) {
      var dt = Math.min(50, now - last);
      last = now;
      var k = dt / 16.67;

      trans = Math.min(1, trans + dt / 550);
      var pe = smoothstep(trans);

      turnCur += (to.turn - turnCur) * (1 - Math.pow(0.9, k));
      if (Math.abs(to.turn - turnCur) < 0.002) turnCur = to.turn;

      prevRaw = smoothed;
      smoothed = smoothed * Math.pow(0.86, k) + raw * (1 - Math.pow(0.86, k));
      if (raw - prevRaw > 0.2 && now - lastRing > 480) {
        rings.push({ t0: now, strong: false });
        lastRing = now;
      }
      rings = rings.filter(function (r) { return now - r.t0 < 700; });

      squishV += -squish * 0.16 * k;
      squishV *= Math.pow(0.88, k);
      squish += squishV * k;
      look.x = lerp(look.x, lookT.x, 1 - Math.pow(0.78, k));
      look.y = lerp(look.y, lookT.y, 1 - Math.pow(0.78, k));
      lean.x = lerp(lean.x, leanT.x, 1 - Math.pow(0.9, k));
      lean.y = lerp(lean.y, leanT.y, 1 - Math.pow(0.9, k));

      // piscada leve
      if (now > nextBlink && now > blinkUntil) {
        blinkUntil = now + 240;
        nextBlink = now + 240 + (Math.random() < 0.18 ? 300 : rand(2200, 6000));
      }
      var openMul = 1;
      if (now < blinkUntil) {
        var bp = 1 - (blinkUntil - now) / 240;
        openMul = 0.05 + 0.95 * (0.5 + 0.5 * Math.cos(2 * Math.PI * bp));
      }
      openMul *= 1 + Math.min(0.26, smoothed * 1.3);

      // alerta de lembrete
      var alerting = now < alertUntil;
      if (alerting) {
        openMul *= 1.14; // olhos arregalados
        action = null;
      }

      // ------- tédio: agenda ações quando tudo está parado -------
      var idle = (now - lastPointerMove > 9000) && smoothed < 0.05 && !alerting;
      if (action && now - action.t0 > action.dur) action = null;
      if (idle && !action && now > nextActionAt) {
        playAction(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
      }
      if (!idle && !action) {
        // adia: só sorteia ação com tudo parado
        nextActionAt = Math.max(nextActionAt, now + 4000);
      }

      // ------- efeitos da ação em curso -------
      var hopY = 0, rotExtra = 0, spinExtra = 0, openOverride = null, actSymbol = null, actSymAlpha = 0;
      if (action) {
        var p = clamp((now - action.t0) / action.dur, 0, 1);
        actSymAlpha = Math.min(1, p / 0.1, (1 - p) / 0.15);
        switch (action.name) {
          case 'hop':
            hopY = -Math.abs(Math.sin(p * Math.PI * 3)) * R * 0.4 * (1 - p * 0.3);
            break;
          case 'spin':
            spinExtra = easeInOut(p) * 2; // duas metades = 360°
            break;
          case 'wiggle':
            rotExtra = Math.sin(p * Math.PI * 9) * 0.1 * (1 - p);
            break;
          case 'lookAround': {
            var seq = [[-0.95, 0.05], [0.92, -0.1], [-0.35, -0.6], [0.05, 0]];
            var idx = Math.min(seq.length - 1, Math.floor(p * seq.length));
            look.x = lerp(look.x, seq[idx][0], 1 - Math.pow(0.8, k));
            look.y = lerp(look.y, seq[idx][1], 1 - Math.pow(0.8, k));
            break;
          }
          case 'sigh':
            openOverride = Math.min(openMul, 0.06 + 0.94 * Math.abs(Math.cos(p * Math.PI)));
            break;
          case 'bored':
            openOverride = Math.min(openMul, 0.45);
            actSymbol = 'dots';
            break;
          case 'nap':
            openOverride = 0.04;
            actSymbol = 'z1';
            break;
        }
      }
      if (openOverride !== null) openMul = openOverride;

      // alerta: pulinhos repetidos
      if (alerting) {
        hopY = -Math.abs(Math.sin(now / 235 * Math.PI)) * R * 0.42;
      }

      // quando a ação termina, agenda a próxima
      if (!action && idle) {
        if (nextActionAt < now) nextActionAt = now + rand(9000, 22000);
      }

      cur = {
        rgb: lerpRgb(from.rgb, to.rgb, pe),
        pe: pe,
        eyesFrom: from.eyes, eyesTo: to.eyes,
        symbolFrom: from.symbol, symbolTo: to.symbol,
      };

      draw(now, cur, openMul, {
        hopY: hopY, rotExtra: rotExtra, spinExtra: spinExtra,
        alerting: alerting, actSymbol: actSymbol, actSymAlpha: actSymAlpha,
      });
    }

    function draw(now, st, openMul, fx2) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);

      var t = now;
      var r = R;
      var cx = SIZE / 2;
      var bob = Math.sin(t / 1000 * 1.7) * 3.2;
      var breathe = 1 + Math.sin(t / 1000 * 1.3) * 0.008;
      var voice = 1 + Math.min(0.1, smoothed * 0.3);

      var th = (turnCur + fx2.spinExtra) * Math.PI;
      var cosT = Math.cos(th);
      var faceA = clamp(cosT * 1.7, 0, 1);
      var backA = clamp(-cosT * 1.7, 0, 1);
      var sxTurn = Math.max(Math.abs(cosT), 0.08);
      var fidget = turnCur > 0.5 && !fx2.alerting ? Math.sin(t / 1000 * 6.5) * 0.04 * (turnCur - 0.5) * 2 : 0;

      var sx = (1 + squish * 0.15) * breathe * voice * sxTurn;
      var sy = (1 - squish * 0.26) * breathe * voice;

      var glow = clamp(smoothed + (fx2.alerting ? 0.25 + 0.15 * Math.sin(t / 160) : 0), 0, 1);
      var symColor = rgba(mixHex(st.rgb, '#ffffff', 0.3), 1);

      ctx.save();
      ctx.translate(cx + lean.x, SIZE / 2 + bob + lean.y + fx2.hopY);
      ctx.rotate(lean.x * 0.0026 + fidget + fx2.rotExtra);

      // aura
      ctx.save();
      var g0 = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * (1.5 + glow * 0.35));
      g0.addColorStop(0, rgba(st.rgb, 0.1 + glow * 0.24));
      g0.addColorStop(1, rgba(st.rgb, 0));
      ctx.fillStyle = g0;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ondas de voz
      for (var i = 0; i < rings.length; i++) {
        var age = (now - rings[i].t0) / 700;
        ctx.beginPath();
        ctx.arc(0, 0, r * (1.12 + age * (rings[i].strong ? 0.9 : 0.6)), 0, Math.PI * 2);
        ctx.strokeStyle = rgba(st.rgb, 0.3 * (1 - age));
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.scale(sx, sy);

      // corpo fosco
      var g1 = ctx.createLinearGradient(0, -r, 0, r);
      g1.addColorStop(0, rgba(mixHex(st.rgb, '#ffffff', 0.14), 1));
      g1.addColorStop(0.55, rgba(st.rgb, 1));
      g1.addColorStop(1, rgba(mixHex(st.rgb, '#000000', 0.12), 1));
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // costas (redemoinho)
      if (backA > 0.02) {
        ctx.save();
        ctx.globalAlpha = backA * 0.35;
        ctx.strokeStyle = EYE;
        ctx.lineWidth = Math.max(1.5, r * 0.035);
        ctx.lineCap = 'round';
        ctx.beginPath();
        var turns = 1.6, stepsN = 40;
        for (var q = 0; q <= stepsN; q++) {
          var ang = q / stepsN * turns * Math.PI * 2 - Math.PI / 2;
          var rad = r * 0.05 + (q / stepsN) * r * 0.13;
          var px = r * 0.08 + Math.cos(ang) * rad;
          var py = -r * 0.18 + Math.sin(ang) * rad;
          if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      var s = r * 0.31;

      // rosto
      if (faceA > 0.02) {
        if (st.pe < 1 && st.eyesFrom !== st.eyesTo) {
          drawEyePair(ctx, st.eyesFrom, (1 - st.pe) * faceA, r, s, openMul, look, t);
          drawEyePair(ctx, st.eyesTo, st.pe * faceA, r, s, openMul, look, t);
        } else {
          drawEyePair(ctx, st.pe < 0.5 ? st.eyesFrom : st.eyesTo, faceA, r, s, openMul, look, t);
        }
      }

      // símbolo do clima
      if (st.pe < 1 && st.symbolFrom !== st.symbolTo) {
        drawSymbol(ctx, st.symbolFrom, 1 - st.pe, faceA, r, symColor, t);
        drawSymbol(ctx, st.symbolTo, st.pe, faceA, r, symColor, t);
      } else {
        drawSymbol(ctx, st.pe < 0.5 ? st.symbolFrom : st.symbolTo, 1, faceA, r, symColor, t);
      }

      // símbolo da ação de tédio (…). z
      if (fx2.actSymbol) {
        drawSymbol(ctx, fx2.actSymbol, fx2.actSymAlpha, faceA, r, symColor, t);
      }

      // "!" do lembrete (por cima de tudo)
      if (fx2.alerting) {
        drawSymbol(ctx, 'bang', 1, 1, r, symColor, t);
      }

      ctx.restore();
    }

    var running = false;
    function frame(now) {
      step(now);
      if (running) requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    step(performance.now());

    return {
      setMood: setState,
      setLevel: setLevel,
      setPointer: setPointer,
      setVelocity: setVelocity,
      alert: alert,
      clearAlert: clearAlert,
      playAction: playAction,
      poke: poke,
      start: start,
      stop: stop,
      step: step,
      get mood() { return moodName; },
      get level() { return smoothed; },
      get speaking() { return smoothed > 0.05; },
      get alerting() { return performance.now() < alertUntil; },
      get action() { return action ? action.name : null; },
    };
  }

  global.PetCore = {
    MOODS: MOODS,
    MOOD_ORDER: MOOD_ORDER,
    ACTIONS: ACTIONS,
    PHRASES: PHRASES,
    createPet: createPet,
    hexToRgb: hexToRgb,
    lerpRgb: lerpRgb,
    clamp: clamp,
  };
})(typeof window !== 'undefined' ? window : globalThis);


/*
 * VoiceModule 🎤 — ouve a sua voz.
 *
 * 1) Nível de áudio (microfone → AnalyserNode → RMS):
 *    alimenta a esfera em tempo real (brilho, pulso, olhos arregalados).
 * 2) Reconhecimento de fala (Web Speech API, quando disponível —
 *    funciona no Chrome/preview; no Electron fica indisponível e é
 *    ignorado sem erro): palavras-chave em pt-BR trocam o clima.
 */
(function (global) {
  'use strict';

  // palavras-chave → clima do Fifo (sem acentos: o texto é normalizado antes)
  var KEYWORDS = [
    { mood: 'triste',     words: ['triste', 'chateado', 'down', 'mal hoje'] },
    { mood: 'estressado', words: ['estressado', 'raiva', 'irritado', 'ansioso', 'nervoso'] },
    { mood: 'cansado',    words: ['cansado', 'exausto', 'com sono', 'esgotado', 'preguica'] },
    { mood: 'vergonha',   words: ['vergonha', 'envergonhad', 'timid'] },
    { mood: 'duvida',     words: ['duvida', 'confus', 'nao sei', 'sera que', 'sei la', 'tanto faz'] },
    { mood: 'animado',    words: ['animado', 'feliz', 'empolgado', 'otimo', 'maravilha', 'consegui'] },
    { mood: 'focado',     words: ['foco', 'focar', 'focad', 'trabalhar', 'produzir', 'projeto', 'deadline'] },
    { mood: 'curioso',    words: ['curioso', 'por que', 'porque', 'interessante', 'aprender'] },
    { mood: 'neutro',     words: ['neutro', 'normal', 'tranquilo', 'calma', 'respira'] },
  ];

  function detectKeyword(text) {
    var t = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (var i = 0; i < KEYWORDS.length; i++) {
      for (var j = 0; j < KEYWORDS[i].words.length; j++) {
        if (t.indexOf(KEYWORDS[i].words[j]) !== -1) return KEYWORDS[i].mood;
      }
    }
    return null;
  }

  /**
   * @param {object} handlers
   *   onLevel(rms 0..1)  — chamado a cada frame com o volume da voz
   *   onMoodWord(mood)   — chamado quando o reconhecimento de fala acha uma palavra-chave
   *   onHeard(text)      — chamado com a transcrição (debug/legenda)
   *   onStatus({mic, speech}) — estado dos sensores
   */
  function createVoice(handlers) {
    handlers = handlers || {};
    var audioCtx = null, analyser = null, dataArr = null, stream = null;
    var recognition = null;
    var running = false;

    function emitStatus() {
      if (handlers.onStatus) {
        handlers.onStatus({ mic: !!analyser, speech: !!recognition });
      }
    }

    // ---------- nível do microfone ----------
    async function enableMic() {
      if (analyser) return true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        var AC = global.AudioContext || global.webkitAudioContext;
        audioCtx = new AC();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        var src = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        src.connect(analyser);
        dataArr = new Uint8Array(analyser.fftSize);
        running = true;
        requestAnimationFrame(poll);
        emitStatus();
        return true;
      } catch (err) {
        console.warn('[fifo] microfone indisponível:', err && err.message);
        analyser = null;
        emitStatus();
        return false;
      }
    }

    function poll() {
      if (!running || !analyser) return;
      analyser.getByteTimeDomainData(dataArr);
      // RMS normalizado 0..1
      var sum = 0;
      for (var i = 0; i < dataArr.length; i++) {
        var v = (dataArr[i] - 128) / 128;
        sum += v * v;
      }
      var rms = Math.sqrt(sum / dataArr.length);
      if (handlers.onLevel) handlers.onLevel(Math.min(1, rms * 3.2));
      requestAnimationFrame(poll);
    }

    // ---------- reconhecimento de fala (opcional) ----------
    function enableSpeech() {
      var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
      if (!SR) { emitStatus(); return false; }
      try {
        recognition = new SR();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = function (ev) {
          var text = '';
          for (var i = ev.resultIndex; i < ev.results.length; i++) {
            text += ev.results[i][0].transcript;
          }
          if (handlers.onHeard) handlers.onHeard(text);
          var mood = detectKeyword(text);
          if (mood && handlers.onMoodWord) handlers.onMoodWord(mood);
        };
        recognition.onerror = function (e) {
          // 'no-speech' e 'aborted' são normais em modo contínuo
          if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn('[fifo] speech error:', e.error);
          }
        };
        recognition.onend = function () {
          // modo contínuo: religa sozinho
          if (running) { try { recognition.start(); } catch (_) {} }
        };
        recognition.start();
        emitStatus();
        return true;
      } catch (err) {
        recognition = null;
        emitStatus();
        return false;
      }
    }

    function stopAll() {
      running = false;
      if (recognition) { try { recognition.stop(); } catch (_) {} }
      if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); });
      if (audioCtx) audioCtx.close();
      analyser = null; stream = null; audioCtx = null;
      emitStatus();
    }

    emitStatus();
    return { enableMic: enableMic, enableSpeech: enableSpeech, stop: stopAll };
  }

  global.VoiceModule = { createVoice: createVoice, detectKeyword: detectKeyword, KEYWORDS: KEYWORDS };
})(typeof window !== 'undefined' ? window : globalThis);


  var SIZE = 240;
  var STYLE_ID = 'fifo-pet-style';
  var CSS = '' +
    '.fifopet-root{position:fixed;inset:0;pointer-events:none;z-index:2147483000;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    '.fifopet-pet{position:absolute;top:0;left:0;width:' + SIZE + 'px;height:' + SIZE + 'px;will-change:transform}' +
    '.fifopet-pet canvas{display:block;width:' + SIZE + 'px;height:' + SIZE + 'px;pointer-events:none}' +
    '.fifopet-bubble{position:absolute;top:-4px;left:50%;transform:translate(-50%,6px);max-width:210px;' +
    'background:#16181c;border:1px solid #2f3336;color:#e7e9ea;font-size:12.5px;line-height:1.45;' +
    'padding:9px 13px;border-radius:14px;opacity:0;pointer-events:none;transition:.25s;white-space:pre-wrap}' +
    '.fifopet-bubble.show{opacity:1;transform:translate(-50%,0)}' +
    '.fifopet-micbtn{position:fixed;right:16px;bottom:16px;pointer-events:auto;background:#0d0f12;' +
    'border:1px solid #2f3336;color:#e7e9ea;border-radius:99px;padding:8px 14px;font-size:12.5px;' +
    'cursor:pointer;font-family:inherit}' +
    '.fifopet-micbtn:disabled{opacity:.6;cursor:default}';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  class FifoPetElement extends HTMLElement {
    connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      ensureStyle();
      this._build();
    }

    _build() {
      var self = this;

      // ---------- DOM ----------
      var root = document.createElement('div');
      root.className = 'fifopet-root';
      var petBox = document.createElement('div');
      petBox.className = 'fifopet-pet';
      var bubble = document.createElement('div');
      bubble.className = 'fifopet-bubble';
      var canvas = document.createElement('canvas');
      var DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = SIZE * DPR;
      canvas.height = SIZE * DPR;
      petBox.appendChild(bubble);
      petBox.appendChild(canvas);
      root.appendChild(petBox);
      document.body.appendChild(root);
      this._root = root;

      var pet = PetCore.createPet(canvas, { size: SIZE, dpr: DPR });
      this._pet = pet;
      pet.start();
      if (this.getAttribute('mood')) pet.setMood(this.getAttribute('mood'));

      var bubbleTimer = null;
      function say(text, ms) {
        bubble.textContent = text;
        bubble.classList.add('show');
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, ms || 4200);
      }
      this._say = say;

      // ---------- seguir o mouse na página ----------
      var pos = { x: window.innerWidth * 0.7, y: window.innerHeight * 0.5 };
      var mouse = { x: pos.x, y: pos.y };
      var mouseStill = Date.now();
      var wander = null;
      var raf = 0;

      function overSphere(x, y) {
        var dx = x - pos.x, dy = y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < SIZE * 0.36;
      }

      window.addEventListener('mousemove', function (e) {
        if (Math.abs(e.clientX - mouse.x) > 2 || Math.abs(e.clientY - mouse.y) > 2) {
          mouseStill = Date.now();
          wander = null;
        }
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        // click-through: o canvas só captura quando o cursor está em cima
        canvas.style.pointerEvents = overSphere(e.clientX, e.clientY) ? 'auto' : 'none';
      });

      function loop() {
        var target;
        if (Date.now() - mouseStill > 6000) {
          if (!wander || Date.now() > wander.until) {
            wander = {
              x: mouse.x + (Math.random() * 2 - 1) * 260,
              y: mouse.y + (Math.random() * 2 - 1) * 180,
              until: Date.now() + 2400 + Math.random() * 2600,
            };
          }
          target = wander;
        } else {
          target = { x: mouse.x + 100, y: mouse.y + 78 };
        }
        var vx = (target.x - pos.x) * 0.085;
        var vy = (target.y - pos.y) * 0.085;
        pos.x = Math.max(130, Math.min(window.innerWidth - 130, pos.x + vx));
        pos.y = Math.max(140, Math.min(window.innerHeight - 130, pos.y + vy));
        petBox.style.transform = 'translate(' + (pos.x - SIZE / 2) + 'px,' + (pos.y - SIZE / 2) + 'px)';
        pet.setPointer(mouse.x - pos.x, mouse.y - pos.y, Date.now() - mouseStill < 250);
        pet.setVelocity(vx, vy);
        raf = requestAnimationFrame(loop);
      }
      loop();
      this._stopLoop = function () { cancelAnimationFrame(raf); };

      // ---------- interações ----------
      canvas.addEventListener('click', function () {
        if (pet.alerting) {
          pet.clearAlert();
          say('📌 Lembrete visto! Bom te ver de volta.');
        } else {
          say(pet.poke());
        }
      });
      canvas.addEventListener('dblclick', function () {
        var order = PetCore.MOOD_ORDER;
        self.setMood(order[(order.indexOf(pet.mood) + 1) % order.length]);
      });

      // ---------- lembretes ----------
      var reminders = [];
      this._reminders = reminders;
      this._rmTimer = setInterval(function () {
        var now = Date.now();
        for (var i = reminders.length - 1; i >= 0; i--) {
          if (reminders[i].dueAt <= now) {
            var r = reminders.splice(i, 1)[0];
            pet.alert(12000);
            say('📌 ' + r.text + '\n(clique na esfera pra dispensar)', 12000);
            self.dispatchEvent(new CustomEvent('fifo-reminder', { detail: { text: r.text } }));
          }
        }
      }, 400);

      // ---------- microfone (opcional, precisa de gesto) ----------
      this._voice = VoiceModule.createVoice({
        onLevel: function (rms) { pet.setLevel(rms); },
        onMoodWord: function (m) { self.setMood(m); },
      });
      if (this.hasAttribute('mic-button')) {
        var btn = document.createElement('button');
        btn.className = 'fifopet-micbtn';
        btn.textContent = '🎤 liberar voz';
        btn.addEventListener('click', function () {
          self.enableMic();
          btn.textContent = '🎤 voz ativa';
          btn.disabled = true;
        });
        root.appendChild(btn);
      }
    }

    disconnectedCallback() {
      if (this._stopLoop) this._stopLoop();
      if (this._rmTimer) clearInterval(this._rmTimer);
      if (this._voice) this._voice.stop();
      if (this._root && this._root.parentNode) this._root.parentNode.removeChild(this._root);
    }

    // ---------- API pública ----------
    setMood(m) { this._pet.setMood(m); }
    remind(text, seconds) {
      this._reminders.push({
        text: String(text || 'lembrete'),
        dueAt: Date.now() + (seconds || 60) * 1000,
      });
    }
    enableMic() {
      var self = this;
      this._voice.enableMic().then(function (ok) { if (ok) self._voice.enableSpeech(); });
    }
    poke() { this._say(this._pet.poke()); }
    /** Balão de fala direto (sem alerta). */
    say(text, ms) { this._say(String(text == null ? '' : text), ms); }
    /** Chama atenção: pula com "!" + balão até clicar (ou expirar). */
    alert(text, ms) {
      var d = ms || 12000;
      this._pet.alert(d);
      this._say('📌 ' + text + '\n(clique na esfera pra dispensar)', d);
    }
  }

  customElements.define('fifo-pet', FifoPetElement);
})();
