import * as React from "react"
import { isAndroid, isIOS } from "@/utils/platform"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(undefined)

    React.useEffect(() => {
        // Check if running on Tauri mobile (Android/iOS)
        const isTauriMobile = isAndroid() || isIOS()

        if (isTauriMobile) {
            // If running on Tauri mobile, always return true
            setIsMobile(true)
            return
        }

        // Otherwise, check screen width for mobile web
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }
        mql.addEventListener("change", onChange)
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        return () => mql.removeEventListener("change", onChange)
    }, [])

    return !!isMobile
}
