import {app, BrowserWindow} from 'electron'
const swarm = require('discovery-swarm')
const getPort = require('get-port')
const path = require('path')
const readline = require('readline')
const url = require('url')

import Feed from './Feed'

let win

function createWindow () {
  win = new BrowserWindow({width: 500, height: 500})
  win.loadURL(url.format({
    pathname: path.resolve('./index.html'),
    protocol: 'file:',
    slashes: true,
  }))

  win.webContents.openDevTools()

  win.on('closed', () => {
    win = null
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

const me = new Feed()
me.onReady(async key => {
  me.onRead(message => win.webContents.send('message', message))

  const channel = swarm({id: key, utp: false})
  channel.join('channel')
  const port = await getPort()
  channel.listen(port)
  channel.on('connection', (connection, info) => {
    const key = info.id.toString('hex')
    console.log('channel: connecting to', key)
    const other = new Feed(key)
    other.onRead(message => win.webContents.send('message', message))
  })
})

// const rl = require('readline').createInterface({
//   input: process.stdin,
//   output: process.stdout,
// })
// rl.on('line', message => {
//   me.writeMessage(message)
// })
