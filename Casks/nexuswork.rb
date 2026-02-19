# typed: false
# frozen_string_literal: true

cask "nexuswork" do
  arch arm: "aarch64", intel: "bfa02c3a8af6a4408f7cb35bb6bf55d13f5c45ef96cc26ba44a2fcdd6bfca238"

  version "0.1.17"
  sha256 arm:   "70cd818a614bc783e83492ac985f773cec7f4445ed2adf9f5e5c4d79dbcc631d",
         intel: "bfa02c3a8af6a4408f7cb35bb6bf55d13f5c45ef96cc26ba44a2fcdd6bfca238"

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
