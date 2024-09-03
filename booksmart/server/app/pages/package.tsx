import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import {
  DynamicContext,
  getContextFormBody,
  getStringCasual,
} from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import {
  array,
  date,
  float,
  id,
  int,
  object,
  optional,
  string,
  toDateString,
  values,
} from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { AppTabBar } from '../components/app-tab-bar.js'
import { toRouteUrl } from '../../url.js'
import { getAuthRole } from '../auth/role.js'
import {
  Package,
  PackageService,
  Shop,
  User,
  proxy,
} from '../../../db/proxy.js'
import { filter, find } from 'better-sqlite3-proxy'
import { DAY, MONTH, WEEK, YEAR } from '@beenotung/tslib/time.js'
import { MessageException } from '../../exception.js'
import { formatHKDateString } from '../format/date.js'
import { TimezoneDate } from 'timezone-date.ts'
import { Script } from '../components/script.js'
import { formatDuration } from '../format/duration.js'
import { IonButton } from '../components/ion-button.js'
import login from './login.js'
import { ServerMessage } from '../../../client/types.js'

let pageTitle = '套票'
let addPageTitle = '新增套票'
let editPageTitle = '編輯套票'

let style = Style(/* css */ `
#Package .service-list {
  margin: 0;
}
`)

let script = Script(/* javascript */ `
document.querySelector('ion-card-title[color="success"]')?.scrollIntoView({
  behavior: 'smooth',
  block: 'center',
})
`)

let page = (
  <>
    {style}
    <Page />
    <ion-footer>
      <AppTabBar />
      {selectIonTab('package')}
    </ion-footer>
    {script}
    {fitIonFooter}
  </>
)

function Page(attrs: {}, context: DynamicContext) {
  let { shop, user, is_owner } = getAuthRole(context)
  let packages = filter(proxy.package, { shop_id: shop.id! })
    .sort((a, b) => b.id! - a.id!)
    .map(pkg => ({
      pkg,
      services: filter(proxy.package_service, { package_id: pkg.id! }),
    }))
  if (!is_owner) {
    packages = packages.filter(item => item.services.length > 0)
  }
  let params = new URLSearchParams(context.routerMatch?.search)
  let id = params.get('id')
  return (
    <>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title role="heading" aria-level="1">
            {pageTitle}
          </ion-title>
          {is_owner ? (
            <ion-buttons slot="end">
              <Link
                tagName="ion-button"
                href={toRouteUrl(routes, '/shop/:shop_slug/package/add', {
                  params: { shop_slug: shop.slug },
                })}
              >
                {addPageTitle}
              </Link>
            </ion-buttons>
          ) : null}
        </ion-toolbar>
      </ion-header>
      <ion-content id="Package" class="ion-padding">
        {is_owner ? AdminPage(shop, context) : UserPage(user, context)}
        {packages.length == 0 ? (
          <ion-note>未有套票</ion-note>
        ) : (
          <ion-list>
            {mapArray(packages, ({ pkg, services }) => {
              let tickets = filter(proxy.ticket, {
                package_id: pkg.id!,
                user_id: user?.id!,
              })
              return (
                <ion-card>
                  <ion-card-title
                    class="ion-margin-top ion-margin-start"
                    color={pkg.id == id ? 'success' : undefined}
                  >
                    {pkg.title}
                  </ion-card-title>
                  <ion-card-content>
                    {tickets.length > 0 ? <ion-badge>已購買</ion-badge> : null}
                    <div>$ {pkg.price}</div>
                    <div>
                      開售時期: {formatHKDateString(pkg.start_time)}
                      {' 至 '}
                      {formatHKDateString(pkg.end_time)}
                    </div>
                    <div>有效期限: {formatDuration(pkg.duration_time)}</div>
                    <div>
                      可選擇服務:{' '}
                      {services.length == 0 ? (
                        <ion-text color="danger">未設定</ion-text>
                      ) : (
                        <ul class="service-list">
                          {mapArray(services, row => {
                            return <li>{row.service!.name}</li>
                          })}
                        </ul>
                      )}
                    </div>
                    {is_owner ? (
                      <IonButton
                        url={toRouteUrl(
                          routes,
                          '/shop/:shop_slug/package/:package_id/edit',
                          {
                            params: {
                              shop_slug: shop.slug,
                              package_id: pkg.id!,
                            },
                          },
                        )}
                        expand="block"
                      >
                        編輯
                      </IonButton>
                    ) : (
                      <IonButton
                        url={toRouteUrl(
                          routes,
                          '/shop/:shop_slug/package/:package_id/purchase',
                          {
                            params: {
                              shop_slug: shop.slug,
                              package_id: pkg.id!,
                            },
                          },
                        )}
                        expand="block"
                      >
                        購買
                      </IonButton>
                    )}
                  </ion-card-content>
                </ion-card>
              )
            })}
          </ion-list>
        )}
      </ion-content>
    </>
  )
}

function AdminPage(shop: Shop, context: DynamicContext) {
  return <></>
}

function UserPage(shop: User | null, context: DynamicContext) {
  return <></>
}

function DetailPage(attrs: {}, context: DynamicContext) {
  let { shop, is_owner } = getAuthRole(context)
  let package_id: string | null = context.routerMatch?.params.package_id
  let tab_url = toRouteUrl(routes, '/shop/:shop_slug/package', {
    params: {
      shop_slug: shop.slug,
    },
  })
  if (!is_owner) return <Redirect href={tab_url} />
  let pkg = package_id ? proxy.package[+package_id] : null
  let duration_unit_value = DAY
  let duration_unit_name = 'month'
  if (pkg) {
    for (let unit_name in duration_units) {
      let unit_value = duration_units[unit_name as keyof typeof duration_units]
      if (pkg.duration_time >= unit_value) {
        duration_unit_value = unit_value
        duration_unit_name = unit_name
      }
    }
  }
  let services = filter(proxy.service, { shop_id: shop.id! })
  let selected_service_ids = pkg
    ? filter(proxy.package_service, { package_id: pkg.id! }).map(
        ps => ps.service_id,
      )
    : []
  return (
    <>
      {Style(/* css */ `
#AddPackage .hint {
  margin-inline-start: 1rem;
  margin-block: 0.25rem;
}
`)}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton href={tab_url} backText={pageTitle} color="light" />
          <ion-title role="heading" aria-level="1">
            {pkg ? editPageTitle : addPageTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="AddPackage" class="ion-padding" color="light">
        <form
          method="POST"
          action={toRouteUrl(routes, '/shop/:shop_slug/package/submit', {
            params: {
              shop_slug: shop.slug,
            },
          })}
          onsubmit="emitForm(event)"
        >
          {pkg ? <input type="hidden" name="id" value={pkg.id} /> : null}
          <h2 class="ion-margin">套票資料</h2>
          <ion-list lines="full" inset="true">
            <ion-item>
              <ion-input
                name="title"
                label="套票標題"
                required
                minlength="1"
                maxlength="50"
                placeholder="如: 限時任玩"
                value={pkg?.title}
              />
            </ion-item>
            <ion-note class="item--hint">一次收費可多次享用服務</ion-note>
            <ion-item>
              <ion-input
                name="price"
                label="套票價錢"
                required
                min="0"
                placeholder="HKD$"
                value={pkg?.price}
              />
            </ion-item>
            <ion-item>
              <div slot="start">有效期限</div>
              <div style="flex-grow: 1"></div>
              <ion-input
                placeholder="1"
                type="number"
                min="1"
                style="text-align: end"
                name="duration_time_value"
                value={
                  pkg ? pkg.duration_time / duration_unit_value : undefined
                }
              />
              <div>個</div>
              <ion-select
                placeholder="單位"
                value={duration_unit_name}
                name="duration_time_unit"
              >
                <ion-select-option value="day">日</ion-select-option>
                <ion-select-option value="week">周</ion-select-option>
                <ion-select-option value="month">月</ion-select-option>
                <ion-select-option value="year">年</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>開售日期</ion-label>
              <ion-datetime-button datetime="startTime" />
              <ion-modal>
                <ion-datetime
                  id="startTime"
                  presentation="date"
                  show-default-buttons="true"
                  name="start_time"
                  value={
                    pkg
                      ? toDateString(new Date(pkg.start_time))
                      : toDateString(new Date())
                  }
                />
              </ion-modal>
            </ion-item>
            <ion-item>
              <ion-label>完結日期</ion-label>
              <ion-datetime-button datetime="endTime" />
              <ion-modal>
                <ion-datetime
                  id="endTime"
                  presentation="date"
                  show-default-buttons="true"
                  name="end_time"
                  value={
                    pkg
                      ? toDateString(new Date(pkg.end_time))
                      : toDateString(new Date(Date.now() + 1 * MONTH))
                  }
                />
              </ion-modal>
            </ion-item>
          </ion-list>
          <h2 class="ion-margin">可選擇服務</h2>
          <ion-list lines="full" inset="true">
            {mapArray(services, service => (
              <ion-item onclick="selectService(event)">
                <ion-label>
                  {service.name} ({service.slug})
                </ion-label>
                <ion-checkbox
                  slot="end"
                  name="service_ids"
                  value={service.id}
                  checked={selected_service_ids.includes(service.id!)}
                  onclick="event.stopPropagation()"
                />
              </ion-item>
            ))}
          </ion-list>
          <p id="submitMessage"></p>
          <div style="text-align: center">
            <ion-button type="submit">{pkg ? '更新' : '新增'}</ion-button>
          </div>
        </form>
      </ion-content>
      {Script(/* javascript */ `
function selectService(event) {
  let item = event.target.closest('ion-item')
  let checkbox = item.querySelector('ion-checkbox')
  checkbox.checked = !checkbox.checked
}
      `)}
    </>
  )
}

let submitParser = object({
  id: optional(id()),
  title: string({ minLength: 1, maxLength: 50 }),
  price: float({ min: 0 }),
  start_time: date(),
  end_time: date(),
  duration_time_unit: values([
    'day' as const,
    'week' as const,
    'month' as const,
    'year' as const,
  ]),
  service_ids: array(string()),
})

let duration_units = {
  day: DAY,
  week: WEEK,
  month: MONTH,
  year: YEAR,
}

function SubmitPackage(attrs: {}, context: DynamicContext) {
  try {
    let { user, shop, is_owner } = getAuthRole(context)
    if (!user) throw 'You must be logged in to submit ' + pageTitle
    if (!is_owner) throw 'Only shop owner can submit new package'
    let body = getContextFormBody(context)
    let input = submitParser.parse(body)

    let startDate = new TimezoneDate(input.start_time.getTime())
    startDate.timezone = +8
    startDate.setHours(0, 0, 0, 0)

    let endDate = new TimezoneDate(input.end_time.getTime())
    endDate.timezone = +8
    endDate.setHours(0, 0, 0, 0)

    let duration_value = +getStringCasual(body, 'duration_time_value') || 1
    let duration_unit = duration_units[input.duration_time_unit]

    let row: Package = {
      shop_id: shop.id!,
      title: input.title,
      price: input.price,
      start_time: startDate.getTime(),
      end_time: endDate.getTime() + DAY - 1,
      duration_time: duration_value * duration_unit,
    }

    let id = input.id
    if (id) {
      let pkg = proxy.package[id]
      if (!pkg) throw `Package #${id} not found`
      if (pkg.shop_id !== shop.id)
        throw `Package #${id} does not belong to current shop`
      Object.assign(pkg, row)
    } else {
      id = proxy.package.push(row)
    }

    let service_ids = input.service_ids.map(id => +id).filter(id => id)

    filter(proxy.package_service, { package_id: id }).forEach(row => {
      if (!service_ids.includes(row.service_id)) {
        delete proxy.package_service[row.id!]
      }
    })

    for (let service_id of service_ids) {
      let row = find(proxy.package_service, {
        package_id: id,
        service_id: +service_id,
      })
      if (!row) {
        proxy.package_service.push({
          package_id: id,
          service_id: +service_id,
          quantity: 0,
        })
      }
    }

    return (
      <Redirect
        href={toRouteUrl(routes, '/shop/:shop_slug/package', {
          params: { shop_slug: shop.slug },
          query: { id },
        })}
      />
    )
  } catch (error) {
    throw new MessageException(['update-text', '#submitMessage', String(error)])
  }
}

function SubmitPurchase(attrs: {}, context: DynamicContext) {
  let shop_slug: string | null = null
  try {
    let { user, shop, is_owner } = getAuthRole(context)

    shop_slug = shop.slug

    if (!user) throw 'You must be logged in to submit ' + pageTitle
    // if (!is_owner) throw 'Only shop owner can submit new package'

    let { package_id } = context.routerMatch?.params

    let pkg = proxy.package[package_id]
    if (!pkg) throw `Package #${package_id} not found`

    let now = Date.now()

    let id = proxy.ticket.push({
      package_id,
      user_id: user.id!,
      purchase_time: now,
      expire_time: now + pkg.duration_time,
    })

    console.log('ticket id:', id)

    // TODO do realtime update instead of redirect

    return (
      <Redirect
        href={toRouteUrl(routes, '/shop/:shop_slug/package', {
          params: { shop_slug: shop.slug },
          query: { id },
        })}
      />
    )
  } catch (error) {
    console.log('error:', error)
    let messages: ServerMessage[] = [
      ['eval', `showToast(${JSON.stringify(error)},'error')`],
    ]
    if (shop_slug) {
      messages.push([
        'redirect',
        toRouteUrl(login.routes, '/shop/:shop_slug/login', {
          params: {
            shop_slug,
          },
        }),
      ])
    }
    throw new MessageException(['batch', messages])
  }
}

function SubmitResult(attrs: {}, context: DynamicContext) {
  let params = new URLSearchParams(context.routerMatch?.search)
  let error = params.get('error')
  let id = params.get('id')
  return (
    <>
      <ion-header>
        <ion-toolbar>
          <IonBackButton href="/package/add" backText="Form" />
          <ion-title role="heading" aria-level="1">
            Submitted {pageTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="AddPackage" class="ion-padding">
        {error ? (
          renderError(error, context)
        ) : (
          <>
            <p>Your submission is received (#{id}).</p>
            <Link href="/package" tagName="ion-button">
              Back to {pageTitle}
            </Link>
          </>
        )}
      </ion-content>
    </>
  )
}

let routes = {
  '/shop/:shop_slug/package': {
    title: title(pageTitle),
    description: 'see list of packages of the current shop',
    node: page,
  },
  '/shop/:shop_slug/package/add': {
    title: title(addPageTitle),
    description: 'create new package by shop owner',
    node: <DetailPage />,
    streaming: false,
  },
  '/shop/:shop_slug/package/:package_id/edit': {
    title: title(editPageTitle),
    description: 'edit package by shop owner',
    node: <DetailPage />,
    streaming: false,
  },
  '/shop/:shop_slug/package/submit': {
    title: apiEndpointTitle,
    description: 'submit new package or edit existing package by shop owner',
    node: <SubmitPackage />,
    streaming: false,
  },
  '/shop/:shop_slug/package/:package_id/purchase': {
    title: apiEndpointTitle,
    description: '',
    node: <SubmitPurchase />,
    streaming: false,
  },
  '/package/result': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <SubmitResult />,
    streaming: false,
  },
} satisfies Routes

export default { routes }
