import { format_byte } from '@beenotung/tslib/format.js'
import {
  compressMobilePhoto,
  dataURItoFile,
  resizeImage,
  resizeWithRatio,
  toImage,
} from '@beenotung/tslib/image.js'
import { selectImage } from '@beenotung/tslib/file.js'
import { client_config } from './client-config.js'

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

async function selectServiceImage() {
  let [file] = await selectImage({
    // TODO support video
    // accept: 'image/*',
    accept: '.jpg,.png,.webp,.heic,.gif',
    multiple: false,
  })
  if (!file) return
  let image = await toImage(file)
  let size = 720
  let quality = 0.5
  let dataUrl = resizeImage(image, size, size, 'image/webp', quality)
  file = dataURItoFile(dataUrl, file)
  return { dataUrl, file }
}

async function selectReceiptImages() {
  let files = await selectImage({
    // accept: 'image/*',
    accept: '.jpg,.png,.webp,.heic',
    multiple: true,
  })
  return Promise.all(
    files.map(async file => {
      let image = await toImage(file)
      let size = 360
      let quality = 0.5
      let dataUrl = resizeImage(image, size, size, 'image/webp', quality)
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = resizeImage(image, size, size, 'image/jpeg', quality)
      }
      file = dataURItoFile(dataUrl, file)
      return { dataUrl, file }
    }),
  )
}

Object.assign(window, {
  compressPhotos,
  format_byte,
  selectServiceImage,
  selectReceiptImages,
})
