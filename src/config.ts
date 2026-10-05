/**
 * ONEAG Application Configuration
 *
 * Official Product & Brand: ONEAG
 * Primary Website URL: https://oneag.app
 *
 * Dynamically resolves to the current browser window origin (window.location.origin)
 * or falls back to the canonical production URL https://oneag.app.
 */
export const ONEAG_CANONICAL_URL = 'https://oneag.app';

export const getReferralBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return ONEAG_CANONICAL_URL;
};

export const ONEAG_REFERRAL_BASE_URL: string = getReferralBaseUrl();
