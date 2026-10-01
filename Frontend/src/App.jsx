import { BrowserRouter } from "react-router-dom"

import { CartProvider } from "./context/CartContext.jsx"
import { WishlistProvider } from "./context/WishlistContext.jsx"
import ScrollToTop from "./components/ScrollToTop"

import AppRoutes from "./routes/AppRoutes"

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <WishlistProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </WishlistProvider>
    </BrowserRouter>
  )
}

export default App