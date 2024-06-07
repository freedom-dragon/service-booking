import { DAY, MINUTE } from '@beenotung/tslib/time.js'
import { Service, proxy } from '../../../db/proxy.js'
import { Script } from './script.js'
import { o } from '../jsx/jsx.js'
import { fromDatePart } from '../format/date.js'
import { ResolvedPageRoue, Routes } from '../routes.js'
import { apiEndpointTitle } from '../../config.js'
import { find } from 'better-sqlite3-proxy'
import { EarlyTerminate } from '../../exception.js'
import { HttpError } from '../../exception.js'
import { dateString } from 'cast.ts'
import { DynamicContext } from '../context.js'
import {
  AvailableHour,
  selectAvailableDates,
  selectAvailableHours,
} from '../booking-store.js'
import type {
  SweetAlertIcon,
  SweetAlertOptions,
} from 'sweetalert2-unrestricted'

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

  let availableDates = selectAvailableDates({ service_id: service.id! })

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
    var availableDates = ${JSON.stringify(availableDates)};
    var book_duration_ms = ${service.book_duration_minute * MINUTE};
    var book_time_step_ms = ${15 * MINUTE};
    ${attrs.datePicker}.isDateEnabled = (${function (
      dates: typeof availableDates,
    ) {
      return function isDateEnabled(dateString: string) {
        let date = new Date(dateString)
        let today = new Date()
        today.setHours(0, 0, 0, 0)
        if (date.getTime() < today.getTime()) {
          return false
        }
        let day = date.getDay()
        for (let timeslot of dates) {
          if (
            timeslot.start_date <= dateString &&
            dateString <= timeslot.end_date &&
            timeslot.weekdays.includes('日一二三四五六'[day])
          ) {
            return true
          }
        }
      }
    }})(availableDates);
    var ${attrs.onSelectDateFn} = (${function (
      timeRadioGroup: HTMLElement,
      bookingForm: HTMLFormElement,
      selectedTimeButton: HTMLFormElement,
      shop_slug: string,
      service_slug: string,
      price_unit: string,
    ) {
      return async function onDateSelected(event: any) {
        let dateString = event.detail.value as string
        if (!dateString) return
        dateString = dateString.split('T')[0]

        let url =
          '/shop/:shop_slug/service/:service_slug/date/:date/available_timeslot'
            .replace(':shop_slug', shop_slug)
            .replace(':service_slug', service_slug)
            .replace(':date', dateString)

        let res = await fetch(url)
        let json = await res.json()
        if (json.error) {
          showToast(json.error, 'error')
          return
        }
        let hours = json.hours as AvailableHour[]

        let isTimeAllowed = false

        timeRadioGroup.querySelectorAll('ion-item').forEach(e => e.remove())
        for (let hour of hours) {
          let item = document.createElement('ion-item')
          let radio = document.createElement('ion-radio') as HTMLInputElement
          radio.value = hour.start_time
          if (hour.start_time == bookingForm.time.value) {
            isTimeAllowed = true
          }
          radio.textContent = `${hour.start_time} - ${hour.end_time} (剩餘 ${hour.quota} ${price_unit})`
          item.appendChild(radio)
          timeRadioGroup.appendChild(item)
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
      ${JSON.stringify(service.shop!.slug)},
      ${JSON.stringify(service.slug)},
      ${JSON.stringify(service.price_unit)},
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

let dateStringParser = dateString()

function getAvailableTimeslot(context: DynamicContext): ResolvedPageRoue {
  if (context.type != 'express') {
    return {
      title: apiEndpointTitle,
      description: 'get available timeslot with reminding quota',
      node: 'expect ajax GET request',
    }
  }
  let { shop_slug, service_slug, date } = context.routerMatch?.params

  let dateString = dateStringParser.parse(date)
  let start_time = fromDatePart(dateStringParser.parse(date)).getTime()
  let end_time = start_time + DAY

  let shop = find(proxy.shop, { slug: shop_slug })
  if (!shop) throw new HttpError(404, 'shop not found')

  let service = find(proxy.service, {
    shop_id: shop.id!,
    slug: service_slug,
  })
  if (!service) throw new HttpError(404, 'service not found')

  let hours = selectAvailableHours({ service_id: service.id!, dateString })
  context.res.json({ hours })
  throw EarlyTerminate
}

let routes: Routes = {
  '/shop/:shop_slug/service/:service_slug/date/:date/available_timeslot': {
    streaming: false,
    resolve: getAvailableTimeslot,
  },
}

export default { routes }

declare function showToast(
  title: SweetAlertOptions['title'],
  icon: SweetAlertIcon,
): void
