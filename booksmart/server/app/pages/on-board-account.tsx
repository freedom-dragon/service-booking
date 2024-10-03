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

let createShopTitle = '登錄'

let style = Style(/* css */ `
  /*ion-justify-content-center ion-padding-top ion-wrap ion-text-center*/
  .oauth-provider-list {
    display: inline-flex;
    align-items: center;
    border: 1px solid #888;
    padding: 0.25rem;
    border-radius: 0.25rem;
    margin: 0.25rem;
    text-align: center

  }
  #on-board-account form .field {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  #on-board-account form .field input {
    margin: 0.25rem 0;
  }
  #on-board-account form .field .space {
    width: 4rem;
  }
  #on-board-account form .field .msg {
    align-self: end;
    margin-bottom: 0.25rem;
  }
  #on-board-account form .field .extra {
    color: darkred;
    display: block;
    margin-top: 0.25rem;
  }
  #on-board-account .hint {
    border-inline-start: 3px solid #748;
    background-color: #edf;
    padding: 1rem;
    margin: 0.5rem 0;
    width: fit-content;
  }

  
  `)


function OnBoardAccount(attrs: {}, context: DynamicContext) {
  return (
    <>
      {style}
        <ion-header>
        <ion-toolbar color="primary">
            <IonBackButton href={'/on-board'} color="light" backText="on-board" />
            <ion-title role="heading" aria-level="1">
              {createShopTitle}
            </ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-row class="ion-justify-content-center ion-padding-top ion-text-center">
            <h1>Create Your Account</h1>
          </ion-row>
            <ion-row class="ion-justify-content-center ion-padding-top ion-wrap ion-text-center">
              <ion-col size="3.5">
                You’ll be able to use this account to log in to both PlaySmart and BookSmart.
              </ion-col>
            </ion-row>
            <ion-row class="ion-justify-content-center ion-padding-top ion-wrap ion-text-center">
              <ion-col size="3.5">
                By creating an account, you agree to our Terms of Service and have read and understood the Privacy Policy
              </ion-col>
            </ion-row>
            <ion-row class="oauth-provider-list">
              <ion-col size="3.5">
                {googleLogo}&nbsp;Continue with Google
              </ion-col>
            </ion-row>
            <ion-row class="oauth-provider-list">
              <ion-col size="3.5">
                {appleLogo}&nbsp;Continue with Apple
              </ion-col>
            </ion-row>
            <ion-row class="oauth-provider-list">
              <ion-col size="3.5">
                {githubLogo}&nbsp;Continue with GitHub
              </ion-col>
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
