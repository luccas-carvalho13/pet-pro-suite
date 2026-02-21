"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"
import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps extends ComponentPropsWithoutRef<"button"> {
  duration?: number
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> }
}

export const AnimatedThemeToggler = React.forwardRef<HTMLButtonElement, AnimatedThemeTogglerProps>(({
  className,
  duration = 400,
  children,
  ...props
}, forwardedRef) => {
  const { onClick, ...restProps } = props
  const [isDark, setIsDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }
    updateTheme()
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const applyTheme = () => {
      const newThemeIsDark = !isDark
      setIsDark(newThemeIsDark)
      document.documentElement.classList.toggle("dark")
      localStorage.setItem("theme", newThemeIsDark ? "dark" : "light")
      localStorage.setItem("petpro-theme", newThemeIsDark ? "dark" : "light")
    }

    const doc = document as ViewTransitionDocument
    if (!doc.startViewTransition) {
      applyTheme()
      return
    }

    await doc.startViewTransition(() => {
      flushSync(() => {
        applyTheme()
      })
    }).ready

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [duration, isDark])

  return (
    <button
      ref={(node) => {
        buttonRef.current = node
        if (typeof forwardedRef === "function") forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      type="button"
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        void toggleTheme()
      }}
      className={cn("inline-flex items-center gap-3", className)}
      {...restProps}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      {children}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
})

AnimatedThemeToggler.displayName = "AnimatedThemeToggler"
