#!/bin/bash

# WorkAny Build Script
# Usage: ./scripts/build.sh [platform]
# Platforms: linux, windows, mac-intel, mac-arm, all

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    log_info "Checking requirements..."

    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Please install it first."
        exit 1
    fi

    if ! command -v cargo &> /dev/null; then
        log_error "Rust/Cargo is not installed. Please install it first."
        exit 1
    fi

    if ! command -v rustup &> /dev/null; then
        log_error "rustup is not installed. Please install it first."
        exit 1
    fi

    log_info "All requirements satisfied."
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    pnpm install
}

# Build API sidecar for a specific target (using Node.js + esbuild + pkg)
build_api_sidecar() {
    local target="$1"
    log_info "Building API sidecar for $target (Node.js)..."

    cd "$PROJECT_ROOT/src-api"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        pnpm install
    fi

    case "$target" in
        x86_64-unknown-linux-gnu)
            pnpm run build:binary:linux
            ;;
        x86_64-pc-windows-msvc)
            pnpm run build:binary:windows
            ;;
        x86_64-apple-darwin)
            pnpm run build:binary:mac-intel
            ;;
        aarch64-apple-darwin)
            pnpm run build:binary:mac-arm
            ;;
        current)
            pnpm run build:binary
            ;;
        *)
            log_error "Unknown target for API sidecar: $target"
            exit 1
            ;;
    esac

    cd "$PROJECT_ROOT"
    log_info "API sidecar build completed for $target"
}

# Build for Linux (x86_64)
build_linux() {
    log_info "Building for Linux x86_64..."

    local target="x86_64-unknown-linux-gnu"

    # Build API sidecar first
    build_api_sidecar "$target"

    # Add target if not exists
    rustup target add "$target" 2>/dev/null || true

    pnpm tauri build --target "$target"

    log_info "Linux build completed!"
    log_info "Output: src-tauri/target/$target/release/bundle/"
}

# Build for Windows (x86_64)
build_windows() {
    log_info "Building for Windows x86_64..."

    local target="x86_64-pc-windows-msvc"

    # Build API sidecar first
    build_api_sidecar "$target"

    # Add target if not exists
    rustup target add "$target" 2>/dev/null || true

    pnpm tauri build --target "$target"

    log_info "Windows build completed!"
    log_info "Output: src-tauri/target/$target/release/bundle/"
}

# Build for macOS Intel (x86_64)
build_mac_intel() {
    log_info "Building for macOS Intel (x86_64)..."

    local target="x86_64-apple-darwin"

    # Build API sidecar first
    build_api_sidecar "$target"

    # Add target if not exists
    rustup target add "$target" 2>/dev/null || true

    pnpm tauri build --target "$target"

    log_info "macOS Intel build completed!"
    log_info "Output: src-tauri/target/$target/release/bundle/"
}

# Build for macOS Apple Silicon (aarch64)
build_mac_arm() {
    log_info "Building for macOS Apple Silicon (aarch64)..."

    local target="aarch64-apple-darwin"

    # Build API sidecar first
    build_api_sidecar "$target"

    # Add target if not exists
    rustup target add "$target" 2>/dev/null || true

    pnpm tauri build --target "$target"

    log_info "macOS Apple Silicon build completed!"
    log_info "Output: src-tauri/target/$target/release/bundle/"
}

# Build for current platform
build_current() {
    log_info "Building for current platform..."

    # Build API sidecar first
    build_api_sidecar "current"

    pnpm tauri build

    log_info "Build completed!"
    log_info "Output: src-tauri/target/release/bundle/"
}


# Show help
show_help() {
    echo "WorkAny Build Script"
    echo ""
    echo "Usage: ./scripts/build.sh [platform]"
    echo ""
    echo "Platforms:"
    echo "  linux       - Build for Linux x86_64"
    echo "  windows     - Build for Windows x86_64"
    echo "  mac-intel   - Build for macOS Intel (x86_64) ~30MB"
    echo "  mac-arm     - Build for macOS Apple Silicon (aarch64) ~27MB"
    echo "  current     - Build for current platform (default)"
    echo "  all         - Build for all platforms (requires cross-compilation setup)"
    echo ""
    echo "Requirements:"
    echo "  - pnpm"
    echo "  - Node.js (for API sidecar with BoxLite)"
    echo "  - Rust (cargo, rustup)"
    echo ""
    echo "Examples:"
    echo "  ./scripts/build.sh              # Build for current platform"
    echo "  ./scripts/build.sh mac-arm      # Build for Apple Silicon"
    echo "  ./scripts/build.sh mac-intel    # Build for Intel Mac"
    echo ""
    echo "Note: Cross-compilation requires proper toolchain setup."
    echo "      For CI/CD builds, use GitHub Actions workflow instead."
}

# Main
main() {
    local platform="${1:-current}"

    check_requirements
    install_deps

    case "$platform" in
        linux)
            build_linux
            ;;
        windows)
            build_windows
            ;;
        mac-intel)
            build_mac_intel
            ;;
        mac-arm)
            build_mac_arm
            ;;
        current)
            build_current
            ;;
        all)
            log_warn "Building for all platforms requires cross-compilation setup."
            log_warn "Consider using GitHub Actions for cross-platform builds."
            build_linux
            build_windows
            build_mac_intel
            build_mac_arm
            ;;
        -h|--help|help)
            show_help
            ;;
        *)
            log_error "Unknown platform: $platform"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
