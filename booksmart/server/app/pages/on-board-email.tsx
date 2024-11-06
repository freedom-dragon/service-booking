import { LayoutType, apiEndpointTitle, config, title } from '../../config.js'
import { commonTemplatePageText } from '../components/common-template.js'
import { Link, Redirect } from '../components/router.js'
import Style from '../components/style.js'
import {
  Context,
  DynamicContext,
  getContextFormBody,
  getId,
  getStringCasual,
  WsContext,
} from '../context.js'
import { EarlyTerminate } from '../../exception.js'
import { o } from '../jsx/jsx.js'
import { find } from 'better-sqlite3-proxy'
import { proxy, User } from '../../../db/proxy.js'
import { ServerMessage } from '../../../client/types.js'
import { is_email } from '@beenotung/tslib'
import { Raw } from '../components/raw.js'
import { hashPassword } from '../../hash.js'
import { Routes, StaticPageRoute } from '../routes.js'
import { Node } from '../jsx/types.js'
import { renderError } from '../components/error.js'
import { getWsCookies } from '../cookie.js'
import { getAuthUserId } from '../auth/user.js'
import { UserMessageInGuestView } from './profile.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { wsStatus } from '../components/ws-status.js'
import { LoginLink, loginRouteUrl } from './login.js'
import { toRouteUrl } from '../../url.js'
import verificationCode from './verification-code.js'
import { getContextShop } from '../auth/shop.js'
import { loadClientPlugin } from '../../client-plugin.js'
import onBoardAccount from './on-board-account.js'

let style = Style(/* css */ `
  .oauth-provider-list a {
    display: inline-flex;
    align-items: center;
    border: 1px solid #888;
    padding: 0.25rem;
    border-radius: 0.25rem;
    margin: 0.25rem;
  }
  #OnBoardEmail form .field {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  #OnBoardEmail form .field input {
    margin: 0.25rem 0;
  }
  #OnBoardEmail form .field .space {
    width: 4rem;
  }
  #OnBoardEmail form .field .msg {
    align-self: end;
    margin-bottom: 0.25rem;
  }
  #OnBoardEmail form .field .extra {
    color: darkred;
    display: block;
    margin-top: 0.25rem;
  }
  #OnBoardEmail .hint {
    border-inline-start: 3px solid #748;
    background-color: #edf;
    padding: 1rem;
    margin: 0.5rem 0;
    width: fit-content;
  }

  `)

let OnBoardEmailPage = (
  <div id="OnBoardEmail">
    {style}
    <h1>Continue with Email on {config.short_site_name}</h1>
    <p hidden>{commonTemplatePageText}</p>
    <p>
      Welcome to {config.short_site_name}!
      <br />
      Let's begin the adventure~
    </p>
    <Main />
  </div>
)
if (config.layout_type === LayoutType.ionic) {
  OnBoardEmailPage = (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton href="/" backText="Home" color="light" />
          <ion-title>Continue With Email</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <div id="OnBoardEmail">
          <p hidden>{commonTemplatePageText}</p>
          <p>
            Welcome to {config.short_site_name}!
            <br />
            Let's begin the adventure~
          </p>
          <Main />
        </div>
      </ion-content>
    </>
  )
}

function Main(_attrs: {}, context: DynamicContext) {
  //let shop = getContextShop(context)
  let user_id = getAuthUserId(context)
  // if (user_id) {
  //   return (
  //     <Redirect href={toRouteUrl(onBoardAccount.routes, '/on-board/account')} />
  //   )
  //   // <UserMessageInGuestView user_id={user_id} />
  // }
  return (
    <>
      {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
      <div>Continue with:</div>
      <form
        method="POST"
        action={toRouteUrl(
          verificationCode.routes,
          '/merchant/verify/email/submit',
        )}
        onsubmit="emitForm(event)"
      >
        {emailFormBody}
      </form>
      {wsStatus.safeArea}
    </>
  )
}

let emailFormBody = (
  <>
    <Field
      label="Email"
      type="email"
      name="email"
      msgId="emailMsg"
      oninput="emit('/on-board/email/check-email', this.value)"
      autocomplete="email"
    />
    {config.layout_type !== LayoutType.ionic ? (
      <div class="field">
        <label>郵件可能會被當成垃圾郵件處理，請檢查垃圾郵件信箱。</label>
        {/* <label>
          <input type="checkbox" name="include_link" /> Include magic link (more
          convince but may be treated as spam)
        </label> */}
      </div>
    ) : (
      <ion-item>
        <ion-label>
          郵件可能會被當成垃圾郵件處理，請檢查垃圾郵件信箱。
        </ion-label>
        {/* <ion-checkbox slot="start" name="include_link" />
        <ion-label>
          Include magic link (more convince but may be treated as spam)
        </ion-label> */}
      </ion-item>
    )}
    {config.layout_type !== LayoutType.ionic ? (
      <input type="submit" value="Verify" />
    ) : (
      <ion-button type="submit" class="ion-margin" fill="block" color="primary">
        Verify
      </ion-button>
    )}
  </>
)

type InputContext = Context & {
  contextError?: ContextError
  values?: Record<string, string | number>
}
type ContextError = Record<string, ValidateResult>

type ValidateResult =
  | { type: 'error'; text: string; extra?: string }
  | {
      type: 'found'
      text: string
      user: User
      extra?: string
    }
  | { type: 'ok'; text: string; extra?: string }

let minUsername = 1
let maxUsername = 32

function renderErrorMessage(id: string, result: ValidateResult | undefined) {
  if (!result) {
    return <div id={id} class="msg"></div>
  }

  return (
    <div
      id={id}
      class="msg"
      style={result.type == 'ok' ? 'color:green' : 'color:red'}
    >
      {result.text}
      {result.extra && <span class="extra">{result.extra}</span>}
    </div>
  )
}

function Field(
  attrs: {
    label: string
    type?: string
    name: string
    oninput: string
    msgId: string
    autocomplete?: string
  },
  context: InputContext,
) {
  let value = context.values?.[attrs.name]
  let validateResult = context.contextError?.[attrs.msgId]
  if (config.layout_type === LayoutType.ionic) {
    return (
      <>
        <ion-item>
          <ion-input
            type={attrs.type}
            name={attrs.name}
            oninput={attrs.oninput}
            value={value}
            autocomplete={attrs.autocomplete}
            label={attrs.label}
            label-placement="floating"
          />
        </ion-item>
        <div style="margin-inline-start: 1rem">
          {renderErrorMessage(attrs.msgId, validateResult)}
        </div>
      </>
    )
  }
  return (
    <div class="field">
      <label>
        {attrs.label}
        <div>
          <input
            type={attrs.type}
            name={attrs.name}
            oninput={attrs.oninput}
            value={value}
            autocomplete={attrs.autocomplete}
          />
        </div>
      </label>
      <div class="space"></div>
      {renderErrorMessage(attrs.msgId, validateResult)}
    </div>
  )
}

function validateEmail(email: string): ValidateResult {
  if (!email) {
    return { type: 'ok', text: '' }
  }

  if (!is_email(email)) {
    return {
      type: 'error',
      text: 'invalid email, the format should be "user@example.net"',
    }
  }

  let user = find(proxy.user, { email })
  // if (user) {
  //   return {
  //     type: 'found' as const,
  //     text: `email "${email}" is already used`,
  //     user,
  //   }
  // }

  return { type: 'ok', text: `email "${email}" is valid` }
}
function CheckEmail(_: {}, context: WsContext) {
  let email = context.args?.[0] as string
  validateInput({
    context,
    value: email,
    field: 'email',
    selector: '#emailMsg',
    validate: validateEmail,
  })
}

function validateInput(input: {
  context: WsContext
  field: string
  value: string | void
  selector: string
  validate: (value: string) => ValidateResult
}) {
  let { context, value, selector } = input

  if (typeof value !== 'string' || value.length == 0) {
    context.ws.send(['update-text', selector, ``])
    throw EarlyTerminate
  }

  let result = input.validate(value)

  if (result.type == 'ok') {
    context.ws.send([
      'batch',
      [
        ['update-text', selector, result.text],
        ['update-attrs', selector, { style: 'color:green' }],
      ],
    ])

    throw EarlyTerminate
  }

  if (result.type == 'error' || result.type == 'found') {
    sendInvalidMessage({
      context,
      selector,
      text: result.text,
      extra: result.extra,
    })
  }
}

function sendInvalidMessage(input: {
  context: WsContext
  text: string
  selector: string
  extra?: string
}) {
  let { context, text, selector, extra } = input

  let messages: ServerMessage[] = [
    ['update-text', selector, text],
    ['update-attrs', selector, { style: 'color:red' }],
  ]
  if (extra) {
    messages.push([
      'append',
      selector,
      [
        'span',
        {
          class: 'extra',
        },
        [extra],
      ],
    ])
  }
  context.ws.send(['batch', messages])
  throw EarlyTerminate
}

let routes: Routes = {
  '/on-board/email': {
    title: title('Email Registration'),
    description: `Register to access exclusive content and functionality. Join our community on ${config.short_site_name}.`,
    guestOnly: true,
    node: OnBoardEmailPage,
  },
  '/on-board/email/check-email': {
    title: apiEndpointTitle,
    description: 'validate email and check availability',
    node: <CheckEmail />,
  },
}
export default { routes }
