import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type Method = {
  id?: null | number
  method: string
}

export type Url = {
  id?: null | number
  url: string
}

export type UaType = {
  id?: null | number
  name: string
  count: number
}

export type RequestSession = {
  id?: null | number
  language: null | string
  timezone: null | string
  timezone_offset: null | number
}

export type UaBot = {
  id?: null | number
  name: string
  count: number
}

export type UserAgent = {
  id?: null | number
  user_agent: string
  count: number
  ua_type_id: null | number
  ua_type?: UaType
  ua_bot_id: null | number
  ua_bot?: UaBot
}

export type UaStat = {
  id?: null | number
  last_request_log_id: number
}

export type User = {
  id?: null | number
  username: null | string
  nickname: null | string
  password_hash: null | string // char(60)
  email: null | string
  tel: null | string
  avatar: null | string
  is_admin: null | boolean
}

export type RequestLog = {
  id?: null | number
  method_id: number
  method?: Method
  url_id: number
  url?: Url
  user_agent_id: null | number
  user_agent?: UserAgent
  request_session_id: null | number
  request_session?: RequestSession
  user_id: null | number
  user?: User
  timestamp: number
}

export type VerificationAttempt = {
  id?: null | number
  passcode: string // char(6)
  email: string
}

export type Shop = {
  id?: null | number
  owner_id: number
  owner?: User
  slug: string
  name: string
  bio: null | string
  desc: null | string
  owner_name: string
  address: null | string
  address_remark: null | string
  tel: null | string
  email: null | string
  facebook: null | string
  messenger: null | string
  instagram: null | string
  youtube: null | string
  whatsapp: null | string
  telegram: null | string
  twitter: null | string
  floating_contact_method: null | string
  payme_tel: null | string
  payme_link: null | string
  fps_tel: null | string
  fps_email: null | string
  fps_id: null | string
  bank_name: null | string
  bank_account_num: null | string
  bank_account_name: null | string
  accept_cash: null | boolean
}

export type VerificationCode = {
  id?: null | number
  passcode: string // char(6)
  email: string
  request_time: number
  revoke_time: null | number
  match_id: null | number
  match?: VerificationAttempt
  user_id: null | number
  user?: User
  shop_id: null | number
  shop?: Shop
}

export type ShopLocale = {
  id?: null | number
  shop_id: number
  shop?: Shop
  key: string
  value: string
}

export type Service = {
  id?: null | number
  shop_id: number
  shop?: Shop
  slug: string
  name: string
  times: null | number
  book_duration_minute: number
  original_price: null | string
  unit_price: null | string
  price_unit: string
  peer_amount: null | number
  peer_price: null | string
  time: string
  quota: number
  address: null | string
  address_remark: null | string
  desc: null | string
  archive_time: null | number
  timeslot_interval_minute: null | number
}

export type ServiceQuestion = {
  id?: null | number
  service_id: number
  service?: Service
  question: string
}

export type ServiceOption = {
  id?: null | number
  service_id: number
  service?: Service
  name: string
}

export type ServiceRemark = {
  id?: null | number
  service_id: number
  service?: Service
  title: null | string
  content: string
}

export type Package = {
  id?: null | number
  price: number
  shop_id: number
  shop?: Shop
  title: string
  start_time: number
  end_time: number
  duration_time: number
}

export type ServiceTimeslot = {
  id?: null | number
  service_id: number
  service?: Service
  start_date: string
  end_date: string
  weekdays: string
}

export type TimeslotHour = {
  id?: null | number
  service_timeslot_id: number
  service_timeslot?: ServiceTimeslot
  start_time: string
  end_time: string
}

export type Ticket = {
  id?: null | number
  package_id: number
  package?: Package
  user_id: number
  user?: User
  purchase_time: number
  expire_time: number
}

export type Booking = {
  id?: null | number
  user_id: number
  user?: User
  service_id: number
  service?: Service
  service_option_id: null | number
  service_option?: ServiceOption
  submit_time: number
  appointment_time: number
  arrive_time: null | number
  approve_time: null | number
  reject_time: null | number
  cancel_time: null | number
  amount: number
  total_price: null | string
  ticket_id: null | number
  ticket?: Ticket
}

export type BookingAnswer = {
  id?: null | number
  booking_id: number
  booking?: Booking
  service_question_id: number
  service_question?: ServiceQuestion
  answer: string
}

export type Receipt = {
  id?: null | number
  booking_id: number
  booking?: Booking
  filename: string
  upload_time: number
}

export type PackageService = {
  id?: null | number
  package_id: number
  package?: Package
  service_id: number
  service?: Service
}

export type DBProxy = {
  method: Method[]
  url: Url[]
  ua_type: UaType[]
  request_session: RequestSession[]
  ua_bot: UaBot[]
  user_agent: UserAgent[]
  ua_stat: UaStat[]
  user: User[]
  request_log: RequestLog[]
  verification_attempt: VerificationAttempt[]
  shop: Shop[]
  verification_code: VerificationCode[]
  shop_locale: ShopLocale[]
  service: Service[]
  service_question: ServiceQuestion[]
  service_option: ServiceOption[]
  service_remark: ServiceRemark[]
  package: Package[]
  service_timeslot: ServiceTimeslot[]
  timeslot_hour: TimeslotHour[]
  ticket: Ticket[]
  booking: Booking[]
  booking_answer: BookingAnswer[]
  receipt: Receipt[]
  package_service: PackageService[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    method: [],
    url: [],
    ua_type: [],
    request_session: [],
    ua_bot: [],
    user_agent: [
      /* foreign references */
      ['ua_type', { field: 'ua_type_id', table: 'ua_type' }],
      ['ua_bot', { field: 'ua_bot_id', table: 'ua_bot' }],
    ],
    ua_stat: [],
    user: [],
    request_log: [
      /* foreign references */
      ['method', { field: 'method_id', table: 'method' }],
      ['url', { field: 'url_id', table: 'url' }],
      ['user_agent', { field: 'user_agent_id', table: 'user_agent' }],
      ['request_session', { field: 'request_session_id', table: 'request_session' }],
      ['user', { field: 'user_id', table: 'user' }],
    ],
    verification_attempt: [],
    shop: [
      /* foreign references */
      ['owner', { field: 'owner_id', table: 'user' }],
    ],
    verification_code: [
      /* foreign references */
      ['match', { field: 'match_id', table: 'verification_attempt' }],
      ['user', { field: 'user_id', table: 'user' }],
      ['shop', { field: 'shop_id', table: 'shop' }],
    ],
    shop_locale: [
      /* foreign references */
      ['shop', { field: 'shop_id', table: 'shop' }],
    ],
    service: [
      /* foreign references */
      ['shop', { field: 'shop_id', table: 'shop' }],
    ],
    service_question: [
      /* foreign references */
      ['service', { field: 'service_id', table: 'service' }],
    ],
    service_option: [
      /* foreign references */
      ['service', { field: 'service_id', table: 'service' }],
    ],
    service_remark: [
      /* foreign references */
      ['service', { field: 'service_id', table: 'service' }],
    ],
    package: [
      /* foreign references */
      ['shop', { field: 'shop_id', table: 'shop' }],
    ],
    service_timeslot: [
      /* foreign references */
      ['service', { field: 'service_id', table: 'service' }],
    ],
    timeslot_hour: [
      /* foreign references */
      ['service_timeslot', { field: 'service_timeslot_id', table: 'service_timeslot' }],
    ],
    ticket: [
      /* foreign references */
      ['package', { field: 'package_id', table: 'package' }],
      ['user', { field: 'user_id', table: 'user' }],
    ],
    booking: [
      /* foreign references */
      ['user', { field: 'user_id', table: 'user' }],
      ['service', { field: 'service_id', table: 'service' }],
      ['service_option', { field: 'service_option_id', table: 'service_option' }],
      ['ticket', { field: 'ticket_id', table: 'ticket' }],
    ],
    booking_answer: [
      /* foreign references */
      ['booking', { field: 'booking_id', table: 'booking' }],
      ['service_question', { field: 'service_question_id', table: 'service_question' }],
    ],
    receipt: [
      /* foreign references */
      ['booking', { field: 'booking_id', table: 'booking' }],
    ],
    package_service: [
      /* foreign references */
      ['package', { field: 'package_id', table: 'package' }],
      ['service', { field: 'service_id', table: 'service' }],
    ],
  },
})
