#!/usr/bin/env bash

set -euo pipefail

PROJECT_NAME="ArenaSMobile"

echo "Initializing ${PROJECT_NAME}..."

if [ ! -f package.json ]; then
  npx create-expo-app@latest "${PROJECT_NAME}" --template blank
fi

echo "Installing runtime dependencies..."
npm install \
  expo react react-native \
  @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  nativewind tailwindcss axios \
  @reduxjs/toolkit react-redux @react-native-async-storage/async-storage \
  expo-status-bar react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens

echo "Done. Add the src/ structure and config files from this scaffold, then run: npm run start"

