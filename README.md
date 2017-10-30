# Emoji Tools

[![Build Status](https://travis-ci.com/MitchTalmadge/Emoji_Tools.svg?token=5Dpzp2yqMmhwzzqMVNud&branch=master)](https://travis-ci.com/MitchTalmadge/Emoji_Tools)

https://EmojiTools.org/

Emoji Tools allows you to modify the emojis on your phone!

## Developing

Start by running `npm i` to install all the necessary packages from npm.

The development environment is in two parts: 
- The Electron window: run with `npm run dev-electron`
- The Webpack Dev Server: run with `npm run dev-watch`

During development, the Electron window will load the url `http://localhost:9000/`, which is where the Webpack Dev Server hosts the Angular files that compose Emoji Tools.

The Dev Server is necessary because it will automatically re-load whenever you change any files.

## Compiling

To compile, run `npm run build`. Results can be found in `build/bin`. Generally, it is a good idea to let the continuous integration server do the compiling.