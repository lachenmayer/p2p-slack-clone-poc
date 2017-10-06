const packager = require('electron-packager')
const path = require('path')

const options = {
  asar: false,
  dir: __dirname,
  overwrite: true,
  // icon: path.join(__dirname, 'assets', 'icon.icns'),
}

packager(options, (err, appPaths) => {
  if (err) console.log(err)
  console.log(appPaths)
})
