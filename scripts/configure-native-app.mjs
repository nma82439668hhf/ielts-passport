import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const platform = process.argv[2];
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "apps", "mobile", "package.json"), "utf8"));
const version = packageJson.version;
const versionCode = version.split(".").reduce((value, part) => value * 1000 + Number(part), 0);

function updateFile(file, transform) {
  const before = fs.readFileSync(file, "utf8");
  const after = transform(before);
  if (after !== before) fs.writeFileSync(file, after, "utf8");
}

if (platform === "android") {
  const mobileRoot = path.join(root, "apps", "mobile", "android", "app");
  const manifest = path.join(mobileRoot, "src", "main", "AndroidManifest.xml");
  updateFile(manifest, (content) => content.includes("android.permission.RECORD_AUDIO")
    ? content
    : content.replace(
        '<uses-permission android:name="android.permission.INTERNET" />',
        '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />'
      ));

  const gradle = path.join(mobileRoot, "build.gradle");
  updateFile(gradle, (content) => content
    .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${version}"`));
} else if (platform === "ios") {
  const appRoot = path.join(root, "apps", "mobile", "ios", "App", "App");
  const plist = path.join(appRoot, "Info.plist");
  const permissions = [
    "<key>NSMicrophoneUsageDescription</key>",
    "<string>Used for English speaking practice and AI voice conversations.</string>",
    "<key>NSSpeechRecognitionUsageDescription</key>",
    "<string>Used to turn your English speech into text for AI conversation practice.</string>"
  ].join("\n\t");
  updateFile(plist, (content) => content.includes("NSMicrophoneUsageDescription")
    ? content
    : content.replace("\t<key>UILaunchStoryboardName</key>", `\t${permissions}\n\t<key>UILaunchStoryboardName</key>`));

  const project = path.join(root, "apps", "mobile", "ios", "App", "App.xcodeproj", "project.pbxproj");
  updateFile(project, (content) => content
    .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${versionCode};`)
    .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`));
} else {
  throw new Error("Usage: node scripts/configure-native-app.mjs <android|ios>");
}

console.log(`Configured ${platform} app ${version}`);
