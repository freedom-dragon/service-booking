import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { Context, DynamicContext, getContextFormBody } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { object, string } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { TimezoneDate } from 'timezone-date.ts'
import { DAY } from '@beenotung/tslib/time.js'
import { appIonTabBar } from '../components/app-tab-bar.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'

let pageTitle = '我的預約'
let addPageTitle = 'Add Calendar'

let style = Style(/* css */ `
hr {
  border-bottom: 1px solid var(--ion-color-dark);
}
#Calendar {

}
`)

let page = (
  <>
    {style}
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title role="heading" aria-level="1">
          {pageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="Calendar" class="ion-padding">
      <Main />
    </ion-content>
    <ion-footer>
      {appIonTabBar}
      {selectIonTab('calendar')}
    </ion-footer>
    {fitIonFooter}
  </>
)

let items = [
  { title: 'Android', slug: 'md' },
  { title: 'iOS', slug: 'ios' },
]

let calendarStyle = Style(/* css */ `
.calendar--title {
  text-align: center;
}
.calendar--table {
  width: 100%;
}
.calendar--weekdays {
}
.calendar--weekday {
  outline: 1px solid #eee;
}
td.calendar--weekday * {
  width: 100%;
}
td.calendar--weekday ion-button {
  padding: 0.5rem;
}
.calendar--weekday {
  color: var(--ion-color-dark);
}
`)

function getWeeks(date: TimezoneDate) {
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  let month = date.getMonth()
  date.setTime(date.getTime() - DAY * date.getDay())
  let weeks: string[][] = []
  do {
    let week: string[] = []
    weeks.push(week)
    for (let i = 0; i < 7; i++) {
      if (date.getMonth() != month) {
        week.push('')
      } else {
        week.push(date.getDate().toString())
      }
      date.setTime(date.getTime() + DAY)
    }
  } while (date.getMonth() == month)
  return weeks
}

function Main(attrs: {}, context: Context) {
  let user = getAuthUser(context)
  let date = new TimezoneDate()
  date.timezone = +8
  let weeks = getWeeks(date)
  let todayDate = date.getDate()
  return (
    <>
      {calendarStyle}
      <h2 class="calendar--title">Today</h2>
      <table class="calendar--table" hidden>
        <thead>
          <tr class="calendar--weekdays">
            {mapArray(
              [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ],
              day => (
                <th class="calendar--weekday" title={day}>
                  {day[0]}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {mapArray(weeks, week => (
            <tr class="calendar--weekdays">
              {mapArray(week, (date, i) => (
                <td class="calendar--weekday">
                  <ion-buttons>
                    <ion-button
                      {...(+date == todayDate
                        ? {
                            fill: 'block',
                            shape: 'round',
                            color: 'primary',
                          }
                        : undefined)}
                    >
                      {date}
                    </ion-button>
                  </ion-buttons>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ion-list-header>Events</ion-list-header>
      <ion-list>
        <ion-item>No events yet.</ion-item>
      </ion-list>
      <ion-list-header hidden>Available Timeslots</ion-list-header>
      <ion-list hidden>
        <ion-item>9am - 12nn</ion-item>
      </ion-list>
      {user ? (
        <Link href="/calendar/add" tagName="ion-button">
          {addPageTitle}
        </Link>
      ) : (
        <p hidden>
          You can add event / available timeslot after{' '}
          <Link href="/login">login</Link>.
        </p>
      )}
    </>
  )
}

let addPage = (
  <>
    {Style(/* css */ `
#AddCalendar .hint {
  margin-inline-start: 1rem;
  margin-block: 0.25rem;
}
`)}
    <ion-header>
      <ion-toolbar>
        <IonBackButton href="/calendar" backText={pageTitle} />
        <ion-title role="heading" aria-level="1">
          {addPageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="AddCalendar" class="ion-padding">
      <form
        method="POST"
        action="/calendar/add/submit"
        onsubmit="emitForm(event)"
      >
        <ion-list>
          <ion-item>
            <ion-input
              name="title"
              label="Title*:"
              label-placement="floating"
              required
              minlength="3"
              maxlength="50"
            />
          </ion-item>
          <p class="hint">(3-50 characters)</p>
          <ion-item>
            <ion-input
              name="slug"
              label="Slug*: (unique url)"
              label-placement="floating"
              required
              pattern="(\w|-|\.){1,32}"
            />
          </ion-item>
          <p class="hint">
            (1-32 characters of: <code>a-z A-Z 0-9 - _ .</code>)
          </p>
        </ion-list>
        <div style="margin-inline-start: 1rem">
          <ion-button type="submit">Submit</ion-button>
        </div>
        <p>
          Remark:
          <br />
          *: mandatory fields
        </p>
      </form>
    </ion-content>
  </>
)

function AddPage(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user) return <Redirect href="/login" />
  return addPage
}

let submitParser = object({
  title: string({ minLength: 3, maxLength: 50 }),
  slug: string({ match: /^[\w-]{1,32}$/ }),
})

function Submit(attrs: {}, context: DynamicContext) {
  try {
    let user = getAuthUser(context)
    if (!user) throw 'You must be logged in to submit ' + pageTitle
    let body = getContextFormBody(context)
    let input = submitParser.parse(body)
    let id = items.push({
      title: input.title,
      slug: input.slug,
    })
    return <Redirect href={`/calendar/result?id=${id}`} />
  } catch (error) {
    return (
      <Redirect
        href={
          '/calendar/result?' + new URLSearchParams({ error: String(error) })
        }
      />
    )
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
          <IonBackButton href="/calendar/add" backText="Form" />
          <ion-title role="heading" aria-level="1">
            Submitted {pageTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="AddCalendar" class="ion-padding">
        {error ? (
          renderError(error, context)
        ) : (
          <>
            <p>Your submission is received (#{id}).</p>
            <Link href="/calendar" tagName="ion-button">
              Back to {pageTitle}
            </Link>
          </>
        )}
      </ion-content>
    </>
  )
}

let routes: Routes = {
  '/calendar': {
    title: title(pageTitle),
    description: 'TODO',
    menuText: pageTitle,
    menuFullNavigate: true,
    node: page,
  },
  '/calendar/add': {
    title: title(addPageTitle),
    description: 'TODO',
    node: <AddPage />,
    streaming: false,
  },
  '/calendar/add/submit': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <Submit />,
    streaming: false,
  },
  '/calendar/result': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <SubmitResult />,
    streaming: false,
  },
}

export default { routes }
