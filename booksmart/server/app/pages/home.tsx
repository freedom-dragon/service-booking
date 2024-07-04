import { o } from '../jsx/jsx.js'
import { prerender } from '../jsx/html.js'
import SourceCode from '../components/source-code.js'
import { mapArray } from '../components/fragment.js'
import { proxy } from '../../../db/proxy.js'

// Calling <Component/> will transform the JSX into AST for each rendering.
// You can reuse a pre-compute AST like `let component = <Component/>`.

// If the expression is static (not depending on the render Context),
// you don't have to wrap it by a function at all.

let content = (
  <div id="home">
    <h1>Home Page</h1>
    <p>
      A booking system for shops of all sizes. From one-man micro startups to
      mid-size companies.
    </p>
    <h2>Available Shops</h2>
    <ShopList />
    <SourceCode page="home.tsx" />
  </div>
)

function ShopList() {
  return mapArray(proxy.shop, shop => (
    <a href={'/shop/' + shop.slug}>{shop.name}</a>
  ))
}

// And it can be pre-rendered into html as well
let Home = content

export default Home
