# Super Payload Launcher 🚀🎮
A new, pretty, simple, and cross platform tool for injecting payloads onto your Switch to boot into Atmosphere, Hekate, Android etc!

---

## Supported platforms 🖥️
Super Payload Launcher will happily launch your payloads from **Windows**, **Mac OS** and **Linux**.

*To use the application on Linux you currently have to build from source. A guide to this can be found below.*

## Download instructions 📥
Head to [the releases page](https://github.com/versionxcontrol/super-payload-launcher/releases) and grab the latest version for your operating system from there. The application does not require any install, just download and run the application from anywhere.

---

![Super Payload Launcher teaser image](.github/img/spl.jpg)

---

# How to build the application (for developers) 🏗️
This is an application built using [Electron](https://www.electronjs.org/). To get started make sure you've got NodeJS installed and up to date.

Check out the repo to your machine, and open the project's folder in your command line of choice.

### Install dependencies:
```
npm install
```
### Run the application:
```
node_modules/.bin/electron.cmd
```

<br />

### To fix broken webusb bindings:
The current version of the webusb library has issues with it's binding file. If you're suffering from crashes or errors when building from source, run this command in the project folder.
#### Windows
```
node_modules/.bin/electron-rebuild.bat
```
#### MacOS/Linux
```
node_modules/.bin/electron-rebuild
```

---

# License 📄

This application is written and licensed under GPL-3.0. You are free to modify and distribute the code and application as you see fit. All that's required is a link back to the code here and give a credit to the application's author.

---

# Contact 📞

If you appreciate this software, or have some feedback to give, please email me at versionxcontrol@gmail.com.

If you REALLY like the software, you can also buy me a coffee 🙏 
</br></br><a href="https://www.buymeacoffee.com/version_control" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
