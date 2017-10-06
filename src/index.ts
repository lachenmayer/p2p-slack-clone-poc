import {app} from 'electron'
const hypercore = require('hypercore')
const discovery = require('hyperdiscovery')
const ram = require('random-access-memory')
const nanobus = require('nanobus')

type Hypercore = {
  ready: () => void,
  writable: boolean,
}

type EventType = {
  type: string,
  payload: any,
  ts: number,
}

type MessageType = {
  author: string,
  content: EventType,
}


const debug = true

class Feed {
  key: string
  events: any
  feed: Hypercore

  constructor (otherKey?: string, persist: boolean = false) {
    this.events = nanobus()
    if (debug) {
      this.events.on('*', (name: string, data: any) => console.log(name, data))
    }

    this.feed = hypercore(
      (file: string) => ram(),
      otherKey,
      {valueEncoding: 'json'}
    )

    this.feed.ready(() => {
      this.key = this.feed.key.toString('hex')

      const swarm = discovery(feed)

      swarm.on('connect', (peer, id) => {
        this.events.emit('peer/connect', swarm.peers.length)
      })

      this.events.on('close', () => {
        swarm.close(swarmErr => {
          feed.close(feedErr => {
            this.events.emit('closed', swarmErr || feedErr)
          })
        })
      })

      this.events.emit('ready', this.key)

      if (feed.writable) {
        this.events.on('write', (event: EventType) => {
          this.feed.append(event, err => {
            if (err) console.error(err)
          })
        })
      }

      feed.createReadStream({live: true}).on('data', (event: EventType) => {
        this.events.emit('read', event)
      })
    })
  }

  onReady (listener: (key: string) => void) {
    this.events.on('ready', listener)
  }

  onPeerConnect (listener: (peerCount: number) => void) {
    this.events.on('peer/connect', listener)
  }

  onPeerDisconnect (listener: (peerCount: number) => void) {
    this.events.on('peer/disconnect', listener)
  }

  onRead (listener: (message: MessageType) => void) {
    this.events.on('read', (event: EventType) => {
      listener({
        author: this.key,
        content: event,
      })
    })
  }

  writeMessage (text: string) {
    this.events.emit('write', event('message', text))
  }

  follow (key: string) {
    this.events.emit('write', event('follow', key))
  }

  close () {
    this.events.emit('close')
  }

  onceClosed (listener: (err?: Error) => void) {
    this.events.once('closed', listener)
  }
}

function event (type, payload): EventType {
  return {
    type,
    payload,
    ts: +Date.now()
  }
}

const key = process.argv.length > 2 ?  process.argv[2] : undefined
const feed = new Feed(key)
feed.onReady(key => {
  if (feed.feed.writable) {
    setInterval(() => {
      console.log('writing')
      feed.writeMessage('hello world!')
    }, 1000)
  } else {
    feed.onRead(console.log)
  }
})
