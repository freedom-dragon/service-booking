import { DAY, MINUTE } from '@beenotung/tslib/time.js'
import { db } from '../../../db/db.js'
import { Service, proxy } from '../../../db/proxy.js'
import { Script } from './script.js'
import { o } from '../jsx/jsx.js'
import { fromDatePart } from '../format/date.js'
import { ResolvedPageRoue, Routes } from '../routes.js'
import { resolveServiceRoute } from '../shop-route.js'
import { apiEndpointTitle } from '../../config.js'
import { find } from 'better-sqlite3-proxy'
import { EarlyTerminate } from '../helpers.js'

export type ServiceTimeslotRow = Record<
  'id' | 'start_date' | 'end_date' | 'weekdays',
  string
>
let select_service_timeslot = db.prepare(/* sql */ `
select
  id
, start_date
, end_date
, weekdays
from service_timeslot
where service_id = :service_id
`)

export type TimeslotHourRow = Record<'start_time' | 'end_time', string>
let select_timeslot_hour = db.prepare(/* sql */ `
select
  start_time
, end_time
from timeslot_hour
where service_timeslot_id = :service_timeslot_id
`)

let select_booking_by_time = db.prepare(/* sql */ `
select
  *
from booking
where service_id = :service_id
  and approve_time is not null
  and cancel_time is null
  and reject_time is null
  and :start_time <= appointment_time
  and appointment_time < :end_time
`)

export function ServiceTimeslotPicker(attrs: {
  /* database proxy */
  service: Service

  /* UI elements id */
  datePicker: string
  timeRadioGroup: string
  bookingForm: string
  selectedTimeButton: string

  /* event handler function name */
  onSelectDateFn: string
}) {
  let { service } = attrs

  let availableTimeslots = (
    select_service_timeslot.all({
      service_id: service.id,
    }) as ServiceTimeslotRow[]
  ).map(timeslot => {
    let hours = select_timeslot_hour.all({
      service_timeslot_id: timeslot.id,
    }) as TimeslotHourRow[]
    return { timeslot, hours }
  })

  function test() {
    console.log('='.repeat(32))
    console.log('test')
    let dateStr = '2024-04-24'
    let dateStartTime = fromDatePart(dateStr).getTime()
    let dateEndTime = dateStartTime + DAY
    console.dir({ availableTimeslots }, { depth: 20 })
    let bookings = select_booking_by_time.all({
      start_time: dateStartTime,
      end_time: dateEndTime,
      service_id: service.id,
    })
    console.log({
      start_time: dateStartTime,
      end_time: dateEndTime,
    })
    console.dir({ bookings }, { depth: 20 })
    console.log('='.repeat(32))
  }
  test()

  let dateItem = (
    <ion-item>
      <div slot="start">
        <ion-icon name="calendar-outline"></ion-icon> 日期
      </div>
      <ion-datetime-button datetime={attrs.datePicker}></ion-datetime-button>
      <ion-modal>
        <ion-datetime
          id={attrs.datePicker}
          presentation="date"
          show-default-buttons="true"
          name="date"
        >
          <span slot="title">預約日期</span>
        </ion-datetime>
      </ion-modal>
    </ion-item>
  )

  let dateScript = Script(
    /* javascript */ `
    var availableTimeslots = ${JSON.stringify(availableTimeslots)};
    var book_duration_ms = ${service.book_duration_minute * MINUTE};
    var book_time_step_ms = ${15 * MINUTE};
    ${attrs.datePicker}.isDateEnabled = (${function (
      timeslots: typeof availableTimeslots,
    ) {
      return function isDateEnabled(dateString: string) {
        let date = new Date(dateString)
        let today = new Date()
        today.setHours(0, 0, 0, 0)
        if (date.getTime() < today.getTime()) {
          return false
        }
        let day = date.getDay()
        for (let { timeslot, hours } of timeslots) {
          if (
            timeslot.start_date <= dateString &&
            dateString <= timeslot.end_date
          ) {
            let canSelect = '日一二三四五六'
              .split('')
              .some(
                (weekday, i) => timeslot.weekdays.includes(weekday) && day == i,
              )
            if (canSelect) return true
          }
        }
      }
    }})(availableTimeslots);
    var ${attrs.onSelectDateFn}Callback = ${function () {
      return function onDateSelectedCallback() {}
    }}();
    var ${attrs.onSelectDateFn} = (${function (
      timeRadioGroup: HTMLElement,
      bookingForm: HTMLFormElement,
      selectedTimeButton: HTMLFormElement,
      timeslots: typeof availableTimeslots,
      book_duration_ms: number,
      book_time_step_ms: number,
    ) {
      return function onDateSelected(event: any) {
        let dateString = event.detail.value as string
        if (!dateString) return
        dateString = dateString.split('T')[0]
        if ('dev') {
          console.log({ dateString })
          return
        }
        let date = new Date(dateString)
        let day = date.getDay()
        let isTimeAllowed = false
        for (let { timeslot, hours } of timeslots) {
          if (
            timeslot.start_date <= dateString &&
            dateString <= timeslot.end_date
          ) {
            let canSelect = '日一二三四五六'
              .split('')
              .some(
                (weekday, i) => timeslot.weekdays.includes(weekday) && day == i,
              )
            if (canSelect) {
              timeRadioGroup
                .querySelectorAll('ion-item')
                .forEach(e => e.remove())
              for (let hour of hours) {
                let [h, m] = hour.start_time.split(':')
                let start = new Date()
                start.setHours(+h, +m, 0, 0)

                let d2 = (x: number) => (x < 10 ? '0' + x : x)

                for (;;) {
                  let start_time =
                    d2(start.getHours()) + ':' + d2(start.getMinutes())

                  let end = new Date(start.getTime() + book_duration_ms)
                  let end_time = d2(end.getHours()) + ':' + d2(end.getMinutes())

                  if (end_time > hour.end_time) break

                  let item = document.createElement('ion-item')
                  let radio = document.createElement(
                    'ion-radio',
                  ) as HTMLInputElement
                  radio.value = start_time
                  if (start_time == bookingForm.time.value) {
                    isTimeAllowed = true
                  }
                  radio.textContent = start_time + ' - ' + end_time
                  item.appendChild(radio)
                  timeRadioGroup.appendChild(item)

                  start.setTime(start.getTime() + book_time_step_ms)
                }
              }
            }
          }
        }
        if (!isTimeAllowed) {
          bookingForm.time.value = ''
          selectedTimeButton.textContent = '未選擇'
        }
      }
    }})(
      ${attrs.timeRadioGroup},
      ${attrs.bookingForm},
      ${attrs.selectedTimeButton},
      availableTimeslots,
      book_duration_ms,
      book_time_step_ms
    )
    ${attrs.datePicker}.addEventListener('ionChange', ${attrs.onSelectDateFn})
    `,
    'no-minify',
  )

  let timeItem = (
    <ion-accordion-group>
      <ion-accordion value="address">
        <ion-item slot="header">
          <div slot="start">
            <ion-icon name="time-outline"></ion-icon> 時間
            <ion-button
              id={attrs.selectedTimeButton}
              color="light"
              class="ion-padding-horizontal"
            >
              未選擇
            </ion-button>
          </div>
        </ion-item>
        <div class="ion-padding-horizontal" slot="content">
          <ion-radio-group
            id={attrs.timeRadioGroup}
            allow-empty-selection="true"
            name="time"
          >
            <ion-item>
              <ion-radio value="">請先選擇日期</ion-radio>
            </ion-item>
          </ion-radio-group>
        </div>
      </ion-accordion>
    </ion-accordion-group>
  )

  let timeScript = Script(
    /* javascript */ `
${attrs.timeRadioGroup}.addEventListener('ionChange', event => {
  ${attrs.selectedTimeButton}.textContent = event.detail.value || '未選擇'
})
`,
    'no-minify',
  )

  return (
    <>
      {dateItem}
      {timeItem}
      {dateScript}
      {timeScript}
    </>
  )
}

let routes: Routes = {
  '/shop/:shop_slug/service/:service_slug/available_timeslot': {
    streaming: false,
    resolve(context): ResolvedPageRoue {
      if (context.type != 'express') {
        return {
          title: apiEndpointTitle,
          description: 'get available timeslot with reminding quota',
          node: 'expect ajax GET request',
        }
      }
      let { shop_slug, service_slug } = context.routerMatch?.params
      let shop = find(proxy.shop, { slug: shop_slug })
      if (!shop) {
        context.res.json({ error: 'shop not found' })
        throw EarlyTerminate
      }
      let service = find(proxy.service, {
        shop_id: shop.id!,
        slug: service_slug,
      })
      if (!service) {
        context.res.json({ error: 'service not found' })
        throw EarlyTerminate
      }
      // TODO
      throw EarlyTerminate
    },
  },
}

export default { routes }
