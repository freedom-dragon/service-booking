export function formatBankNumber(text: string): string {
  if (text.includes(' ') || text.includes('-')) {
    return text
  }
  if (text.length == 3 + 6 + 3) {
    // hang seng bank
    return split(text, [3, 6, 3])
  }
  if (text.length == 6 + 13) {
    // bank of china
    return split(text, [6, 3, 3, 4, 3])
  }

  return genericSplit(text)
}

function split(text: string, chunks: number[]): string {
  let rest = text
  let parts: string[] = []
  for (let n of chunks) {
    parts.push(rest.slice(0, n))
    rest = rest.slice(n)
  }
  if (rest.length != 0) {
    throw new Error('not fully consumed, rest: ' + JSON.stringify(rest))
  }
  return parts.join('-')
}

function genericSplit(text: string): string {
  let rest = text
  let parts: string[] = []
  while (rest.length > 0) {
    let n = 3
    parts.push(rest.slice(0, n))
    rest = rest.slice(n)
  }
  return parts.join('-')
}
