var bindEditor = require('./methodDrawBinding')

module.exports = setup
module.exports.consumes = ['ui', 'editor']
module.exports.provides = []
function setup(plugin, imports, register) {
  var editor = imports.editor
    , ui = imports.ui

  editor.registerEditor('Method-Draw', 'svg', 'An easy to use, full-featured SVG editor'
  , function(el) {
    var iframe = document.createElement('iframe')
    iframe.setAttribute('src', ui.baseURL+'/static/hive-editor-svg-method-draw/lib/Method-Draw/index.html')

    // Maximize editor
    el.style['height'] = '100%'
    iframe.style['width'] = '100%'
    iframe.style['height'] = '100%'
    iframe.setAttribute('border', '0')

    // load the editor
    return new Promise(function(resolve) {
      iframe.onload = function() {
        resolve()
      }
      el.appendChild(iframe)
    }).then(function() {
      iframe.contentDocument.querySelector('#menu_bar').style['visibility'] = 'hidden'

      /* bind editor */
      var methodDraw = iframe.contentDocument.defaultView.methodDraw
      return Promise.resolve(bindEditor(methodDraw, iframe.contentDocument))
    })
  })
  register()
}
