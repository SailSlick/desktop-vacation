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

  if ! 'python3 -c "import kivy"' 2> /dev/null; then
    sudo add-apt-repository -y ppa:kivy-team/kivy
    sudo apt-get update
    sudo apt-get -y install python3-kivy
  fi

  sudo apt-get install -y python3 python-pip python3-dev build-essential
  sudo -H pip install --upgrade pip
  sudo -H pip install --upgrade virtualenv

elif lsb_release -a 2> /dev/null | grep -q "Arch"; then
  echo "Installing packages for Arch";
  sudo pacman -S --needed nodejs npm python python-kivy
  sudo pip install virtualenv
fi;

# NOTE The following line requires that install.sh is one dir under the project
# root.

IR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASEDIR=`cd "$IR/.."; pwd` # Provides absoloute directory, just in case.

cd $BASEDIR/server && npm install

if [ ! -d "$BASEDIR/venv" ]; then
  virtualenv -p python3 -q $BASEDIR/venv --no-site-packages
  echo "Virtualenv created."
fi

source $BASEDIR/venv/bin/activate
pip install -r $BASEDIR/requirements.txt
