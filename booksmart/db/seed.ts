import { seedRow } from 'better-sqlite3-proxy'
import { Service, proxy } from './proxy'

// This file serve like the knex seed file.
//
// You can setup the database with initial config and sample data via the db proxy.

proxy.shop[1] = {
  name: 'The Balconi ARTLAB 香港',
  slug: 'lab.on.the.balconi',
  bio: 'Affordable art for all 🛋️ 𝐌𝐨𝐝𝐞𝐫𝐧 𝐃𝐞𝐜𝐨𝐫 𝐏𝐚𝐢𝐧𝐭𝐢𝐧𝐠 | 𝙁𝙚𝙖𝙩𝙪𝙧𝙚 𝙬𝙖𝙡𝙡 ⚜️Vintage • Stardust • Zen',
  owner_name: 'Katy',
  address: '大角咀必發道128號宏創方20樓',
  address_remark: `
- 自然採光，私人班、情侶/ 親子班之打卡首選✨
- 泊車方便，亦可乘搭巴士2E/18/44/E21/914等，
  或太子/南昌/奧運站步行15分鐘
`.trim(),
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
  address: null,
  address_remark: null,
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
  address: null,
  address_remark: null,
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
  address: null,
  address_remark: null,
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
  address: null,
  address_remark: null,
})
