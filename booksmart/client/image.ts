import { format_byte } from '@beenotung/tslib/format.js'
import {
  compressMobilePhoto,
  dataURItoFile,
  resizeImage,
  rotateImage,
  toImage,
} from '@beenotung/tslib/image.js'
import { selectImage } from '@beenotung/tslib/file.js'
import { client_config } from './client-config.js'

/** @description compress to within the file size budget */
function compressPhotos(files: FileList | File[]) {
  return Promise.all(
    Array.from(files, async file => {
      let dataUrl = await compressMobilePhoto({
        image: file,
        maximumSize: client_config.max_image_size,
        mimeType: 'image/webp',
      })
      file = dataURItoFile(dataUrl, file)
      return { dataUrl, file }
    }),
  )
}

/** @description resize to given dimension */
async function selectPhotos(
  options?: {
    accept?: string
    quality?: number
    multiple?: boolean
  } & ({ width: number; height: number } | { size: number } | {}),
) {
  let files = await selectImage({
    accept: options?.accept || '.jpg,.png,.webp,.heic,.gif',
    multiple: options?.multiple,
  })
  return Promise.all(
    files.map(async file => {
      let image = await toImage(file)
      let width = 720
      let height = 720
      let quality = 0.5
      if (options) {
        if ('size' in options) {
          width = options.size
          height = options.size
        }
        if ('width' in options) {
          width = options.width
        }
        if ('height' in options) {
          height = options.height
        }
        if (options.quality) {
          quality = options.quality
        }
      }
      let dataUrl = resizeImage(image, width, height, 'image/webp', quality)
      file = dataURItoFile(dataUrl, file)
      if (file.size > client_config.max_image_size) {
        dataUrl = await compressMobilePhoto({
          image: dataUrl,
          maximumSize: client_config.max_image_size,
          mimeType: 'image/webp',
        })
        file = dataURItoFile(dataUrl, file)
      }
      return { dataUrl, file }
    }),
  )
}

async function selectShopLogo() {
  let [photo] = await selectPhotos({
    accept: '.jpg,.png,.webp,.heic,.gif',
    multiple: false,
    size: 150,
  })
  return photo
}

async function selectShopCoverImage() {
  let [photo] = await selectPhotos({
    accept: '.jpg,.png,.webp,.heic,.gif',
    multiple: false,
    width: 640,
    height: 400,
  })
  return photo
}

async function selectServiceImage() {
  let [photo] = await selectPhotos({
    accept: '.jpg,.png,.webp,.heic,.gif',
    multiple: false,
    size: 720,
  })
  return photo
}

async function selectReceiptImages() {
  let files = await selectImage({
    // TODO support video
    // accept: 'image/*',
    accept: '.jpg,.png,.webp,.heic',
    multiple: true,
  })
  return Promise.all(
    files.map(async file => {
      let image = await toImage(file)
      if (image.width > image.height) {
        let canvas = rotateImage(image)
        let dataUrl = canvas.toDataURL('image/webp')
        image = await toImage(dataUrl)
      }
      let quality = 0.5
      let w = 360
      let h = (360 * 16) / 9
      let dataUrl = resizeImage(image, w, h, 'image/webp', quality)
      file = dataURItoFile(dataUrl, file)
      return { dataUrl, file }
    }),
  )
}

Object.assign(window, {
  compressPhotos,
  selectPhotos,
  format_byte,
  selectShopLogo,
  selectShopCoverImage,
  selectServiceImage,
  selectReceiptImages,
})
