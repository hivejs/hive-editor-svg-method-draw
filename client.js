/**
 * hive.js
 * Copyright (C) 2013-2016 Marcel Klehr <mklehr@gmx.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License version 2
 * as published by the Mozilla Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the Mozilla Public License
 * along with this program.  If not, see <https://www.mozilla.org/en-US/MPL/2.0/>.
 */
var bindEditor = require('./methodDrawBinding')

module.exports = setup
module.exports.consumes = ['ui', 'editor']
module.exports.provides = []
function setup(plugin, imports, register) {
  var editor = imports.editor
    , ui = imports.ui

  editor.registerEditor('Method-Draw', 'image/svg+xml', 'An easy to use, full-featured SVG editor'
  , function(el, onClose) {
    var iframe = document.createElement('iframe')
    iframe.setAttribute('src', ui.baseURL+'/static/hive-editor-svg-method-draw/lib/Method-Draw/index.html')

    // Maximize editor
    el.style['height'] = '100%'
    iframe.style['position'] = 'absolute'
    iframe.style['border'] = 'none'
    iframe.style['width'] = '0px' // hide initially until content is loaded
    iframe.style['height'] = '0px'

    window.addEventListener('scroll', updateFramePosition)
    window.addEventListener('resize', updateFramePosition)

    onClose(_ => {
      window.removeEventListener('scroll', updateFramePosition)
      window.removeEventListener('resize', updateFramePosition)
      if(document.body.contains(iframe)) document.body.removeChild(iframe)
    })

    // load the editor
    return new Promise(function(resolve) {
      iframe.onload = function() {
        resolve()
      }
      // we don't add it to #editor `el`, because vdom cannot handle iframes
      document.body.appendChild(iframe)
    })
    .then(() => {
      iframe.contentDocument.querySelector('#menu_bar').style['visibility'] = 'hidden'

      // bind editor
      var methodDraw = iframe.contentDocument.defaultView.methodDraw
        , doc = bindEditor(methodDraw, iframe.contentDocument)
      doc.once('editableInitialized', () => {
	setImmediate(updateFramePosition) // Defer, because the loading bar disappears on the same event
      })
      return Promise.resolve(doc)
    })

    function updateFramePosition() {
      var rect = el.getBoundingClientRect()
      iframe.style['top'] = rect.top+'px'
      iframe.style['left'] = rect.left+'px'
      iframe.style['height'] = rect.height+'px'
      iframe.style['width'] = rect.width+'px'
    }
  })
  register()
}
