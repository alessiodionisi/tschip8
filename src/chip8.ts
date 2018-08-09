import Renderer from './renderer'

class Chip8 {
  private displayWidth = 64
  private displayHeight = 32
  private display: number[] = new Array(this.displayWidth * this.displayHeight)

  private memory = new Uint8Array(0x1000)
  private v: number[] = new Array(16)
  private i = 0
  private stack: number[] = new Array(16)
  
  private sp = 0
  private pc = 0

  private delayTimer = 0
  private soundTimer = 0

  private step = 0
  private running = false

  private drawFlag = false
  private renderer?: Renderer
  private keys: { [key: number]: boolean } = {}

  constructor() {
    this.reset()
  }

  public getDisplayWidth() {
    return this.displayWidth
  }

  public getDisplayHeight() {
    return this.displayHeight
  }

  public load(data: Uint8Array) {
    this.stop()
    this.reset()

    for (let index = 0; index < data.length; index++) {
      this.memory[index + 0x200] = data[index]
    }

    this.start()
  }

  public reset() {
    for (let index = 0; index < this.memory.length; index++) {
      this.memory[index] = 0
    }

    const hexChars = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80 // F
    ]

    for (let index = 0; index < hexChars.length; index++) {
      this.memory[index] = hexChars[index]
    }

    for (let index = 0; index < this.v.length; index++) {
      this.v[index] = 0
    }

    this.resetDisplay()

    this.sp = 0
    this.i = 0

    this.pc = 0x200

    this.delayTimer = 0
    this.soundTimer = 0

    this.step = 0
    this.running = false
  }

  private resetDisplay() {
    for (let index = 0; index < this.display.length; index++) {
      this.display[index] = 0
    }
  }

  public start() {
    const renderer = this.renderer
    if (!renderer) {
      throw new Error('missing renderer')
    }

    this.running = true

    const cycleLoop = () => {
      for (let index = 0; index < 10; index++) {
        if (this.running) {
          this.cycle()
        }
      }

      if (this.drawFlag) {
        (renderer as any).render(this.display)
        this.drawFlag = false
      }

      if (!(this.step++ % 2)) {
        this.timers()
      }

      requestAnimationFrame(cycleLoop)
    }

    requestAnimationFrame(cycleLoop)
  }

  private timers() {
    if (this.delayTimer > 0) {
      this.delayTimer--
    }

    if (this.soundTimer > 0) {
      if (this.soundTimer == 1) {
        (this.renderer as any).beep()
      }
      this.soundTimer--
    }
  }

  public stop() {
    this.running = false
  }

  public setRenderer(renderer: Renderer) {
    this.renderer = renderer
  }

  private setPixel(x: number, y: number) {
    if (x > this.displayWidth) {
      x -= this.displayWidth
    } else if (x < 0) {
        x += this.displayWidth
    }

    if (y > this.displayHeight) {
        y -= this.displayHeight
    } else if (y < 0) {
        y += this.displayHeight
    }

    const location = x + (y * this.displayWidth)
    this.display[location] ^= 1
    return !this.display[location]
  }

  private cycle() {
    const opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1]
    const x = (opcode & 0x0F00) >> 8
    const y = (opcode & 0x00F0) >> 4

    this.pc += 2

    switch (opcode & 0xf000) {
      case 0x0000:
        switch (opcode) {
          // CLS
          case 0x00E0:
            this.resetDisplay()
            break
          // RET
          case 0x00EE:
            this.pc = this.stack[--this.sp]
            break
        }
        break
      // JP addr
      case 0x1000:
        this.pc = opcode & 0xFFF
        break
      // CALL addr
      case 0x2000:
        this.stack[this.sp] = this.pc
        this.sp++
        this.pc = opcode & 0x0FFF
        break
      // SE Vx, byte
      case 0x3000:
        if (this.v[x] === (opcode & 0xFF)) {
          this.pc += 2
        }
        break
      // SNE Vx, byte
      case 0x4000:
        if (this.v[x] != (opcode & 0x00FF)) {
          this.pc += 2
        }
        break
      // SE Vx, Vy
      case 0x5000:
        if (this.v[x] === this.v[y]) {
          this.pc += 2
        }
        break
      // LD Vx, byte
      case 0x6000:
        this.v[x] = opcode & 0xFF
        break
      // ADD Vx, byte
      case 0x7000:
        let val = (opcode & 0xFF) + this.v[x]
        if (val > 255) {
          val -= 256
        }
        this.v[x] = val
        break
      case 0x8000:
        switch (opcode & 0x000f) {
          // LD Vx, Vy
          case 0x0000:
            this.v[x] = this.v[y]
            break
          // OR Vx, Vy
          case 0x0001:
            this.v[x] |= this.v[y]
            break
          // AND Vx, Vy
          case 0x0002:
            this.v[x] &= this.v[y]
            break
          // XOR Vx, Vy
          case 0x0003:
            this.v[x] ^= this.v[y]
            break
          // ADD Vx, Vy
          case 0x0004:
            this.v[x] += this.v[y]
            this.v[0xF] = +(this.v[x] > 255)
            if (this.v[x] > 255) {
              this.v[x] -= 256
            }
            break
          // SUB Vx, Vy
          case 0x0005:
            this.v[0xF] = +(this.v[x] > this.v[y])
            this.v[x] -= this.v[y]
            if (this.v[x] < 0) {
              this.v[x] += 256
            }
            break
          // SHR Vx, Vy
          case 0x0006:
            this.v[0xF] = this.v[x] & 0x1
            this.v[x] >>= 1
            break
          // SUBN Vx, Vy
          case 0x0007:
            this.v[0xF] = +(this.v[y] > this.v[x])
            this.v[x] = this.v[y] - this.v[x]
            if (this.v[x] < 0) {
              this.v[x] += 256
            }
            break
          // SHL Vx, Vy
          case 0x000E:
            this.v[0xF] = +(this.v[x] & 0x80)
            this.v[x] <<= 1
            if (this.v[x] > 255) {
              this.v[x] -= 256
            }
            break
        }
        break
      // SNE Vx, Vy
      case 0x9000:
        if (this.v[x] != this.v[y]) {
          this.pc += 2
        }
        break
      // LD I, addr
      case 0xA000:
        this.i = opcode & 0xFFF
        break
      // JP V0, addr
      case 0xB000:
        this.pc = (opcode & 0xFFF) + this.v[0]
        break
      // RND Vx, byte
      case 0xC000:
        this.v[x] = Math.floor(Math.random() * 0xFF) & (opcode & 0xFF)
        break
      // DRW Vx, Vy, nibble
      case 0xD000:
        this.v[0xF] = 0;

        const height = opcode & 0x000F
        const registerX = this.v[x]
        const registerY = this.v[y]

        for (let y = 0; y < height; y++) {
          let spr = this.memory[this.i + y]
          for (let x = 0; x < 8; x++) {
            if ((spr & 0x80) > 0) {
              if (this.setPixel(registerX + x, registerY + y)) {
                this.v[0xF] = 1
              }
            }
            spr <<= 1
          }
        }
        this.drawFlag = true
        break
      case 0xE000:
        switch (opcode & 0x00FF) {
          // SKP Vx
          case 0x009E:
            if (this.keys[this.v[x]]) {
              this.pc += 2
            }
            break
          // SKNP Vx
          case 0x00A1:
            if (!this.keys[this.v[x]]) {
              this.pc += 2
            }
            break
        }
        break
      case 0xF000:
        switch (opcode & 0x00FF) {
          // LD Vx, DT
          case 0x0007:
            this.v[x] = this.delayTimer
            break
          // LD Vx, K
          case 0x000A:
            console.error(`wip opcode ${opcode.toString(16)}`)
            // var oldKeyDown = this.setKey
            // this.setKey = (key) => {
            //   this.v[x] = key
            //   this.setKey = oldKeyDown.bind(self)
            //   this.setKey.apply(self, arguments)
            //   this.start()
            // }
            // this.stop()
            return
          // LD DT, Vx
          case 0x0015:
            this.delayTimer = this.v[x]
            break
          // LD ST, Vx
          case 0x0018:
            this.soundTimer = this.v[x]
            break
          // ADD I, Vx
          case 0x001E:
            this.i += this.v[x]
            break
          // LD F, Vx
          case 0x0029:
            // Multiply by number of rows per character.
            this.i = this.v[x] * 5
            break
          // LD B, Vx
          case 0x0033:
            let number = this.v[x]
            for (let index = 3; index > 0; index--) {
              this.memory[this.i + index - 1] = number % 10
              number /= 10
            }
            break
          // LD [I], Vx
          case 0x0055:
            for (let index = 0; index <= x; index++) {
              this.memory[this.i + index] = this.v[index]
            }
            break
          // LD Vx, [I]
          case 0x0065:
            for (let index = 0; index <= x; index++) {
              this.v[index] = this.memory[this.i + index]
            }
            break
        }
        break
      default:
        console.error(`unknown opcode ${opcode.toString(16)}`)
        break
    }
  }
}

export default Chip8
