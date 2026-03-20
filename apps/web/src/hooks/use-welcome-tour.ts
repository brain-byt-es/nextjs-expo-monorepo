"use client"

import { useState, useCallback } from "react"

const STORAGE_KEY = "logistikapp-tour-completed"

function readCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function useTourCompleted() {
  const [completed, setCompleted] = useState(readCompleted)

  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // localStorage not available
    }
    setCompleted(true)
  }, [])

  const resetTour = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage not available
    }
    setCompleted(false)
  }, [])

  return { completed, markCompleted, resetTour }
}
