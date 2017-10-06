const {ipcRenderer} = require('electron')
const choo = require('choo')
const html = require('choo/html')
const moment = require('moment')

const app = choo()
app.use(ipc)
app.route('/', mainView)
app.mount('#container')

function ipc (state, emitter) {
  state.members = {}
  state.messages = []
  ipcRenderer.on('join', (_, key) => {
    state.members[key] = true
    emitter.emit('render')
  })
  // TODO
  ipcRenderer.on('leave', (_, key) => {
    delete state.members[key]
    emitter.emit('render')
  })

  ipcRenderer.on('message', (_, message) => {
    state.messages.push(message)
    state.messages.sort((a, b) => {
      return a.content.ts - b.content.ts
    })
    emitter.emit('render')
  })

  state.input = ''
  emitter.on('input', event => {
    state.input = event.target.value
  })

  emitter.on('enter', event => {
    ipcRenderer.send('send', state.input)
    state.input = ''
    event.target.value = ''
  })
}

function mainView (state, emit) {
  return html`
    <div id="container">
      <div class="members">
        ${Object.keys(state.members).map(member => memberView(member))}
      </div>
      <div class="messages">
        ${state.messages.map(message => messageView(message))}
        ${inputView(state, emit)}
      </div>
    </div>
  `
}

function messageView (message) {
  const messageColor = message.author.slice(0, 6)
  if (message.content.type === 'message') {
    return html`<div class="message">
      <div class="content" style="background: #${messageColor}; color: ${getContrastYIQ(messageColor)}">${message.content.payload}</div>
      <div class="meta"><span class="author">${message.author}</span> <span class="time">${moment(message.content.ts).fromNow()}</span></div>
    </div>`
  }
  return html`<div class="unknown">${JSON.stringify(message)}</div>`
}

function memberView (member) {
  const color = member.slice(0, 6)
  return html`<div style="background: #${color}; color: ${getContrastYIQ(color)}" class="member">${color}...</div>`
}

function inputView (state, emit) {
  const oninput = event => emit('input', event)
  const onenter = event => emit('enter', event)
  return html`<input class="input" type="text" onkeydown=${event => {if (event.key === 'Enter') onenter(event)}} oninput=${oninput} value="${state.input}"></input>`
}

function getContrastYIQ (hexcolor) {
	var r = parseInt(hexcolor.substr(0,2), 16)
	var g = parseInt(hexcolor.substr(2,2), 16)
	var b = parseInt(hexcolor.substr(4,2), 16)
	var yiq = ((r*299)+(g*587)+(b*114))/1000
	return (yiq >= 128) ? 'black' : 'white'
}
