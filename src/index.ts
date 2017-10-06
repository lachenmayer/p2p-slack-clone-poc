import {app, BrowserWindow, ipcMain} from 'electron'
const swarm = require('discovery-swarm')
const getPort = require('get-port')
const path = require('path')
const url = require('url')

import Feed from './Feed'

let win

function createWindow () {
  win = new BrowserWindow({width: 500, height: 500})
  win.loadURL(url.format({
    pathname: path.join(__dirname, '..', 'index.html'),
    protocol: 'file:',
    slashes: true,
  }))

  win.maximize()
  // win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
  })

  let initialTimeout = 500 // HACK otherwise the events get sent before UI is loaded.

  const alreadyConnected = {}

  const me = new Feed()
  me.onReady(async key => {
    me.onRead(message => {win.webContents.send('message', message)})

    ipcMain.on('send', (_, message) => {
      console.log(message)
      me.writeMessage(message)
    })

    const channel = swarm({id: key, utp: false})
    channel.join('channel')
    const port = await getPort()
    channel.listen(port)
    channel.on('connection', (connection, info) => {
      const key = info.id.toString('hex')
      if (alreadyConnected[key]) {
        console.log('already connected to ' + key)
        return
      }
      alreadyConnected[key] = true
      const other = new Feed(key)
      other.onReady(() => {
        setTimeout(() => {
          win.webContents.send('join', key.toString('hex'))
          other.onRead(message => win.webContents.send('message', message))
          initialTimeout = 0 // HACK do it instantly anytime except the first time.
        }, initialTimeout)
      })
    })
  })
}

app.on('ready', createWindow)

// app.on('window-all-closed', () => {
//   app.quit()
// })

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
