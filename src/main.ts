import Chip8 from './chip8'
import CanvasRenderer from './canvas-renderer'

const renderArea = document.getElementById('render-area')
if (!renderArea) throw new Error(`missing 'render-area' element`)

const canvas = document.createElement('canvas')
canvas.style.border = '4px solid lightgray'
renderArea.appendChild(canvas)

const chip8 = new Chip8()
new CanvasRenderer(canvas, chip8, 20)

const cycle = () => {
  requestAnimationFrame(() => {
    chip8.cycle()
    cycle()
  })
}
cycle()

const keyMap: { [key: number]: number } = {
  49: 0x1, // 1
  50: 0x2, // 2
  51: 0x3, // 3
  81: 0x4, // 4
  87: 0x5, // Q
  69: 0x6, // W
  52: 0x7, // E
  82: 0x8, // R
  65: 0x9, // A
  83: 0xA, // S
  68: 0xB, // D
  70: 0xC, // F
  90: 0xD, // Z
  88: 0xE, // X
  67: 0xF, // C
  86: 0x10 // V
}

addEventListener('keydown', (ev) => {
  console.log(ev.keyCode)
  chip8.setKey(keyMap[ev.keyCode])
})

addEventListener('keyup', (ev) => {
  chip8.unsetKey(keyMap[ev.keyCode])
})

const xhr = new XMLHttpRequest()
xhr.open('GET', 'roms/INVADERS', true)
xhr.responseType = 'arraybuffer'
xhr.onload = () => {
  chip8.load(new Uint8Array(xhr.response))
}
xhr.send()
