import { useEffect } from "react"
import { useLocation } from "react-router-dom"

function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.history.scrollRestoration = "manual"

    const scrollToTop = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    scrollToTop()

    const timer = setTimeout(() => {
      scrollToTop()
    }, 0)

    return () => clearTimeout(timer)
  }, [pathname, search])

  return null
}

export default ScrollToTop