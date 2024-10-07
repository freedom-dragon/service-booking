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
import { Input } from '../components/input';
import { Script } from '../components/script.js'
import { Button } from '../components/button';
import home from './home.js'

let createShopTitle = '登錄'

let style = Style(/* css */ `
  

  .fontstyle{
    color: #68a1e2;
    width: 19rem;
    justify-content: center;
    padding-top:10   px;
    flex-wrap: wrap;
    text-align: center;
    align-items: center;
    margin-inline: auto;
  }
  .oauth-provider-list {
    justify-content: center;
    margin-inline: auto;
    --font-size: 16px;
    vertical-align: middle;
    

    width: 18rem;
    height: 3rem;

  }
  .oauth-provider-list:hover {
    --background: #77aae5;
  }


  `)


function OnBoardAccount(attrs: {}, context: DynamicContext) {
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
          <ion-row class="fontstyle">
            <ion-col size="auto">
              You’ll be able to use this account to log in to both PlaySmart and BookSmart.
            </ion-col>
          </ion-row>
          <ion-row class="fontstyle">
            <ion-col size="auto">
              By creating an account, you agree to our Terms of Service and have read and understood the Privacy Policy
            </ion-col>
          </ion-row>
          <ion-row>
              <ion-Button class="oauth-provider-list" href={toRouteUrl(home.routes, '/')}>
                <ion-icon name="logo-google" class="ion-align-items-center" slot="start"></ion-icon>
                <ion-label class="ion-align-items-right">Continue with Google</ion-label>
              </ion-Button>
          </ion-row>
          <ion-row>
              <ion-Button class="oauth-provider-list" href={toRouteUrl(home.routes, '/')}>
                <ion-icon class="ion-align-items-center" name="logo-apple" slot="start" ></ion-icon>
                <ion-label class="ion-align-items-center">Continue with Apple</ion-label>
              </ion-Button>
          </ion-row>
          <ion-row>
              <ion-Button class="oauth-provider-list" href={toRouteUrl(home.routes, '/')}>
                <ion-icon name="logo-github" slot="start"></ion-icon>
                <ion-label>Continue with GitHub</ion-label>
              </ion-Button>
          </ion-row>
          <ion-row>
            <ion-Button class="oauth-provider-list" href={toRouteUrl(home.routes, '/')}>
              <ion-icon name="logo-facebook" slot="start"></ion-icon>
              <ion-label>Continue with Facebook</ion-label>
            </ion-Button>
          </ion-row>
          <ion-row>
              <ion-Button class="oauth-provider-list" href={toRouteUrl(home.routes, '/')}>
                <ion-icon name="logo-instagram" slot="start" ></ion-icon>
                <ion-label class="ion-align-items-center">Continue with Instagram</ion-label>
              </ion-Button>
          </ion-row>
          <ion-row>
            <ion-Button class="oauth-provider-list" href={toRouteUrl(home.routes, '/')}>
              <ion-icon name="mail-outline" slot="start"></ion-icon>
              <ion-label>Continue with Email</ion-label>
            </ion-Button>
          </ion-row>

        </ion-content>
    </>
  )
}
let routes = {
  '/on-board/account': {
    title: apiEndpointTitle,
    description: 'checking show slug',  
    adminOnly: false,
    node: <OnBoardAccount />,
  },
} satisfies Routes

export default { routes }
