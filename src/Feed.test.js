import {app} from 'electron'
import Feed from './Feed'

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
