"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export function NavigationLoader() {
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const [prevPathname, setPrevPathname] = useState(pathname)

    useEffect(() => {
        if (pathname !== prevPathname) {
            // Route changed — hide loader
            setIsLoading(false)
            setPrevPathname(pathname)
        }
    }, [pathname, prevPathname])

    // Expose a global function for the sidebar to trigger loading
    useEffect(() => {
        (window as any).__setNavLoading = (loading: boolean) => {
            setIsLoading(loading)
        }
        return () => {
            delete (window as any).__setNavLoading
        }
    }, [])

    if (!isLoading) return null

    return (
        <>
            {/* Top progress bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-gray-800 dark:bg-gray-200 animate-progress-bar" />
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-[2px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-300" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading…</p>
                </div>
            </div>
        </>
    )
}
