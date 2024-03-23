import { format_relative_time, setLang } from '@beenotung/tslib/format.js'
import { o } from '../jsx/jsx.js'
import Style from './style.js'

setLang('zh-HK')

export let TimestampStyle = Style(/* css */ `
.timestamp {

}
`)

export function relative_timestamp(time: number) {
  return (
    <time datetime={new Date(time).toISOString()}>
      {format_relative_time(time - Date.now(), 0)}
    </time>
  )
}
