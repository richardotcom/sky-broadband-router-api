### Prerequisites
1. Install NodeJS version 22.11 or newer. Commands for Unix environment below:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/{version}/install.sh | bash
nvm install --lts
```
2. Install Node package manager and restore required packages.
```
sudo apt-get install npm
npm install
```
3. Rename `sample.env` file to just `.env` and change the value of `PASSWORD` to your router's password which may not necessarily be the same as your WiFi password.

### Run from project's root directory
```
npx ts-node src/main.ts
```
