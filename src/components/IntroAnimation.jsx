import { useEffect, useRef, useState } from 'react'

// A ~5 second 8-bit cartoon: a dad and his 5-year-old daughter on the couch
// watching a movie together. Rendered on a tiny 200x125 canvas and scaled up
// with pixelated image-rendering for a crisp retro look. Plays on every open.

const W = 200
const H = 125
const DURATION = 5000

// --- palette ---------------------------------------------------------------
const C = {
  wall: '#241b3a',
  wallLo: '#1b1430',
  floor: '#37294a',
  floorLo: '#2c2140',
  rug: '#5a3a6a',
  couch: '#7a3b52',
  couchLo: '#5e2d40',
  couchHi: '#8f4a63',
  tv: '#23232c',
  tvLo: '#16161d',
  stand: '#3a3444',
  skin: '#e8b98f',
  skinLo: '#d49b70',
  dadHair: '#3d2a17',
  dadShirt: '#3f6fae',
  dadShirtLo: '#315a92',
  dadLeg: '#28324d',
  girlHair: '#7a4a22',
  girlDress: '#e267a0',
  girlDressHi: '#f487ba',
  girlLeg: '#e8b98f',
  bucket: '#d64b4b',
  bucketHi: '#ffffff',
  corn: '#f4dd8c',
  moon: '#f6e9ad',
  star: '#fdfcf0',
  lamp: '#f7cf6b',
}

// Movie "frames" shown on the TV, cycled to feel like a film is playing.
function drawScreen(ctx, x, y, w, h, frame, t) {
  const px = (dx, dy, dw, dh, col) => { ctx.fillStyle = col; ctx.fillRect(x + dx, y + dy, dw, dh) }
  switch (frame) {
    case 0: // sunny adventure
      px(0, 0, w, h, '#7ec8f0')
      px(0, h - 6, w, 6, '#5fae5a')
      px(w - 10, 3, 5, 5, '#ffe36b') // sun
      px(6, h - 10, 4, 6, '#4a8a4a') // tree
      break
    case 1: // space
      px(0, 0, w, h, '#0d0b2a')
      px(4, 4, 1, 1, '#fff'); px(w - 8, 6, 1, 1, '#fff'); px(10, h - 6, 1, 1, '#fff'); px(w - 5, h - 9, 1, 1, '#fff')
      { const ry = 4 + ((Math.floor(t / 120)) % (h - 8)) // rocket rising
        px(w / 2 - 1, h - ry, 3, 5, '#e6e6ee'); px(w / 2 - 1, h - ry + 5, 3, 2, '#ff8a3a') }
      break
    case 2: // fiery action
      px(0, 0, w, h, '#2a0d0d')
      px(w / 2 - 6, h / 2 - 5, 12, 10, '#ff7a2a')
      px(w / 2 - 3, h / 2 - 3, 6, 6, '#ffe36b')
      break
    case 3: // romance night
      px(0, 0, w, h, '#3a2350')
      px(6, 4, 5, 5, '#f6e9ad')
      px(3, h - 5, w - 6, 5, '#241238')
      break
    default: // green hills
      px(0, 0, w, h, '#8fd0ff')
      px(0, h - 8, w, 8, '#6ab85f')
      px(0, h - 4, w, 4, '#4f9a48')
  }
  // scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.14)'
  for (let sy = 0; sy < h; sy += 2) ctx.fillRect(x, y + sy, w, 1)
}

function drawScene(ctx, t) {
  const px = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h) }

  // --- room ---
  px(0, 0, W, 100, C.wall)
  px(0, 0, W, 6, C.wallLo)
  px(0, 100, W, H - 100, C.floor)
  px(0, 100, W, 3, C.floorLo)

  // window with moon + stars (top-left)
  px(12, 12, 34, 26, C.wallLo)
  px(14, 14, 30, 22, '#0f1430')
  px(30, 18, 7, 7, C.moon)
  const twinkle = Math.floor(t / 300) % 2 === 0
  px(18, 20, 1, 1, C.star)
  if (twinkle) px(24, 30, 1, 1, C.star)
  px(40, 28, 1, 1, C.star)
  px(28, 22, 1, 1, twinkle ? C.star : C.wallLo)

  // --- TV on stand (left, facing right) ---
  const tvX = 14, tvY = 52, tvW = 46, tvH = 34
  px(tvX - 2, tvY - 2, tvW + 4, tvH + 4, C.tvLo)
  px(tvX - 2, tvY - 2, tvW + 4, tvH + 4, C.tv)
  px(tvX + 26, tvY + tvH + 2, 6, 6, C.stand) // stand neck
  px(tvX + 12, tvY + tvH + 8, 34, 4, C.stand) // stand base
  const frame = Math.floor(t / 720) % 5
  drawScreen(ctx, tvX, tvY, tvW, tvH, frame, t)

  // --- TV light cone onto the couch (pulsing) ---
  const pulse = 0.10 + 0.06 * Math.sin(t / 180)
  ctx.fillStyle = `rgba(255,238,190,${pulse})`
  ctx.beginPath()
  ctx.moveTo(tvX + tvW, tvY + 4)
  ctx.lineTo(tvX + tvW, tvY + tvH)
  ctx.lineTo(W - 6, 96)
  ctx.lineTo(W - 6, 60)
  ctx.closePath()
  ctx.fill()

  // --- rug ---
  px(70, 104, 120, 8, C.rug)

  // --- couch (right) ---
  const cx = 108, cy = 66
  px(cx, cy, 84, 30, C.couchLo)      // back
  px(cx, cy + 8, 84, 22, C.couch)    // seat block
  px(cx - 4, cy + 6, 8, 26, C.couchHi) // left arm
  px(cx + 80, cy + 6, 8, 26, C.couchHi) // right arm
  px(cx, cy + 28, 84, 6, C.couchLo)  // base shadow

  // --- DAD (sits left on couch) ---
  const dblink = Math.floor(t / 1600) % 8 === 0
  const dx = 118, dy = 54
  // legs
  px(dx + 2, dy + 34, 8, 8, C.dadLeg)
  px(dx + 12, dy + 34, 8, 8, C.dadLeg)
  // body
  px(dx, dy + 18, 22, 18, C.dadShirt)
  px(dx, dy + 18, 22, 3, C.dadShirtLo)
  // arm around daughter (right side), slight bob
  const armBob = Math.sin(t / 400) > 0.6 ? 1 : 0
  px(dx + 20, dy + 20 + armBob, 12, 5, C.dadShirt)
  // head
  px(dx + 4, dy + 4, 14, 14, C.skin)
  px(dx + 4, dy + 16, 14, 2, C.skinLo)
  // hair
  px(dx + 3, dy + 2, 16, 5, C.dadHair)
  px(dx + 3, dy + 5, 3, 6, C.dadHair)
  // eyes (blink)
  if (dblink) { px(dx + 8, dy + 10, 2, 1, C.skinLo); px(dx + 13, dy + 10, 2, 1, C.skinLo) }
  else { px(dx + 8, dy + 9, 2, 2, '#1a1a1a'); px(dx + 13, dy + 9, 2, 2, '#1a1a1a') }
  // smile
  px(dx + 9, dy + 13, 5, 1, C.skinLo)

  // --- DAUGHTER (5 yr old, sits right, bounces with excitement) ---
  const bounce = Math.abs(Math.sin(t / 260)) > 0.75 ? -2 : 0
  const gx = 150, gy = 62 + bounce
  const gblink = Math.floor(t / 1300) % 7 === 0
  // legs (little, dangling/swinging)
  const swing = Math.sin(t / 220) > 0 ? 1 : -1
  px(gx + 3, gy + 26, 4, 7, C.girlLeg)
  px(gx + 9 + swing, gy + 26, 4, 7, C.girlLeg)
  // dress
  px(gx + 1, gy + 16, 14, 12, C.girlDress)
  px(gx + 1, gy + 16, 14, 2, C.girlDressHi)
  px(gx, gy + 24, 16, 4, C.girlDress) // dress flare
  // arm raised when excited
  const raise = Math.sin(t / 260) > 0.75
  if (raise) px(gx + 13, gy + 8, 4, 8, C.skin)
  else px(gx + 13, gy + 17, 4, 6, C.skin)
  // head
  px(gx + 2, gy + 3, 12, 12, C.skin)
  px(gx + 2, gy + 13, 12, 2, C.skinLo)
  // hair with ponytail
  px(gx + 1, gy + 1, 14, 4, C.girlHair)
  px(gx + 1, gy + 4, 2, 6, C.girlHair)
  px(gx + 13, gy + 4, 2, 6, C.girlHair)
  px(gx + 15, gy + 3, 3, 4, C.girlHair) // ponytail
  px(gx + 6, gy, 4, 2, C.girlDressHi)   // little bow
  // eyes
  if (gblink) { px(gx + 5, gy + 8, 2, 1, C.skinLo); px(gx + 9, gy + 8, 2, 1, C.skinLo) }
  else { px(gx + 5, gy + 7, 2, 2, '#1a1a1a'); px(gx + 9, gy + 7, 2, 2, '#1a1a1a') }
  // big smile
  px(gx + 5, gy + 11, 6, 1, '#c0553a')

  // --- popcorn bucket between them ---
  const bx = 138, by = 84
  px(bx, by, 12, 12, C.bucket)
  px(bx, by, 12, 12, C.bucket)
  px(bx + 2, by, 2, 12, C.bucketHi)
  px(bx + 7, by, 2, 12, C.bucketHi)
  px(bx - 1, by - 3, 14, 4, C.corn) // popped tops
  px(bx + 1, by - 5, 3, 3, C.corn)
  px(bx + 6, by - 6, 3, 3, C.corn)
  // a kernel tossed up in an arc (loops)
  const kt = (t % 1400) / 1400
  const ky = by - 6 - Math.sin(kt * Math.PI) * 20
  const kx = bx + 6 + kt * 6
  px(Math.round(kx), Math.round(ky), 2, 2, C.corn)

  // --- floor lamp (right edge) ---
  px(190, 40, 3, 60, C.stand)
  px(186, 34, 11, 8, C.lamp)
  ctx.fillStyle = 'rgba(247,207,107,0.10)'
  ctx.fillRect(180, 42, 20, 40)

  // --- overall warm vignette so the TV glow reads ---
  const g = ctx.createRadialGradient(70, 68, 10, 100, 62, 150)
  g.addColorStop(0, 'rgba(255,236,180,0.05)')
  g.addColorStop(1, 'rgba(6,4,14,0.30)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

export default function IntroAnimation({ onDone }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const startRef = useRef(0)
  const [phase, setPhase] = useState('play') // play -> title -> exit

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    let done = false

    const loop = (now) => {
      if (!startRef.current) startRef.current = now
      const t = now - startRef.current
      ctx.clearRect(0, 0, W, H)
      drawScene(ctx, t)

      // fade in first 400ms
      if (t < 400) {
        ctx.fillStyle = `rgba(6,4,14,${1 - t / 400})`
        ctx.fillRect(0, 0, W, H)
      }
      if (t >= 4100 && phase === 'play') setPhase('title')

      if (t >= DURATION && !done) {
        done = true
        setPhase('exit')
        setTimeout(() => onDone && onDone(), 480)
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const skip = () => {
    cancelAnimationFrame(rafRef.current)
    setPhase('exit')
    setTimeout(() => onDone && onDone(), 200)
  }

  return (
    <div className={`intro ${phase === 'exit' ? 'intro--exit' : ''}`} role="dialog" aria-label="CineMatch intro">
      <div className="intro__frame">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="intro__canvas"
          aria-hidden="true"
        />
        <div className={`intro__title ${phase === 'title' || phase === 'exit' ? 'is-shown' : ''}`}>
          <span className="intro__logo">CineMatch</span>
          <span className="intro__tag">Movie night, sorted.</span>
        </div>
      </div>
      <button className="intro__skip" onClick={skip} aria-label="Skip intro">
        Skip ›
      </button>
    </div>
  )
}
