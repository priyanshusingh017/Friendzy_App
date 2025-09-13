/**
 * Utility functions and constants for the React app
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import animationData from "@/assets/lottie-json";

/**
 * Merge Tailwind and clsx classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Color palette for user profiles
 */
export const colors = [
  {
    name: "Pink",
    bg: "#712c4a57",
    text: "#ff006e",
    border: "#ff006faa"
  },
  {
    name: "Yellow",
    bg: "#ffd60a2a",
    text: "#ffd60a",
    border: "#ffd60abb"
  },
  {
    name: "Teal",
    bg: "#06d6a02a",
    text: "#06d6a0",
    border: "#06d6a0bb"
  },
  {
    name: "Blue",
    bg: "#4cc9f02a",
    text: "#4cc9f0",
    border: "#4cc9f0bb"
  }
];

/**
 * Get color object by index, fallback to first color
 * @param {number} colorIdx
 * @returns {object}
 */
export const getColor = (colorIdx) => {
  if (typeof colorIdx === "number" && colorIdx >= 0 && colorIdx < colors.length) {
    return colors[colorIdx];
  }
  return colors[0];
};

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Capitalize first letter of a string
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Lottie animation default options
 */
export const animationDefaultoption = {
  loop: true,
  autoplay: true,
  animationData,
};