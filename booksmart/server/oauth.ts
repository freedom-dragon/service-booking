import { Application, Router } from 'express'
import grant from 'grant'
import { env } from './env.js'
import { find } from 'better-sqlite3-proxy'
import { proxy } from '../db/proxy.js'
import { Routes } from './app/routes.js'
import { placeholderForAttachRoutes } from './app/components/placeholder.js'

type GoogleProfile = {
  email: string
  name: string
  picture: string
  // e.g. en | zh-HK | zh-TW | en-GB | en-US
  locale: string
}

export function attachRoutes(app: Router) {
  app.use(
    grant.express({
      defaults: {
        origin: 'http://localhost:' + env.PORT,
        transport: 'session',
        state: true,
      },
      google: {
        key: env.GOOGLE_CLIENT_ID,
        secret: env.GOOGLE_CLIENT_SECRET,
        scope: ['email', 'profile'],
        callback: '/login/google',
      },
    }),
  )

  // TODO store user into liveview session (signed cookie) instead of express session
  app.get('/login/google', async (req, res, next) => {
    try {
      let access_token = req.session?.grant?.response?.access_token
      let googleRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer ' + access_token },
        },
      )
      let googleJson: GoogleProfile = await googleRes.json()
      let user = find(proxy.user, { email: googleJson.email })
      if (user) {
        // existing user
        // TODO store into liveview session
        req.session.user = {
          id: user.id!,
          name: user.nickname || googleJson.name,
          avatar: user.avatar,
        }
        req.session.save()
        // TODO redirect to original shop
        // res.json({ id: user.id })
        res.redirect('/')
        return
      }

      // new user
      let id = proxy.user.push({
        email: googleJson.email,
        nickname: googleJson.name,
        avatar: googleJson.picture,
        // locale: googleJson.locale, // TODO update erd to store it
        is_admin: false,
        password_hash: null,
        tel: null,
        username: null,
        is_creating_shop: true,
      })
      // TODO store into liveview session
      req.session.user = {
        id,
        name: googleJson.name,
        avatar: googleJson.picture,
      }
      req.session.save()
      // TODO redirect to original shop
      // res.json({ id })
      res.redirect('/')
    } catch (error) {
      next(error)
    }
  })
}

let routes = {
  '/login/google': placeholderForAttachRoutes,
} satisfies Routes
export default { routes, attachRoutes }
