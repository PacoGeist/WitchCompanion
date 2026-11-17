#!/bin/bash
set -e
SDK=${ANDROID_SDK:-/opt/android-sdk}; BT=$SDK/build-tools/35.0.0; AJ=$SDK/platforms/android-35/android.jar
cd "$(dirname "$0")"
# version comes from ../release.json unless VC/VN are given
VC=${VC:-$(python3 -c "import json;print(json.load(open('../release.json'))['versionCode'])")}
VN=${VN:-$(python3 -c "import json;print(json.load(open('../release.json'))['versionName'])")}
echo "window.APP_VERSION = { code: $VC, name: \"$VN\" };" > ../www/js/version.js
rm -rf build && mkdir -p build/res build/gen build/classes build/assets
cp -r ../www build/assets/www
rm -f build/assets/www/img/*/credits.json
$BT/aapt2 compile --dir res -o build/res/res.zip
$BT/aapt2 link -I $AJ --manifest AndroidManifest.xml -o build/base.apk build/res/res.zip -A build/assets --java build/gen --min-sdk-version 24 --target-sdk-version 35 --version-code ${VC:-1} --version-name ${VN:-1.0} --replace-version -0 jpg -0 woff2
javac -nowarn --release 11 -classpath $AJ -d build/classes $(find src build/gen -name '*.java') 2>&1 | grep -v "warning" || true
$BT/d8 --lib $AJ --min-api 24 --release --output build $(find build/classes -name '*.class')
(cd build && zip -q -j base.apk classes.dex)
$BT/zipalign -f -p 4 build/base.apk build/aligned.apk
# signing: the key and its password live in key.properties (private; never on GitHub)
[ -f key.properties ] || { echo "Missing android/key.properties and the signing key. Restore them from your private backup; never make a new key, or installed apps cannot update." >&2; exit 1; }
KEYSTORE=$(grep ^KEYSTORE= key.properties | cut -d= -f2-); ALIAS=$(grep ^ALIAS= key.properties | cut -d= -f2-); KPASS=$(grep ^PASSWORD= key.properties | cut -d= -f2-)
[ -f "$KEYSTORE" ] || { echo "Missing $KEYSTORE. Restore it from your private backup." >&2; exit 1; }
$BT/apksigner sign --ks "$KEYSTORE" --ks-key-alias "$ALIAS" --ks-pass pass:"$KPASS" --key-pass pass:"$KPASS" --out WitchcraftCompanion.apk build/aligned.apk
$BT/apksigner verify WitchcraftCompanion.apk && ls -la WitchcraftCompanion.apk
