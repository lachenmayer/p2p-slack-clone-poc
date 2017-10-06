const {ipcRenderer} = require('electron')
const choo = require('choo')
const html = require('choo/html')

const app = choo()
app.use(ipc)
app.route('/', mainView)
app.mount('#container')

function ipc (state, emitter) {
  state.members = {}
  state.messages = []
  ipcRenderer.on('join', key => {
    state.members[key] = true
    emitter.emit('render')
  })
  // TODO
  ipcRenderer.on('leave', key => {
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
      ${state.messages.map(message => messageView(message))}
      ${inputView(state, emit)}
    </div>
  `
}

function messageView (message) {
  if (message.content.type === 'message') {
    return html`<div class="message">${message.author.slice(0, 6)}: ${message.content.payload}</div>`
  }
  return html`<div class="unknown">${JSON.stringify(message)}</div>`
}

function inputView (state, emit) {
  const oninput = event => emit('input', event)
  const onenter = event => emit('enter', event)
  return html`<input class="input" type="text" onkeydown=${event => {if (event.key === 'Enter') onenter(event)}} oninput=${oninput} value="${state.input}"></input>`
}
