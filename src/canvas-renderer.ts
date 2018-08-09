import Renderer from './renderer'

class CanvasRenderer implements Renderer {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private width: number
  private height: number
  private cellSize: number
  private bgColor = 'black'
  private fgColor = 'white'
  private draws = 0

  constructor(canvas: HTMLCanvasElement, width: number, height: number, cellSize: number) {
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('missing context')
    }
    this.canvas = canvas
    this.context = context
    this.width = width
    this.height = height
    this.cellSize = cellSize
  }

  private clear() {
    this.context.clearRect(0, 0, this.width * this.cellSize, this.height * this.cellSize)
  }

  public render(display: number[]) {
    this.clear()

    for (let index = 0; index < display.length; index++) {
      const x = (index % this.width) * this.cellSize
      const y = Math.floor(index / this.width) * this.cellSize
      this.context.fillStyle = [this.bgColor, this.fgColor][display[index]]
      this.context.fillRect(x, y, this.cellSize, this.cellSize)
    }

    this.draws++
  }

  public beep() {
    console.error('wip beep')
  }
}

export default CanvasRenderer
