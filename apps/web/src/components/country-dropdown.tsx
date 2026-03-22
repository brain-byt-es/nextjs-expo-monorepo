"use client"

import React, { useCallback, useState, forwardRef, useEffect } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { IconCheck, IconChevronDown, IconWorld } from "@tabler/icons-react"
import { CircleFlag } from "react-circle-flags"
import { countries } from "country-data-list"

export type Country = {
  alpha2: string
  alpha3: string
  countryCallingCodes: string[]
  currencies: string[]
  emoji?: string
  ioc: string
  languages: string[]
  name: string
  status: string
}

interface CountryDropdownProps {
  value?: string // alpha2 code (e.g. "CH")
  onChange?: (country: Country) => void
  defaultValue?: string // alpha2 code, defaults to "CH"
  disabled?: boolean
  placeholder?: string
  className?: string
}

// Priority countries shown at top (Swiss market focus)
const PRIORITY_COUNTRIES = ["CH", "DE", "AT", "FR", "IT", "LI"]

const allCountries: Country[] = countries.all.filter(
  (c: Country) => c.emoji && c.status !== "deleted" && c.ioc !== "PRK" && c.name
)

// Sort: priority countries first, then alphabetical
const sortedCountries = [
  ...allCountries.filter((c) => PRIORITY_COUNTRIES.includes(c.alpha2)),
  ...allCountries
    .filter((c) => !PRIORITY_COUNTRIES.includes(c.alpha2))
    .sort((a, b) => a.name.localeCompare(b.name)),
]

const CountryDropdownComponent = (
  {
    value,
    onChange,
    defaultValue = "CH",
    disabled = false,
    placeholder = "Land auswählen",
    className,
  }: CountryDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Country | null>(null)

  // Initialize with defaultValue or value
  useEffect(() => {
    const code = value || defaultValue
    if (code && (!selected || selected.alpha2 !== code)) {
      const country = allCountries.find((c) => c.alpha2 === code)
      if (country) setSelected(country)
    }
  }, [value, defaultValue, selected])

  const handleSelect = useCallback(
    (country: Country) => {
      setSelected(country)
      onChange?.(country)
      setOpen(false)
    },
    [onChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/50 transition-colors",
          className
        )}
        disabled={disabled}
      >
        {selected ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
              <CircleFlag
                countryCode={selected.alpha2.toLowerCase()}
                height={20}
              />
            </div>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {selected.name}
            </span>
          </div>
        ) : (
          <span className="flex items-center gap-2 text-muted-foreground">
            <IconWorld className="size-4" />
            {placeholder}
          </span>
        )}
        <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={10}
        side="bottom"
        className="min-w-[--radix-popper-anchor-width] p-0"
      >
        <Command className="w-full max-h-[280px]">
          <CommandList>
            <div className="sticky top-0 z-10 bg-popover">
              <CommandInput placeholder="Land suchen..." />
            </div>
            <CommandEmpty>Kein Land gefunden.</CommandEmpty>
            <CommandGroup>
              {sortedCountries.map((option) => (
                <CommandItem
                  key={option.alpha2}
                  className="flex items-center w-full gap-2"
                  onSelect={() => handleSelect(option)}
                >
                  <div className="flex flex-grow items-center gap-2 overflow-hidden">
                    <div className="inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full">
                      <CircleFlag
                        countryCode={option.alpha2.toLowerCase()}
                        height={20}
                      />
                    </div>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {option.name}
                    </span>
                  </div>
                  <IconCheck
                    className={cn(
                      "ml-auto size-4 shrink-0",
                      selected?.alpha2 === option.alpha2 ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

CountryDropdownComponent.displayName = "CountryDropdown"

export const CountryDropdown = forwardRef(CountryDropdownComponent)
