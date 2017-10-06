import {Readable} from 'stream'
const getPort = require('get-port')
const hypercore = require('hypercore')
const discovery = require('hyperdiscovery')
const ram = require('random-access-memory')
const nanobus = require('nanobus')

import {MessageType, EventType} from './interfaces'

interface Hypercore<T> {
  append (message: T, callback: (err: Error | null, index: number) => void): void,
  ready (callback: (err: Error | null) => void): void,
  close (callback: (err: Error | null) => void): void,
  createReadStream ({live: boolean}): Readable,
  key: Buffer,
  writable: boolean,
}

const debug = true

export default class Feed {
  key: string
  events: any
  feed: Hypercore<EventType>

  constructor (otherKey?: string | Buffer, persist: boolean = false) {
    this.events = nanobus()
    if (debug) {
      this.events.on('*', (name: string, data: any) => console.log(name, data))
    }

    this.feed = hypercore(
      (file: string) => ram(),
      otherKey,
      {valueEncoding: 'json'}
    )

    this.feed.ready(async err => {
      if (err) throw err
      this.key = this.feed.key.toString('hex')

      const swarm = discovery(this.feed, {
        port: await getPort(),
      })

      swarm.on('connect', (peer, id) => {
        this.events.emit('peer/connect', swarm.peers.length)
      })

      swarm.on('disconnect', (peer, id) => {
        this.events.emit('peer/disconnect', swarm.peers.length)
      })

      this.events.on('close', () => {
        swarm.close(swarmErr => {
          this.feed.close(feedErr => {
            this.events.emit('closed', swarmErr || feedErr)
          })
        })
      })

      this.events.emit('ready', this.key)

      if (this.feed.writable) {
        this.events.on('write', (event: EventType) => {
          this.feed.append(event, err => {
            if (err) console.error(err)
          })
        })
      }

      this.feed.createReadStream({live: true}).on('data', (event: EventType) => {
        this.events.emit('read', event)
      })
    })
  }

  onReady (listener: (key: Buffer) => void) {
    this.feed.ready(() => listener(this.feed.key))
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
