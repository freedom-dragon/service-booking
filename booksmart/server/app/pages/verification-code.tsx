import { Random, digits } from '@beenotung/tslib/random.js'
import { MINUTE } from '@beenotung/tslib/time.js'
import { db } from '../../../db/db.js'
import { HttpError } from '../../exception.js'
import { Shop, User, proxy } from '../../../db/proxy.js'
import { boolean, email, object, optional, string } from 'cast.ts'
import { sendEmail } from '../../email.js'
import { apiEndpointTitle, config, title } from '../../config.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  getContextFormBody,
} from '../context.js'
import { Routes, StaticPageRoute } from '../routes.js'
import { o } from '../jsx/jsx.js'
import { Link, Redirect } from '../components/router.js'
import { nodeToHTML } from '../jsx/html.js'
import Style from '../components/style.js'
import { Node } from '../jsx/types.js'
import { renderError } from '../components/error.js'
import { debugLog } from '../../debug.js'
import { filter, find } from 'better-sqlite3-proxy'
import { writeUserIdToCookie } from '../auth/user.js'
import { env } from '../../env.js'
import { MessageException } from '../../exception.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib/validate.js'
import { loginRouteUrl } from './login.js'
import { toRouteUrl } from '../../url.js'
import { getContextShop } from '../auth/shop.js'
import { toShopUrl } from '../app-url'
import profile from './profile.js'
import serviceDetail from './service-detail.js'
import shopHome from './shop-home.js'
import { findUserByTel } from '../user-store.js'

let log = debugLog('app:verification-code')
log.enabled = true

export const PasscodeLength = 6
export const PasscodeRegex = /[0-9]{6}/
export const PasscodeExpireDuration = 5 * MINUTE
const MaxPasscodeInputAttempt = 5
const MaxPasscodeGenerationAttempt = 1e6

let cleanup_passcode = db.prepare(/* sql */ `
delete from verification_code
where request_time <= :request_time
`)

let check_passcode_clash = db
  .prepare(
    /* sql */ `
select count(id) as count
from verification_code
where request_time > :request_time
  and passcode = :passcode
`,
  )
  .pluck()

export function generatePasscode(): string {
  for (let i = 0; i < MaxPasscodeGenerationAttempt; i++) {
    let passcode = Random.nextString(PasscodeLength, digits)

    // skip passcode with leading zero
    if (String(+passcode) !== passcode) continue

    // retry if clash with active passcode
    let count = check_passcode_clash.get({
      request_time: Date.now() - PasscodeExpireDuration,
      passcode,
    }) as number
    if (count > 0) continue

    return passcode
  }
  throw new HttpError(503, 'passcode pool is full')
}

let requestEmailVerificationParser = object({
  tel: optional(string()),
  email: optional(string()),
  include_link: optional(boolean()),
  // shop_slug: string(),
})
let email_parser = email()

async function requestEmailVerification(
  shop: Shop | null,
  context: DynamicContext,
): Promise<StaticPageRoute> {
  try {
    let body = getContextFormBody(context)
    let input = requestEmailVerificationParser.parse(body, { name: 'body' })

    let user: User | undefined

    if (input.email) {
      let email: string
      try {
        email = email_parser.parse(input.email)
      } catch (error) {
        throw new MessageException([
          'eval',
          `showToast('請檢查電郵地址的形式','warning')`,
        ])
      }
      user = find(proxy.user, { email })
      if (!user) {
        throw new MessageException([
          'eval',
          `showToast('這個電郵址未有登記。你可以在預約時自動登記。','info')`,
        ])
      }
    } else if (input.tel) {
      let tel = to_full_hk_mobile_phone(input.tel)
      if (!tel) {
        throw new MessageException([
          'eval',
          `showToast('請輸入香港的手提電話號碼','warning')`,
        ])
      }
      user = findUserByTel(tel)
      if (!user) {
        throw new MessageException([
          'eval',
          `showToast('這個電話號碼未有登記。你可以在預約時自動登記。','info')`,
        ])
      }
    } else {
      throw new MessageException([
        'eval',
        `showToast('請輸入電話號碼或電郵地址','warning')`,
      ])
    }
    let email = user.email
    if (!email) {
      throw new MessageException([
        'eval',
        `showToast('你未有登記電郵地址，請聯絡管理員跟進','error')`,
      ])
    }

    let passcode = generatePasscode()
    let request_time = Date.now()
    proxy.verification_code.push({
      passcode,
      email,
      request_time,
      revoke_time: null,
      match_id: null,
      user_id: user.id || null,
      shop_id: shop ? shop.id! : null,
    })
    let { html, text } = verificationCodeEmail(
      { passcode, email: input.include_link ? email : null, shop: shop },
      context,
    )
    let info = await sendEmail({
      from: env.EMAIL_USER,
      to: email,
      subject: title('電郵驗證 - Email Verification'),
      html,
      text,
    })
    if (info.accepted[0] === email) {
      log('sent passcode email to:', email)
      if (
        env.EMAIL_USER == 'skip' &&
        context.type == 'ws' &&
        env.ORIGIN.includes('localhost')
      ) {
        context.ws.send([
          'eval',
          `alert('[dev] verification code: ${passcode}')`,
        ])
      }
    } else {
      log('failed to send email?')
      log('send email info:')
      console.dir(info, { depth: 20 })
      throw new HttpError(502, info.response)
    }
    return {
      title: title('電郵驗證 - Email Verification'),
      description:
        'API Endpoint to request email verification code for authentication',
      node: (
        <Redirect
          href={
            shop
              ? toRouteUrl(routes, '/shop/:shop_slug/verify/email/result', {
                  params: { shop_slug: shop.slug },
                  query: { email },
                })
              : toRouteUrl(routes, '/admin/verify/email/result', {
                  query: { email },
                })
          }
        />
      ),
    }
  } catch (error) {
    if (error instanceof MessageException) {
      throw error
    }
    return {
      title: title('電郵驗證'),
      description:
        'API Endpoint to request email verification code for authentication',
      node: (
        <Redirect
          href={
            shop
              ? toRouteUrl(routes, '/shop/:shop_slug/verify/email/result', {
                  params: { shop_slug: shop.slug },
                  query: {
                    error: String(error),
                  },
                })
              : toRouteUrl(routes, '/admin/verify/email/result', {
                  query: {
                    error: String(error),
                  },
                })
          }
        />
      ),
    }
  }
}

// TODO translate to zh-hk

export function verificationCodeEmail(
  attrs: { passcode: string; email: string | null; shop: Shop | null },
  context: DynamicContext,
) {
  let { shop } = attrs
  let url = attrs.email
    ? env.ORIGIN +
      (shop
        ? toRouteUrl(routes, '/shop/:shop_slug/verify/email/result', {
            params: { shop_slug: shop.slug },
            query: {
              code: attrs.passcode,
              email: attrs.email,
            },
          })
        : toRouteUrl(routes, '/admin/verify/email/result', {
            query: {
              code: attrs.passcode,
              email: attrs.email,
            },
          }))
    : null
  let node = (
    <div style="font-size: 1rem">
      <p>
        <code style="background-color: #eee; padding: 0.25rem; border-radius: 0.25rem">
          {attrs.passcode}
        </code>{' '}
        is your verification code.
      </p>
      <p>
        To complete the email verification process, please copy the code above
        and paste it to the form.
      </p>
      {url ? (
        <p>
          You can also verify your email by opening this link:{' '}
          <a href={url}>{url}</a>
        </p>
      ) : null}
      <p>
        If you did not request to authenticate on {config.site_name} (
        {config.short_site_name} in short), it is safe to ignore this email.
      </p>
    </div>
  )
  let html = nodeToHTML(node, context)
  let text = `
${attrs.passcode} is your verification code.

To complete the email verification process, please copy the code above and paste it to the form.

If you did not request to authenticate on ${config.site_name} (${config.short_site_name} in short), it is safe to ignore this email.
`.trim()
  return { html, text }
}

function verificationCodeSMS(attrs: { passcode: string }) {
  return `
${attrs.passcode} is your verification code.

If you did not request to authenticate on ${config.short_site_name}, it is safe to ignore this message.
`.trim()
}

let style = Style(/* css */ `
#verifyEmailPage form .field {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
#verifyEmailPage  form .field input {
  margin: 0.25rem 0;
}
`)

function VerifyEmailPage(
  attrs: { shop: Shop | null },
  context: DynamicContext,
) {
  let params = new URLSearchParams(context.routerMatch?.search)
  let error = params.get('error')
  let title = params.get('title')
  let node = (
    <div id="verifyEmailPage">
      {error ? (
        <>
          <p>{title || '無法將驗證碼發送到您的電郵地址。'}.</p>
          {renderError(error, context)}
          <p>
            您可以在「<Link href={loginRouteUrl(context)}>登入頁面</Link>
            」要求另一個驗證碼。
          </p>
        </>
      ) : (
        <>
          <p>
            <span style="display: inline-block">
              驗證碼已發送至您的電郵地址。
            </span>{' '}
            <span style="display: inline-block">
              請檢查您的收件匣和垃圾郵件資料夾。
            </span>
          </p>

          <VerifyEmailForm params={params} shop={attrs.shop} />
        </>
      )}
    </div>
  )
  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar>
          <ion-title role="heading" aria-level="1">
            電郵驗證
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">{node}</ion-content>
    </>
  )
}
function VerifyEmailForm(
  attrs: { params: URLSearchParams; shop: Shop | null },
  context: DynamicContext,
) {
  let shop = attrs.shop
  let { params } = attrs
  let email = params.get('email')
  let code = params.get('code')
  return (
    <form
      method="post"
      action={
        shop
          ? toRouteUrl(routes, '/shop/:shop_slug/verify/email/code/submit', {
              params: { shop_slug: shop.slug },
            })
          : toRouteUrl(routes, '/admin/verify/email/code/submit')
      }
    >
      {/* 
      <ion-list>
        <ion-item>
          <div slot="start">
            <ion-icon name="at-outline"></ion-icon> 電郵
          </div>
          <ion-input
            type="email"
            name="email"
            autocomplete="email"
            value={email}
            readonly
          />
        </ion-item>
        <ion-item>
          <div slot="start">
            <ion-icon name="at-outline"></ion-icon> 驗證碼
          </div>
          <ion-input
            type="text"
            name="code"
            autocomplete="off"
            minlength={PasscodeLength}
            maxlength={PasscodeLength}
            inputmode="numeric"
            placeholder={'x'.repeat(PasscodeLength)}
            required
            value={code}
          />
        </ion-item>
      </ion-list>
      */}
      <Field
        label="電郵地址"
        input={
          <input
            type="email"
            required
            name="email"
            value={email}
            readonly
            style={email ? `width: ${email.length + 2}ch` : undefined}
          />
        }
      />
      <Field
        label="驗證碼"
        input={
          <input
            style={`font-family: monospace; width: ${PasscodeLength + 2}ch; padding: 0.5ch`}
            minlength={PasscodeLength}
            maxlength={PasscodeLength}
            inputmode="numeric"
            name="code"
            placeholder={'x'.repeat(PasscodeLength)}
            required
            value={code}
            autocomplete="off"
          />
        }
      />
      <div>
        <input type="submit" value="驗證" />
      </div>
    </form>
  )
}

function Field(attrs: { label: string; input: Node }) {
  return (
    <div class="field">
      <label>
        {attrs.label}
        <div>{attrs.input}</div>
      </label>
    </div>
  )
}

let count_attempts_by_email = db
  .prepare(
    /* sql */ `
with verification_code_id as (
select id
from verification_code
where email = :email
  and revoke_time is null
order by id desc
limit 1
)
select count(*)
from verification_attempt
inner join verification_code on verification_code.id in (select id from verification_code_id)
where verification_attempt.created_at >= verification_code.created_at
`,
  )
  .pluck()

let revoke_verification_code_by_email = db.prepare(/* sql */ `
update verification_code
set revoke_time = :revoke_time
where email = :email
  and revoke_time is null
`)

let checkEmailVerificationCodeParser = object({
  email: email(),
  code: string({
    minLength: PasscodeLength,
    maxLength: PasscodeLength,
    match: PasscodeRegex,
  }),
})

type LastBookingRow = {
  service_slug: string
}
let select_last_booking_by_user_id = db.prepare(/* sql */ `
select
  service.slug as service_slug
from booking
inner join service on service.id = booking.service_id
inner join shop on shop.id = service.shop_id
where booking.user_id = :user_id
  and booking.approve_time is null
  and booking.reject_time is null
  and booking.cancel_time is null
  and booking.id not in (select booking_id from receipt)
order by booking.id desc
limit 1
`)

async function checkEmailVerificationCode(
  shop: Shop | null,
  context: DynamicContext,
): Promise<StaticPageRoute> {
  let res = (context as ExpressContext).res
  let email: string | null = null
  try {
    let body = getContextFormBody(context)
    let input = checkEmailVerificationCodeParser.parse(body)
    email = input.email

    let is_too_much_attempt = false
    let is_expired = false
    let user_id: number | null = null

    db.transaction(() => {
      let now = Date.now()

      let attempt_id = proxy.verification_attempt.push({
        passcode: input.code,
        email: input.email,
      })

      let attempts = count_attempts_by_email.get({ email }) as number
      if (attempts > MaxPasscodeInputAttempt) {
        is_too_much_attempt = true
        revoke_verification_code_by_email.run({ email, revoke_time: now })
        return
      }

      let verification_code_rows = filter(proxy.verification_code, {
        email: input.email,
        revoke_time: null,
        match_id: null,
      })
      if (verification_code_rows.length == 0) {
        is_expired = true
        return
      }
      for (let verification_code of verification_code_rows) {
        if (verification_code.passcode != input.code) {
          continue
        }
        if (now - verification_code.request_time >= PasscodeExpireDuration) {
          verification_code.revoke_time = now
          is_expired = true
          continue
        }
        verification_code.revoke_time = now
        verification_code.match_id = attempt_id
        user_id =
          find(proxy.user, { email: input.email })?.id ||
          proxy.user.push({
            email: input.email,
            username: null,
            password_hash: null,
            tel: null,
            avatar: null,
            nickname: null,
            is_admin: false,
          })
        break
      }
    })()
    if (!user_id) {
      throw new HttpError(
        400,
        is_too_much_attempt
          ? '過多不匹配的嘗試。'
          : is_expired
            ? '驗證碼已過期。'
            : '驗證碼不匹配。',
      )
    }
    writeUserIdToCookie(res, user_id)
    let lastBooking =
      (select_last_booking_by_user_id.get({ user_id }) as LastBookingRow) ||
      null
    return {
      title: apiEndpointTitle,
      description:
        'API Endpoint to submit email verification code for authentication',
      node: (
        <Redirect
          href={
            !shop
              ? toRouteUrl(profile.routes, '/admin/profile')
              : lastBooking
                ? toRouteUrl(
                    serviceDetail.routes,
                    '/shop/:shop_slug/service/:service_slug',
                    {
                      params: {
                        shop_slug: shop.slug,
                        service_slug: lastBooking.service_slug,
                      },
                    },
                  )
                : toRouteUrl(shopHome.routes, '/shop/:shop_slug', {
                    params: { shop_slug: shop.slug },
                  })
          }
        />
      ),
    }
  } catch (error) {
    let query = {
      title: '未能驗證電郵地址。',
      error: String(error),
    }
    Object.assign(query, { email })
    return {
      title: apiEndpointTitle,
      description:
        'API Endpoint to submit email verification code for authentication',
      node: (
        <Redirect
          href={
            shop
              ? toRouteUrl(routes, '/shop/:shop_slug/verify/email/result', {
                  params: { shop_slug: shop.slug },
                  query,
                })
              : toRouteUrl(routes, '/admin/verify/email/result', {
                  query,
                })
          }
        />
      ),
    }
  }
}

let routes = {
  '/shop/:shop_slug/verify/email/submit': {
    streaming: false,
    resolve: context =>
      requestEmailVerification(getContextShop(context), context),
  },
  '/shop/:shop_slug/verify/email/result': {
    resolve(context) {
      return {
        title: title('電郵驗證'),
        description: 'Input email verification code for authentication',
        node: <VerifyEmailPage shop={getContextShop(context)} />,
      }
    },
  },
  '/shop/:shop_slug/verify/email/code/submit': {
    streaming: false,
    resolve: context =>
      checkEmailVerificationCode(getContextShop(context), context),
  },
  '/admin/verify/email/submit': {
    streaming: false,
    resolve: context => requestEmailVerification(null, context),
  },
  '/admin/verify/email/result': {
    resolve(context) {
      return {
        title: title('電郵驗證'),
        description: 'Input email verification code for authentication',
        node: <VerifyEmailPage shop={null} />,
      }
    },
  },
  '/admin/verify/email/code/submit': {
    streaming: false,
    resolve: context => checkEmailVerificationCode(null, context),
  },
} satisfies Routes

export default { routes }
