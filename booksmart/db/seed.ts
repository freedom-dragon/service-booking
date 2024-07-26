import { del, filter, find, seedRow } from 'better-sqlite3-proxy'
import { Service, ServiceTimeslot, Shop, User, proxy } from './proxy'
import { calcBookingTotalFee as calcBookingFee } from './service-store'
import { MINUTE } from '@beenotung/tslib/time'

// This file serve like the knex seed file.
//
// You can setup the database with initial config and sample data via the db proxy.

// TODO add shop_id in user

function seedUser(user: User): number {
  let row =
    find(proxy.user, { tel: user.tel }) ||
    find(proxy.user, { email: user.email })
  let user_id = row
    ? (Object.assign(row, user), row.id!)
    : proxy.user.push(user)
  return user_id
}

let admin = seedUser({
  username: null,
  nickname: 'BookSmart Admin',
  is_admin: true,
  password_hash: null,
  email:
    // 'admin@booksmart.com',
    // 'booksmart@mailinator.com',
    'cs.playsmarthk@gmail.com',
  tel: '+85269330678',
  avatar: null,
})

let katy = seedUser({
  username: null,
  nickname: 'Katy 榆',
  is_admin: false,
  password_hash: null,
  email:
    //  'the.balconi.artstudio@gmail.com',
    'the.balconi.artstudio@mailinator.com',
  tel: '+85262787635',
  avatar: null,
})

let beeno = seedUser({
  username: null,
  nickname: 'Beeno',
  is_admin: false,
  password_hash: null,
  email: 'info@beenocodingstudio.com',
  tel: '+85298222913',
  avatar: null,
})

function seedShop(
  data: Shop & {
    locale: { tutor: string; service: string }
    services: (Omit<Service, 'id' | 'shop_id'> & {
      options: string[]
      timeslots: (Omit<ServiceTimeslot, 'service_id'> & {
        /** @example '09:00-12:00,14:00-16:30,20:00-22:00' */
        hours: string
      })[]
      remarks: { title: string | null; content: string }[]
      questions: string[]
    })[]
  },
): number {
  let { locale, services, ...shop } = data
  let row = find(proxy.shop, { slug: shop.slug })
  let shop_id = row
    ? (Object.assign(row, shop), row.id!)
    : proxy.shop.push(shop)
  seedRow(proxy.shop_locale, { shop_id, key: 'tutor' }, { value: locale.tutor })
  seedRow(
    proxy.shop_locale,
    { shop_id, key: 'service' },
    { value: locale.service },
  )
  for (let data of services) {
    let { options, timeslots, remarks, questions, ...service } = data
    let service_row = find(proxy.service, { shop_id, slug: service.slug })
    let service_id = service_row
      ? (Object.assign(service_row, service, { archive_time: null }),
        service_row.id!)
      : proxy.service.push({ ...service, shop_id, archive_time: null })
    for (let option of options) {
      seedRow(proxy.service_option, { service_id, name: option })
    }
    for (let remark of remarks) {
      seedRow(
        proxy.service_remark,
        { service_id, title: remark.title },
        { content: remark.content },
      )
    }
    for (let question of filter(proxy.service_question, {
      service_id: service_id!,
    })) {
      del(proxy.booking_answer, { service_question_id: question.id! })
      delete proxy.service_question[question.id!]
    }
    for (let question of questions) {
      proxy.service_question.push({ service_id: service_id!, question })
    }
    for (let _timeslot of timeslots) {
      let { hours, ...timeslot } = _timeslot
      let timeslot_id = seedRow(
        proxy.service_timeslot,
        { service_id, start_date: timeslot.start_date },
        timeslot,
      )
      for (let hour of hours.split(',')) {
        let [start_time, end_time] = hour.split('-')
        seedRow(proxy.timeslot_hour, {
          service_timeslot_id: timeslot_id,
          start_time,
          end_time,
        })
      }
    }
  }
  return shop_id
}

let art_studio = seedShop({
  owner_id: katy,
  name: 'The Balconi ARTLAB 香港',
  slug: 'lab.on.the.balconi',
  bio: 'Affordable art for all',
  desc: 'The Balconi ARTLAB 是一家由藝術系畢業生主理的私人畫室，主打《現代掛畫工作坊》，致力推廣高質素的裝飾掛畫，將精緻繪畫帶入可觸及的日常，讓每家每戶都能擁有畫廊級的藝術品收藏，並享受個人專屬的美感體驗——親手製作，品味生活。',
  owner_name: 'Katy',
  address: '大角咀必發道128號宏創方20樓',
  address_remark: `
太子站 A 出口，轉右；
大門密碼 1234
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
  accept_cash: true,
  locale: {
    tutor: '畫師',
    service: '畫班',
  },
  services: [
    {
      slug: 'exp',
      name: '體驗班',
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
      questions: ['會否帶寵物來？如有請填寫明品種和體形。'],
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
          content:
            '指導員將為您提供個性化的指導和支持，幫助您實現您的藝術目標。',
        },
      ],
      timeslot_interval_minute: 15,
      timeslots: [
        {
          start_date: '2024-02-11',
          end_date: '2024-07-17',
          weekdays: '日二四六',
          hours: '09:00-12:00,14:00-16:30,20:00-22:00',
        },
        {
          start_date: '2024-02-18',
          end_date: '2024-07-24',
          weekdays: '一三五',
          hours: '14:00-16:30',
        },
      ],
      archive_time: null,
    },
    {
      slug: 'flower',
      name: '舒壓花畫',
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
      questions: ['是否對花粉敏感？'],
      desc: null,
      remarks: [],
      timeslot_interval_minute: 15,
      timeslots: [
        {
          start_date: '2024-02-11',
          end_date: '2024-07-17',
          weekdays: '日二四六',
          hours: '09:00-12:00,14:00-16:30,20:00-22:00',
        },
        {
          start_date: '2024-02-18',
          end_date: '2024-07-24',
          weekdays: '一三五',
          hours: '14:00-16:30',
        },
      ],
      archive_time: null,
    },
    {
      slug: 'couple',
      name: '情侶班',
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
      questions: ['是否需要輪椅？'],
      desc: null,
      remarks: [],
      timeslot_interval_minute: 15,
      timeslots: [
        {
          start_date: '2024-02-11',
          end_date: '2024-07-17',
          weekdays: '日二四六',
          hours: '09:00-12:00,14:00-16:30,20:00-22:00',
        },
        {
          start_date: '2024-02-18',
          end_date: '2024-07-24',
          weekdays: '一三五',
          hours: '14:00-16:30',
        },
      ],
      archive_time: null,
    },
    {
      slug: 'giant',
      name: '超大畫班',
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
      questions: [],
      desc: null,
      remarks: [],
      timeslot_interval_minute: 15,
      timeslots: [
        {
          start_date: '2024-02-11',
          end_date: '2024-07-17',
          weekdays: '日二四六',
          hours: '09:00-12:00,14:00-16:30,20:00-22:00',
        },
        {
          start_date: '2024-02-18',
          end_date: '2024-07-24',
          weekdays: '一三五',
          hours: '14:00-16:30',
        },
      ],
      archive_time: null,
    },
  ],
})

let coding_studio = seedShop({
  owner_id: beeno,
  name: 'Beeno Coding Studio',
  slug: 'beeno.coding.studio',
  bio: 'Software development training for all',
  desc: 'Beeno Coding Studio 提供全面的軟件開發培訓，適合各種技能水平的個人。無論你是希望進入編程世界的初學者，還是希望擴展知識的經驗豐富的開發者，我們的課程都能滿足你的需求。加入我們，提升你的技能，推動你的科技行業職業發展。',
  owner_name: 'Beeno',
  address: '123 Tech Avenue, Suite 456, Innovation City',
  address_remark: `
- 位於科技區中心，交通便利
- 公共交通方便，停車位充足
- 設施現代，配備先進設備
`.trim(),
  tel: '98765432',
  email: 'info@beenocodingstudio.com',
  facebook: 'beenocodingstudio',
  messenger: 'beenocodingstudio',
  instagram: 'beenocodingstudio',
  youtube: 'beenocodingstudio',
  whatsapp: '98765432',
  telegram: 'beenocodingstudio',
  twitter: 'beenocoding',
  floating_contact_method: 'email',
  payme_tel: '98765432',
  payme_link: 'https://payme.hsbc/beenocodingstudio',
  fps_tel: '98765432',
  fps_email: 'payments@beenocodingstudio.com',
  fps_id: '98765432',
  bank_name: 'Tech Bank',
  bank_account_num:
    // hang seng bank
    '123 456789 012'.replaceAll(' ', ''),
  // bank of chain
  // '123456 1234567890123'.replaceAll(' ', ''),
  bank_account_name: 'Beeno Coding Studio',
  accept_cash: true,
  locale: {
    tutor: '導師',
    service: '培訓',
  },
  services: [
    {
      slug: 'ts-liveview',
      name: '全端開發實作教學',
      times: 1,
      book_duration_minute: 60 * 3,
      original_price: '350',
      unit_price: '300',
      price_unit: '位',
      peer_amount: 2,
      peer_price: '200',
      time: '有指定可以book時間',
      options: ['MacBook', 'Windows Laptop', 'Linux Laptop'],
      quota: 3,
      address: null,
      address_remark: null,
      questions: ['是否能理解英文教材？'],
      desc: `
  加入我們的全端開發實作教學，掌握現代網頁開發的核心技能！我們的專業導師將帶領您一步步學習前端和後端技術，從基礎到進階，幫助您打造完整的網頁應用。

  在課程中，您將使用各種最新的開發工具和框架，包括HTML、CSS、JavaScript、Node.js、Express、React以及資料庫技術，如MongoDB和SQL。您還將學習如何部署和維護您的應用，確保其在真實環境中穩定運行。

  我們的課程設計適合所有技能水平的學員，不論您是初學者還是有經驗的開發者。導師將提供個性化的指導和反饋，幫助您克服學習中的挑戰，實現您的開發目標。您還將有機會與其他學員合作，分享項目經驗和開發技巧，提升您的協作和問題解決能力。

  課程結束後，您將擁有一個完整的全端項目作品集，展示您的技能並為您的職業生涯增色。不要錯過這個提升自我的機會，立即報名參加我們的全端開發實作教學！
`,
      remarks: [
        {
          title: '工具',
          content: '提供最新的開發工具和框架，如React、Node.js、Express等。',
        },
        {
          title: '指導',
          content: '經驗豐富的開發者導師將帶領您透過一系列的實作步驟。',
        },
        {
          title: '技術',
          content: '學習前端和後端開發的核心技術和最佳實踐。',
        },
        {
          title: '合作',
          content: '與其他學員合作，分享項目經驗和開發技巧。',
        },
        {
          title: '個性化指導',
          content: '導師將為您提供個性化的指導和反饋，幫助您實現您的開發目標。',
        },
      ],
      timeslot_interval_minute: 30,
      timeslots: [
        {
          start_date: '2024-02-11',
          end_date: '2024-07-17',
          weekdays: '一二三四五',
          hours: '10:00-23:00',
        },
        {
          start_date: '2024-02-18',
          end_date: '2024-07-24',
          weekdays: '日六',
          hours: '14:00-23:30',
        },
      ],
      archive_time: null,
    },
  ],
})

// TODO select the interval (instead of fixed 15 minutes)

function patch_booking_total_price() {
  for (let booking of filter(proxy.booking, { total_price: null as any })) {
    let fee = calcBookingFee(booking)
    booking.total_price = fee.total_fee
  }
}
patch_booking_total_price()
