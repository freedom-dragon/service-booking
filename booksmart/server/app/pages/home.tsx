import { o } from '../jsx/jsx.js'
import { prerender } from '../jsx/html.js'
import SourceCode from '../components/source-code.js'
import { mapArray } from '../components/fragment.js'
import { proxy } from '../../../db/proxy.js'
import Style from '../components/style.js'

// Calling <Component/> will transform the JSX into AST for each rendering.
// You can reuse a pre-compute AST like `let component = <Component/>`.

// If the expression is static (not depending on the render Context),
// you don't have to wrap it by a function at all.

let style = Style(/* css */ `
.shop-link {
  display: block;
  margin: 1rem;
}
`)

let content = (
  <div id="home">
    {style}
    <h1>Home Page</h1>
    <p>一個適合各種服務規模的預約系統。從一人微型創業到中小型企業。</p>
    <h2>已加盟店舖</h2>
    <ShopList />
  </div>
)

function ShopList() {
  return mapArray(proxy.shop, shop => (
    <a class="shop-link" href={'/shop/' + shop.slug}>
      {shop.name}
    </a>
  ))
}

// And it can be pre-rendered into html as well
let Home = content

export default Home
