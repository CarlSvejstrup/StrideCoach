import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculatePace(seconds: number, meters: number) {
  if (meters === 0) return "0:00"
  const paceSeconds = seconds / (meters / 1000)
  const minutes = Math.floor(paceSeconds / 60)
  const secs = Math.floor(paceSeconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}
