#!/bin/bash

SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
JSDIR="$SCRIPTDIR/js"
JS=(
  "$JSDIR/twitchmessage.js"
  "$JSDIR/madchatter.js"
  )
JSENTRY="$JSDIR/entry.js"

JSBUNDLE="$JSDIR/bundle.js"
JSLIB="$JSDIR/lib.js"
rm -f "$JSLIB"
for f in ${JS[@]}; do
  cat "$f" >> "$JSLIB"
done
cat "$JSENTRY" >> "$JSLIB"

browserify "$JSLIB" -o "$JSBUNDLE" 
