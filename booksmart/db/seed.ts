import { seedRow } from 'better-sqlite3-proxy'
import { Service, proxy } from './proxy'

// This file serve like the knex seed file.
//
// You can setup the database with initial config and sample data via the db proxy.

proxy.shop[1] = {
  name: 'The Balconi ARTLAB 香港',
  slug: 'lab.on.the.balconi',
  owner_name: 'Katy',
}

proxy.shop_locale[1] = {
  shop_id: 1,
  key: 'tutor',
  value: '畫師',
}
proxy.shop_locale[2] = {
  shop_id: 1,
  key: 'service',
  value: '畫班',
}

let option_id = 0
function seedService(data: Service & { options: string[] }) {
  let { id, options, ...service } = data
  proxy.service[id!] = service
  for (let option of options) {
    option_id++
    proxy.service_option[option_id] = {
      service_id: id!,
      name: option,
    }
  }
}

seedService({
  id: 1,
  shop_id: 1,
  slug: 'exp',
  name: '體驗班',
  hours: '2 hours',
  book_duration_minute: 60 * 2,
  price: '$380/位',
  time: '有指定可以book時間',
  options: ['正方形25cmx25cm', '長方形20cmx50cm', '圓形30cm直徑'],
  quota: '6 ppl',
  // cover_image: 'https://picsum.photos/seed/1/256/256',
  // cover_image: '/assets/shops/lab.on.the.balconi/1.webp',
})

seedService({
  id: 2,
  shop_id: 1,
  slug: 'flower',
  name: '舒壓花畫',
  hours: '2.5 - 3 hours',
  book_duration_minute: 60 * 3,
  price: '$580/位',
  time: '有指定可以book時間',
  options: ['正方形25cmx25cm', '長方形20cmx50cm', '圓形30cm直徑'],
  quota: '6 ppl',
  // cover_image: 'https://picsum.photos/seed/2/256/256',
  // cover_image: '/assets/shops/lab.on.the.balconi/2.webp',
})

seedService({
  id: 3,
  shop_id: 1,
  slug: 'couple',
  name: '情侶班',
  hours: '3 - 3.5 hours',
  book_duration_minute: 3.5 * 60,
  price: '$980/2位',
  time: '可任選時間',
  options: ['50x70cm'],
  quota: '2 pairs 情侶',
  // cover_image: 'https://picsum.photos/seed/3/256/256',
  // cover_image: '/assets/shops/lab.on.the.balconi/3.webp',
})

seedService({
  id: 4,
  shop_id: 1,
  slug: 'giant',
  name: '超大畫班',
  hours: '4 - 5 hours',
  book_duration_minute: 5 * 60,
  price: '📐 量身訂做',
  time: '可任選時間',
  options: ['📐 量身訂做'],
  quota: '1 ppl',
  // cover_image: 'https://picsum.photos/seed/4/256/256',
  // cover_image: '/assets/shops/lab.on.the.balconi/4.webp',
})
