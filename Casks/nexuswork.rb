# typed: false
# frozen_string_literal: true

cask "nexuswork" do
  arch arm: "aarch64", intel: "cd6a7eb584e960f36b32bcfb731ed76c2926bf31064ab73054a084cf731917db"

  version "0.1.17"
  sha256 arm:   "47c91d67da96ba553370ca532ac0f6159e4a6cef9af557b4fa00cefee94295ae",
         intel: "cd6a7eb584e960f36b32bcfb731ed76c2926bf31064ab73054a084cf731917db"

  url "https://github.com/nexuswork-ai/nexuswork/releases/download/v#{version}/NexusWork_#{version}_#{arch}.dmg",
      verified: "github.com/nexuswork-ai/nexuswork/"
  name "NexusWork"
  desc "AI-powered work assistant with Claude Code and Codex integration"
  homepage "https://github.com/nexuswork-ai/nexuswork"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :monterey"

  app "NexusWork.app"

  postflight do
    # Remove quarantine attribute to prevent Gatekeeper issues
    system_command "/usr/bin/xattr",
                   args: ["-r", "-d", "com.apple.quarantine", "#{appdir}/NexusWork.app"],
                   sudo: false
  end

  zap trash: [
    "~/Library/Application Support/ai.nexuswork.nexuswork",
    "~/Library/Caches/ai.nexuswork.nexuswork",
    "~/Library/Logs/ai.nexuswork.nexuswork",
    "~/Library/Preferences/ai.nexuswork.nexuswork.plist",
    "~/Library/Saved Application State/ai.nexuswork.nexuswork.savedState",
  ]
end
