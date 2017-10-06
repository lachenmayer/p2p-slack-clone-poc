import {app} from 'electron'

const swarm = require('discovery-swarm')
const nanobus = require('nanobus')
const getPort = require('get-port')
const readline = require('readline')

import Feed from './Feed'

(async () => {
  const feed = new Feed()
  const channelPort = await getPort()
  feed.onReady(key => {
    const channel = swarm({id: key})
    channel.join('channel')
    channel.listen(channelPort)
    console.log('channel: listening on', channelPort)
    channel.on('connection', (connection, info) => {
      const key = info.id.toString('hex')
      console.log('channel: connecting to', key)
      const remoteFeed = new Feed(key)
    })
  })

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.on('line', message => {
    feed.writeMessage(message)
  })
})()
