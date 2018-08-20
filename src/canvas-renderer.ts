import Renderer from './renderer'
import Chip8 from './chip8'

class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private width: number
  private height: number
  private renderWidth: number
  private renderHeight: number
  private scale: number
  private bgColor = 'black'
  private fgColor = 'red'
  private draws = 0

  constructor(canvas: HTMLCanvasElement, chip8: Chip8, scale: number = 10) {
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('missing context')
    }
    this.canvas = canvas
    this.context = context
    this.width = chip8.getDisplayWidth()
    this.height = chip8.getDisplayHeight()
    this.scale = scale
    this.renderWidth = this.width * scale
    this.renderHeight = this.height * scale
    this.canvas.height = this.renderHeight
    this.canvas.width = this.renderWidth
    chip8.setRenderer(this)
  }

  private clear() {
    this.context.clearRect(0, 0, this.renderWidth, this.renderHeight)
  }

  public render(display: number[]) {
    this.clear()

    for (let index = 0; index < display.length; index++) {
      const x = (index % this.width) * this.scale
      const y = Math.floor(index / this.width) * this.scale
      this.context.fillStyle = [this.bgColor, this.fgColor][display[index]]
      this.context.fillRect(x, y, this.scale, this.scale)
    }

    this.draws++
  }

  public beep() {
    console.error('wip beep')
  }
}

export default CanvasRenderer
