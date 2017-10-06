const {ipcRenderer} = require('electron')
ipcRenderer.on('message', console.log)
