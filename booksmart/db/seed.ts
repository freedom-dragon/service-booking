import { filter, seedRow } from 'better-sqlite3-proxy'
import { Service, ServiceTimeslot, proxy } from './proxy'
import { calcBookingTotalFee as calcBookingFee } from './service-store'

// This file serve like the knex seed file.
//
// You can setup the database with initial config and sample data via the db proxy.

proxy.user[1] = {
  username: null,
  nickname: 'BookSmart Admin',
  password_hash: null,
  email:
    // 'admin@booksmart.com',
    'booksmart@mailinator.com',
  tel: '+85296385274',
  avatar: null,
}

proxy.user[2] = {
  username: null,
  nickname: 'Katy 榆',
  password_hash: null,
  email:
    //  'the.balconi.artstudio@gmail.com',
    'the.balconi.artstudio@mailinator.com',
  tel: '+85262787635',
  avatar: null,
}

proxy.user[3] = {
  username: null,
  nickname: 'Beeno',
  password_hash: null,
  email:
    // 'beeno@gmail.com',
    'beeno@mailinator.com',
  tel: '+85298765432',
  avatar: null,
}

proxy.shop[1] = {
  owner_id: 2,
  name: 'The Balconi ARTLAB 香港',
  slug: 'lab.on.the.balconi',
  bio: 'Affordable art for all',
  desc: 'The Balconi ARTLAB 是一家由藝術系畢業生主理的私人畫室，主打《現代掛畫工作坊》，致力推廣高質素的裝飾掛畫，將精緻繪畫帶入可觸及的日常，讓每家每戶都能擁有畫廊級的藝術品收藏，並享受個人專屬的美感體驗——親手製作，品味生活。',
  owner_name: 'Katy',
  address: '大角咀必發道128號宏創方20樓',
  address_remark: `
- 自然採光，私人班、情侶/ 親子班之打卡首選✨
- 泊車方便，亦可乘搭巴士2E/18/44/E21/914等，
  或太子/南昌/奧運站步行15分鐘
`.trim(),
  tel: '62787635',
  email: 'the.balconi.artstudio@gmail.com',
  facebook: 'beenotung',
  messenger: 'beenotung',
  instagram: 'lab.on.the.balconi',
  youtube: 'luoluopipa',
  whatsapp: '62787635',
  telegram: 'beenotung',
  twitter: 'beenotung',
  floating_contact_method: 'whatsapp',
  payme_tel: null,
  payme_link: null,
  fps_tel: null,
  fps_email: null,
  fps_id: null,
  bank_name: null,
  bank_account_num: null,
  bank_account_name: null,
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
let remark_id = 0
let timeslot_id = 0
let hour_id = 0
function seedService(
  data: Omit<Service, 'archive_time'> & {
    options: string[]
    timeslots: (Omit<ServiceTimeslot, 'service_id'> & {
      /** @example '09:00-12:00,14:00-16:30,20:00-22:00' */
      hours: string
    })[]
    remarks: { title: string | null; content: string }[]
  },
) {
  let { id: service_id, options, timeslots, remarks, ...service } = data
  proxy.service[service_id!] = { ...service, archive_time: null }
  for (let option of options) {
    option_id++
    proxy.service_option[option_id] = {
      service_id: service_id!,
      name: option,
    }
  }
  for (let remark of remarks) {
    remark_id++
    proxy.service_remark[remark_id] = {
      service_id: service_id!,
      title: remark.title,
      content: remark.content,
    }
  }
  for (let _timeslot of timeslots) {
    let { hours, ...timeslot } = _timeslot
    timeslot_id++
    proxy.service_timeslot[timeslot_id] = {
      service_id: service_id!,
      ...timeslot,
    }
    for (let hour of hours.split(',')) {
      let [start_time, end_time] = hour.split('-')
      hour_id++
      proxy.timeslot_hour[hour_id] = {
        service_timeslot_id: timeslot_id,
        start_time,
        end_time,
      }
    }
  }
}

seedService({
  id: 1,
  shop_id: 1,
  slug: 'exp',
  name: '體驗班',
  hours: '2 hours',
  times: 1,
  book_duration_minute: 60 * 2,
  original_price: null,
  unit_price: '380',
  price_unit: '位',
  peer_amount: 3,
  peer_price: '100',
  time: '有指定可以book時間',
  options: ['正方形25cmx25cm', '長方形20cmx50cm', '圓形30cm直徑'],
  quota: 6,
  address: null,
  address_remark: null,
  question: '會否帶寵物來？如有請填寫明品種和體形。',
  desc: `加入我們的繪畫工作坊，享受獨特的藝術探險！ 我們的藝術家指導員將帶領您通過一系列的步驟，教導您不同的技術和技巧，幫助您創作出自己獨特的繪畫作品。

在工作坊中，您將有機會運用各種高品質的材料和供應，包括精緻的畫板、筆和顏料。 您還將有機會嘗試不同的畫風和技巧，從傳統的風景畫到現代抽象藝術。

我們的工作坊設計為所有技巧水平的人士，因此不要緊張，如果您之前未曾畫過。 我們的指導員將為您提供個性化的指導和支持，幫助您實現您的藝術目標。 您還將有機會與其他參與者合作，分享想法和靈感，創造一幅獨特的藝術作品。

工作坊結束後，您將取得您的完成作品，準備好掛在牆上或贈予他人。 您還有選擇在我們的工作室美術館中展示您的藝術作品，讓更多人認識您的創造力。

不要錯過這個獨特的機會，讓您的創造力發揮，創造出真正獨特的藝術作品。 請現在報名參加我們的繪畫工作坊！`,
  remarks: [
    {
      title: '材料',
      content: '提供高質量的顏料、筆和畫板。',
    },
    {
      title: '指導',
      content: '經驗豐富的藝術家指導員將帶領您透過一系列的步驟。',
    },
    {
      title: '技巧',
      content: '學習傳統的風景畫到現代抽象藝術的不同技巧和技術。',
    },
    {
      title: '合作',
      content: '與其他參加者合作，分享想法和靈感。',
    },
    {
      title: '個性化指導',
      content: '指導員將為您提供個性化的指導和支持，幫助您實現您的藝術目標。',
    },
  ],
  timeslots: [
    {
      start_date: '2024-02-11',
      end_date: '2024-05-17',
      weekdays: '日二四六',
      hours: '09:00-12:00,14:00-16:30,20:00-22:00',
    },
    {
      start_date: '2024-02-18',
      end_date: '2024-06-24',
      weekdays: '一三五',
      hours: '14:00-16:30',
    },
  ],
})

seedService({
  id: 2,
  shop_id: 1,
  slug: 'flower',
  name: '舒壓花畫',
  hours: '2.5 - 3 hours',
  times: 3,
  book_duration_minute: 60 * 3,
  original_price: null,
  unit_price: '580',
  price_unit: '位',
  peer_amount: 3,
  peer_price: '200',
  time: '有指定可以book時間',
  options: ['正方形25cmx25cm', '長方形20cmx50cm', '圓形30cm直徑'],
  quota: 6,
  address: null,
  address_remark: null,
  question: '是否對花粉敏感？',
  desc: null,
  remarks: [],
  timeslots: [
    {
      start_date: '2024-02-11',
      end_date: '2024-05-17',
      weekdays: '日二四六',
      hours: '09:00-12:00,14:00-16:30,20:00-22:00',
    },
    {
      start_date: '2024-02-18',
      end_date: '2024-05-24',
      weekdays: '一三五',
      hours: '14:00-16:30',
    },
  ],
})

seedService({
  id: 3,
  shop_id: 1,
  slug: 'couple',
  name: '情侶班',
  hours: '3 - 3.5 hours',
  times: 1,
  book_duration_minute: 3.5 * 60,
  original_price: '1440',
  unit_price: '980',
  price_unit: '對情侶',
  peer_amount: null,
  peer_price: null,
  time: '可任選時間',
  options: ['50x70cm'],
  quota: 2,
  address: null,
  address_remark: null,
  question: '是否需要輪椅？',
  desc: null,
  remarks: [],
  timeslots: [
    {
      start_date: '2024-02-11',
      end_date: '2024-05-17',
      weekdays: '日二四六',
      hours: '09:00-12:00,14:00-16:30,20:00-22:00',
    },
    {
      start_date: '2024-02-18',
      end_date: '2024-05-24',
      weekdays: '一三五',
      hours: '14:00-16:30',
    },
  ],
})

seedService({
  id: 4,
  shop_id: 1,
  slug: 'giant',
  name: '超大畫班',
  hours: '4 - 5 hours',
  times: 1,
  book_duration_minute: 5 * 60,
  original_price: null,
  unit_price: '📐 量身訂做',
  price_unit: '位',
  peer_amount: null,
  peer_price: null,
  time: '可任選時間',
  options: ['📐 量身訂做'],
  quota: 1,
  address: null,
  address_remark: null,
  question: null,
  desc: null,
  remarks: [],
  timeslots: [
    {
      start_date: '2024-02-11',
      end_date: '2024-05-17',
      weekdays: '日二四六',
      hours: '09:00-12:00,14:00-16:30,20:00-22:00',
    },
    {
      start_date: '2024-02-18',
      end_date: '2024-05-24',
      weekdays: '一三五',
      hours: '14:00-16:30',
    },
  ],
})

function patch_booking_total_price() {
  for (let booking of filter(proxy.booking, { total_price: null as any })) {
    let fee = calcBookingFee(booking)
    booking.total_price = fee.total_fee
  }
}
patch_booking_total_price()
