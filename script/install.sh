#!/usr/bin/env bash

if lsb_release -a 2> /dev/null | grep -q "Ubuntu"; then
  echo "Installing packages for Ubuntu";

  if ! node --version 2> /dev/null | grep -q "7." ; then
    echo "Adding 7.X node version to sources"
    echo "WARNING: This probably will affect other node applications."

    read -n1 -r -p "Press space if this is OK. Otherwise this step is skipped." key

    if [ "$key" = '' ]; then
      curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
      sudo apt-get install -y nodejs
    else
      echo
      echo "Skipping node installation."
    fi
  fi

  sudo apt-get install -y xorriso

elif lsb_release -a 2> /dev/null | grep -q "Arch"; then
  echo "Installing packages for Arch";
  sudo pacman -S --needed nodejs npm xorriso
fi;

# NOTE The following line requires that install.sh is one dir under the project
# root.

IR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASEDIR=`cd "$IR/.."; pwd` # Provides absoloute directory, just in case.

echo "Installing server dependencies..."
cd "$BASEDIR/server" && npm install
echo "Installing client dependencies..."
cd "$BASEDIR/client" && npm install

# Add (relative) symlinks for client HTML javascript/css dependencies
echo "Creating symlinks for client dependencies"
cd $BASEDIR/client/app
mkdir thirdparty
cd thirdparty
ln -s ../../node_modules/jquery/dist jquery
ln -s ../../node_modules/tether/dist tether
ln -s ../../node_modules/bootstrap/dist bootstrap

echo "Creating symlinks for build system"
echo "Running build system to create cache folders"
cd $BASEDIR/client
npm run release
echo "Fixing above error"

# Uses find to determine where to put the symlink (survives new versions)
ln -fs /usr/bin/xorriso "$(find ~/.cache/electron-builder -name 'xorriso')"

echo "Done!"
