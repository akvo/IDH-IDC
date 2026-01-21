#!/bin/sh

echo PUBLIC_URL="/" > .env

# PostHog analytics
echo REACT_APP_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST >> .env
echo REACT_APP_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY >> .env

yarn install
yarn start
