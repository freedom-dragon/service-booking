import { expect } from 'chai'

let x = '*'

export function maskEmailForHint(email: string): string {
  let [username, domain] = email.split('@')
  let length = username.length
  if (length == 0 || length == 1) {
    return domain
  }
  if (length < 4) {
    return username.slice(0, 1) + x.repeat(username.length - 1) + '@' + domain
  }
  if (length < 8) {
    return (
      username.slice(0, 1) +
      x.repeat(username.length - 2) +
      username.slice(-1) +
      '@' +
      domain
    )
  }
  return (
    username.slice(0, 2) +
    x.repeat(username.length - 4) +
    username.slice(-2) +
    '@' +
    domain
  )
}

function test() {
  expect(maskEmailForHint('a@gmail.com')).to.equals('gmail.com')
  expect(maskEmailForHint('ab@gmail.com')).to.equals(`a${x}@gmail.com`)
  expect(maskEmailForHint('abc@gmail.com')).to.equals(`a${x + x}@gmail.com`)
  expect(maskEmailForHint('abcd@gmail.com')).to.equals(`a${x + x}d@gmail.com`)
  expect(maskEmailForHint('abcde@gmail.com')).to.equals(
    `a${x + x + x}e@gmail.com`,
  )
  expect(maskEmailForHint('abcdef@gmail.com')).to.equals(
    `a${x + x + x + x}f@gmail.com`,
  )
  expect(maskEmailForHint('abcdefgh@gmail.com')).to.equals(
    `ab${x + x + x + x}gh@gmail.com`,
  )
  console.log('passed all tests in email-mask.ts')
}

if (import.meta.url == 'file://' + process.argv[1]) {
  test()
}
