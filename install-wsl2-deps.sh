#!/bin/bash
# Install WSL2 dependencies for ACI keyring support

echo "Installing WSL2 dependencies for secure credential storage..."
echo

# Update package lists
echo "Updating package lists..."
sudo apt-get update

# Install libsecret (required for keytar)
echo
echo "Installing libsecret packages..."
sudo apt-get install -y libsecret-1-0 libsecret-1-dev

# Install additional keyring support if needed
echo
echo "Installing additional keyring support..."
sudo apt-get install -y gnome-keyring dbus-x11

# Install build essentials if needed for native modules
echo
echo "Installing build essentials for native modules..."
sudo apt-get install -y build-essential

echo
echo "Installation complete!"
echo
echo "If you still encounter keyring issues, you can:"
echo "1. Try running: export $(dbus-launch)"
echo "2. Use token-based authentication as described in the README"
echo
echo "To test if keyring is working:"
echo "3. Run: bun run dev status"