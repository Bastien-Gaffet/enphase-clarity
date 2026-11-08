#!/usr/bin/env bash
# Installs the release APK on a running emulator, launches it, and checks
# what a browser can never check: that the fonts actually reached Android.
#
# Three device-only defects (blank screen, blank icons twice) shipped while
# every web check was green. This is the check that would have caught them.
#
# Output, all in the job log:
#   - the app's own "[fonts]" status line, from logcat;
#   - native errors mentioning fonts, assets or the JS runtime;
#   - a screenshot, base64 between SCREENSHOT-BEGIN / SCREENSHOT-END, so it
#     can be read back without downloading an artifact.
# Fails the job if either font is reported missing.
set -euo pipefail

APK="$1"
PKG=com.anonymous.enphaseclarity

adb install -r "$APK"
adb logcat -c
adb shell am start -W -n "$PKG/.MainActivity"

# Wait for the app to report its fonts (up to 2 min on a cold emulator).
# Captured into a variable first: `adb ... | grep -q` lets grep exit early,
# adb dies of SIGPIPE, and with pipefail the match would read as a miss.
status=""
for _ in $(seq 1 60); do
  js=$(adb logcat -d -s ReactNativeJS:V || true)
  status=$(grep '\[fonts\]' <<<"$js" | tail -1 || true)
  [ -n "$status" ] && break
  sleep 2
done
sleep 6 # let the first screen finish painting before the screenshot

echo "::group::logcat ReactNativeJS"
adb logcat -d -s ReactNativeJS:V ReactNative:V | tail -120 || true
echo "::endgroup::"

echo "::group::native errors (fonts, assets, runtime)"
adb logcat -d '*:E' | grep -iE "font|typeface|asset|expo|ReactNative|AndroidRuntime|FATAL" | tail -80 || true
echo "::endgroup::"

adb exec-out screencap -p > shot.png
if ! command -v convert >/dev/null; then
  sudo apt-get install -y -qq imagemagick >/dev/null
fi
convert shot.png -resize 540x -quality 72 shot.jpg
echo "SCREENSHOT-BEGIN"
base64 -w 76 shot.jpg
echo "SCREENSHOT-END"

echo "Font status: ${status:-<no [fonts] line in logcat>}"
if grep -q "ionicons=ok" <<<"$status" && grep -q "SpaceMono=ok" <<<"$status"; then
  echo "Fonts reached Android."
else
  echo "::error::Fonts did not reach Android: ${status:-no [fonts] line in logcat}"
  exit 1
fi
