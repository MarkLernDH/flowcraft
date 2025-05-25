"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleContextType {
  isOpen: boolean
  toggle: () => void
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null)

const Collapsible = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ className, open, onOpenChange, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const toggle = () => {
    const newOpen = !isOpen
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div
        ref={ref}
        className={cn("", className)}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, onClick, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext)
  
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    context?.toggle()
    onClick?.(event)
  }

  return (
    <div
      ref={ref}
      className={cn("cursor-pointer", className)}
      onClick={handleClick}
      data-state={context?.isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext)
  const isOpen = context?.isOpen ?? false
  
  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "opacity-100 max-h-96" : "opacity-0 max-h-0",
        className
      )}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent } 