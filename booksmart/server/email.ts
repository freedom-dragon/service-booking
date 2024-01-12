import nodemailer, { SendMailOptions, createTransport } from 'nodemailer'
import { config } from './config.js'

let transport = createTransport(config.email)

export interface SentMessageInfo {
  accepted: string[]
  rejected: string[]
  response: string // e.g. '250 2.0.0 OK  1703241394 b11-xxxx.299 - gsmtp',
  envelope: { from: string; to: string[] }
  messageId: string
}

export async function sendEmail(options: SendMailOptions) {
  let info = await transport.sendMail(options)
  return info as SentMessageInfo
}
