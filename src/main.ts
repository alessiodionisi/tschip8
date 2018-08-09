import Chip8 from './chip8'
import CanvasRenderer from './canvas-renderer';

const renderArea = document.getElementById('render-area')
if (!renderArea) throw new Error(`missing 'render-area' element`)

const canvas = document.createElement('canvas')
// canvas.style.border = '1px solid black'
renderArea.appendChild(canvas)

const chip8 = new Chip8()
const cellSize = 8

canvas.width = chip8.getDisplayWidth() * cellSize
canvas.height = chip8.getDisplayHeight() * cellSize

const canvasRenderer = new CanvasRenderer(canvas, chip8.getDisplayWidth(), chip8.getDisplayHeight(), cellSize)

chip8.setRenderer(canvasRenderer)

const xhr = new XMLHttpRequest()
xhr.open('GET', '/roms/tetris', true)
xhr.responseType = 'arraybuffer'
xhr.onload = () => {
  chip8.load(new Uint8Array(xhr.response))
}
xhr.send()
