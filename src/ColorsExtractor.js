import ColorsGroup from './ColorsGroup'

export default class ColorsExtractor {
  constructor (image, {
    pixels = 10000,
    distance = 150,
    saturationImportance = 5,
    splitPower = 10,
    colorValidator = (red, green, blue, alpha = 255) => alpha > 250
  } = {}) {
    this.pixels = pixels
    this.splitPower = splitPower
    this.distance = distance
    this.saturationImportance = saturationImportance
    this.colorValidator = colorValidator
  }

  process (data) {
    const store = new ColorsGroup()
    const acc = this.splitPower
    let group

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] // 0 -> 255
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if (this.colorValidator(r, g, b, a)) {
        const real = r << 16 | g << 8 | b
        const medium = (r >> 4 & 0xF) << 2 | (g >> 4 & 0xF) << 1 | (b >> 4 & 0xF)
        const small = Math.round(r * (acc - 1) / 255) * (acc * acc) + Math.round(g * (acc - 1) / 255) * acc + Math.round(b * (acc - 1) / 255)

        group = store.addGroup(small)
        group = group.addGroup(medium)
        group.addColor(real, r, g, b)
      }
    }

    return store.getColors(this.distance, this.saturationImportance)
  }

  extract (image) {
    const currentPixels = image.width * image.height
    const width = currentPixels < this.pixels ? image.width : Math.round(image.width * Math.sqrt(this.pixels / currentPixels))
    const height = currentPixels < this.pixels ? image.height : Math.round(image.height * Math.sqrt(this.pixels / currentPixels))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height)

    const imageData = context.getImageData(0, 0, width, height)

    return this.process(imageData.data)
      .map(color => ({
        hex: '#' + '0'.repeat(6 - color.hex.toString(16).length) + color.hex.toString(16),
        red: color.red,
        green: color.green,
        blue: color.blue,
        area: color.count / this.pixels,
        saturation: color.saturation / 0xFF
      }))
  }
}