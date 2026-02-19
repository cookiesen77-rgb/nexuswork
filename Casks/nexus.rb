# typed: false
# frozen_string_literal: true

cask "nexus" do
  arch arm: "aarch64", intel: "x64"

  version "0.1.14"
  sha256 arm:   "5f8b4b854bb9dd2e2ced18c024cafc1286f024566feac64f7e62d130b1e75f4f",
         intel: "REPLACE_WITH_X64_SHA256"

  url "https://github.com/nexus-ai/nexus/releases/download/v#{version}/Nexus_#{version}_#{arch}.dmg",
      verified: "github.com/nexus-ai/nexus/"
  name "Nexus"
  desc "AI-powered work assistant with Claude Code and Codex integration"
  homepage "https://github.com/nexus-ai/nexus"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :monterey"

  app "Nexus.app"

  postflight do
    # Remove quarantine attribute to prevent Gatekeeper issues
    system_command "/usr/bin/xattr",
                   args: ["-r", "-d", "com.apple.quarantine", "#{appdir}/Nexus.app"],
                   sudo: false
  end

  zap trash: [
    "~/Library/Application Support/ai.nexus.nexus",
    "~/Library/Caches/ai.nexus.nexus",
    "~/Library/Logs/ai.nexus.nexus",
    "~/Library/Preferences/ai.nexus.nexus.plist",
    "~/Library/Saved Application State/ai.nexus.nexus.savedState",
  ]
end
