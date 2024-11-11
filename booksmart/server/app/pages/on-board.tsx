import { o } from '../jsx/jsx.js'
import { mapArray } from '../components/fragment.js'
import { proxy, User } from '../../../db/proxy.js'
import Style from '../components/style.js'
import { Routes } from '../routes.js'
import { LayoutType, apiEndpointTitle, config, title } from '../../config.js'
import { getAuthUser, getAuthUserRole } from '../auth/user.js'
import {
  appleLogo,
  facebookLogo,
  githubLogo,
  googleLogo,
  instagramLogo,
  emailLogo,
} from '../svgs/logo.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  getContextFormBody,
} from '../context.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib'
import { db } from '../../../db/db.js'
import { HttpError, MessageException } from '../../exception.js'
import { toRouteUrl } from '../../url.js'
import { Link, Redirect } from '../components/router.js'
import { ParseResult, email, object, string } from 'cast.ts'
import { IonBackButton } from '../components/ion-back-button.js'
import { env } from '../../env.js'
import login from './login.js'
import shopHome from './shop-home.js'
import { Input } from '../components/input.js'
import { Script } from '../components/script.js'
import { Button } from '../components/button.js'
import home from './home.js'
import onBoardAccount from './on-board-account.js'
import oauth from '../../oauth.js'
import onBoardEmail from './on-board-email.js'
import { attachRoutes } from '../app.js'

let createShopTitle = '登錄'

let style = Style(/* css */ `
  

  .fontstyle{
    color: var(--ion-color-primary);
    width: 19rem;
    justify-content: center;
    flex-wrap: wrap;
    text-align: center;
    align-items: center;
    margin-inline: auto;
  }
  .fontstyle2{
    color: var(--ion-color-primary);
    width: 22rem;
    justify-content: center;
    flex-wrap: wrap;
    text-align: center;
    align-items: center;
    margin-inline: auto;
    font-size: 0.7rem;
    margin-bottom: 1rem;
  }

  .oauth-provider-list {
    justify-content: space-between;
    margin-inline: auto;
    font-size: 13px;
    text-transform: none;
    vertical-align: middle;
    --background: #fff;
    background: #fff; 

    width: 18rem;
    height: 3rem;
    border: 1px solid #000;

  }
  .oauth-provider-list:hover {
    --background: #77aae5;
  }
  ion-Button > ion-col:nth-child(1){
    item-align: center;
    font-size: 18px;
    color: #000;
  }
  ion-Button > ion-col:nth-child(2){
    color: #000;
  }
  .button
  .icontest{
    display: inline-block;
    line-height: 1.5;

  }
  `)

function OnBoard(attrs: {}, context: DynamicContext) {
  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton href={'/'} color="light" backText="Home" />
          <ion-title role="heading" aria-level="1">
            {createShopTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-row class="fontstyle">
          <h1>Create Your Account</h1>
        </ion-row>
        <ion-row class="fontstyle2">
          <ion-col size="auto">
            By creating an account, you agree to our{' '}
            <a href={'/end-user-license-agreement'}>
              End User License Agreement
            </a>{' '}
            and have read and understood the{' '}
            <a href={'/privacy-policy'}>Privacy Policy</a>
          </ion-col>
        </ion-row>

        <ion-row>
          <ion-button
            class="oauth-provider-list"
            href={toRouteUrl(oauth.routes, '/connect/google')}
          >
            <ion-col size="1">
              <ion-icon name="logo-google" class="icontest"></ion-icon>
            </ion-col>
            <ion-col size="11.5">
              <ion-label>Continue with Google</ion-label>
            </ion-col>
          </ion-button>
        </ion-row>
        <ion-row>
          <ion-Button class="oauth-provider-list" href={'/'}>
            <ion-col size="1">
              <ion-icon name="logo-apple"></ion-icon>
            </ion-col>
            <ion-col size="11.5">
              <ion-label>Continue with Apple</ion-label>
            </ion-col>
          </ion-Button>
        </ion-row>
        <ion-row>
          <ion-Button
            class="oauth-provider-list"
            href={toRouteUrl(oauth.routes, '/connect/facebook')}
          >
            <ion-col size="1">
              <ion-icon name="logo-facebook"></ion-icon>
            </ion-col>
            <ion-col size="11.5">
              <ion-label>Continue with Facebook</ion-label>
            </ion-col>
          </ion-Button>
        </ion-row>
        <ion-row>
          <ion-Button
            class="oauth-provider-list"
            href={toRouteUrl(home.routes, '/')}
          >
            <ion-col size="1">
              <ion-icon name="logo-instagram"></ion-icon>
            </ion-col>
            <ion-col size="11.5">
              <ion-label>Continue with Instagram</ion-label>
            </ion-col>
          </ion-Button>
        </ion-row>
        <ion-row>
          <ion-Button
            class="oauth-provider-list"
            href={toRouteUrl(onBoardEmail.routes, '/on-board/email')}
          >
            <ion-col size="1">
              <ion-icon name="mail-outline"></ion-icon>
            </ion-col>
            <ion-col size="11.5">
              <ion-label>Continue with Email</ion-label>
            </ion-col>
          </ion-Button>
        </ion-row>
      </ion-content>
    </>
  )
}
let routes = {
  '/on-board': {
    title: apiEndpointTitle,
    description: 'creating account',
    adminOnly: false,
    node: <OnBoard />,
  },
} satisfies Routes

export default { routes, attachRoutes }
