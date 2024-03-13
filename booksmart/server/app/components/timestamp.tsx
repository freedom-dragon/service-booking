import { WEEK } from '@beenotung/tslib/time.js'
import { setLang } from '@beenotung/tslib/format.js'
import { o } from '../jsx/jsx.js'
import DateTimeText from './datetime.js'
import Style from './style.js'

setLang('zh-HK')

export let TimestampStyle = Style(/* css */ `
.timestamp {

}
`)

export function timestamp(time: number) {
  return (
    <time datetime={new Date(time).toISOString()}>
      <DateTimeText time={time} relativeTimeThreshold={2 * WEEK} />
    </time>
  )
}
