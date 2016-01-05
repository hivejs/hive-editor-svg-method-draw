var path = require('path')
  , domOT = require('dom-ot')

module.exports = setup
module.exports.consumes = ['ui', 'ot']

function setup(plugin, imports, register) {
  var ui = imports.ui
  var ot = imports.ot

  ui.registerModule(path.join(__dirname, 'client.js'))
  ui.registerStaticDir(path.join(__dirname, 'lib'))

  var patchedDomOT = Object.assign({},domOT, {
    create: function(initialData) {
      return domOT.create(initialData || defaultInitialData)
    }
  })

  ot.registerOTType('svg', patchedDomOT)

  register()
}

var defaultInitialData = '<svg id="svgcontent" width="580" height="400" x="150.5" y="11.5" overflow="hidden" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 580 400"><g style="pointer-events:none"><title style="pointer-events:inherit">background</title><rect x="-1" y="-1" width="582" height="402" id="canvas_background" fill="#fff" style="pointer-events:inherit"/><g id="canvasGrid" width="100%" height="100%" x="0" y="0" overflow="visible" display="none"><rect width="100%" height="100%" x="0" y="0" stroke-width="0" stroke="none" fill="url(#gridpattern)" style="pointer-events: none; display:visible;"/></g></g><defs></defs><g style="pointer-events:all"><title style="pointer-events:inherit">Layer 1</title></g></svg>'
