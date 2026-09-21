#!/usr/bin/env bash
# Adds third-party keys to Vercel without echoing them or putting them in shell history.
#
#   scripts/set-vercel-env.sh preview      # use TEST keys (Razorpay test mode)
#   scripts/set-vercel-env.sh production   # use LIVE keys, only at go-live
#
# Press Enter on any prompt to skip that variable. Secrets are stored as Sensitive (unreadable after saving).
set -euo pipefail

target="${1:-}"
if [[ "$target" != "preview" && "$target" != "production" ]]; then
  echo "usage: $0 <preview|production>" >&2
  exit 1
fi
command -v vercel >/dev/null || { echo "vercel CLI not found: npm i -g vercel" >&2; exit 1; }

add() { # name value sensitive(1|0)
  local flags=(--force)
  [[ "$3" == "1" ]] && flags+=(--sensitive)
  printf %s "$2" | vercel env add "$1" "$target" "${flags[@]}" >/dev/null
  echo "  set $1 ($target)"
}

secret() { # name prompt
  local v; read -rs -p "$2: " v; echo
  [[ -n "$v" ]] && add "$1" "$v" 1 || echo "  skipped $1"
}

plain() { # name prompt
  local v; read -r -p "$2: " v
  [[ -n "$v" ]] && add "$1" "$v" 0 || echo "  skipped $1"
}

echo "Setting $target variables. Typing is hidden for secrets."
[[ "$target" == "preview" ]] && echo "Use Razorpay TEST keys here (rzp_test_...)."
[[ "$target" == "production" ]] && echo "Use LIVE keys here (rzp_live_...) only when you are ready to take real payments."

read -r -p "Razorpay Key ID: " rzp_id
if [[ -n "$rzp_id" ]]; then
  add RAZORPAY_KEY_ID "$rzp_id" 0
  add NEXT_PUBLIC_RAZORPAY_KEY_ID "$rzp_id" 0   # key id is public by design
fi
secret RAZORPAY_KEY_SECRET "Razorpay Key Secret"
secret RAZORPAY_WEBHOOK_SECRET "Razorpay Webhook Secret (skip until the webhook exists)"
secret RESEND_API_KEY "Resend API key"
plain  EMAIL_FROM "From address, e.g. The Convert Club <hello@convertsclub.in> (domain must be verified in Resend)"
plain  AUTH_GOOGLE_ID "Google OAuth client ID"
secret AUTH_GOOGLE_SECRET "Google OAuth client secret"
plain  ADMIN_EMAIL "Admin email (the one account seeded as Admin)"
echo "Done. Verify names with: vercel env ls"
