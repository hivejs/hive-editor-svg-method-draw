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
var path = require('path')
  , domOT = require('dom-ot')
  , vdomToHtml = require('vdom-to-html')
  , sanitizeHtml = require('sanitize-html')
  , svgTags = require('svg-tags')

// Turn {camelCase: 'real-attr'} into ['real-attr']
var svgAttributes = (function(attrs){
  return Object.keys(attrs).map(camel=>attrs[camel])
})(require('svg-attributes'))

module.exports = setup
module.exports.consumes = ['ui', 'ot', 'importexport', 'sync', 'orm']

function setup(plugin, imports, register) {
  var ui = imports.ui
  var ot = imports.ot
  var importexport = imports.importexport
  var sync = imports.sync
  var orm = imports.orm

  ui.registerModule(path.join(__dirname, 'client.js'))
  ui.registerStaticDir(path.join(__dirname, 'lib'))

  var patchedDomOT = Object.assign({},domOT, {
    create: function(initialData) {
      return domOT.create(initialData || defaultInitialData)
    }
  })

  ot.registerOTType('image/svg+xml', patchedDomOT)

  importexport.registerExportProvider('image/svg+xml', 'image/svg+xml'
  , function*(document, snapshot) {
    return vdomToHtml(JSON.parse(snapshot.contents))
  })

  importexport.registerImportProvider('image/svg+xml', 'image/svg+xml'
  , function*(document, user, data) {
    var sanitizedSvg = sanitizeHtml(data, {
      allowedTags: svgTags
    , allowedAttributes: {
        '*': svgAttributes
      }
    })
    var importedTree = domOT.create(sanitizedSvg)

    // get gulf doc and prepare changes
    var gulfDoc = yield sync.getDocument(document.id)
    if(!gulfDoc.initialized) {
      yield function(cb) {
        gulfDoc.once('init', cb)
      }
    }

    var root = gulfDoc.content
      , insertPath = [root.childNodes.length]
      , changes = [new domOT.Move(null, insertPath, domOT.serialize(importedTree))]

    var snapshot = yield orm.collections.snapshot
    .findOne({id: document.latestSnapshot})

    // commit changes
    yield function(cb) {
      gulfDoc.receiveEdit(JSON.stringify({
        cs: JSON.stringify(changes)
      , parent: snapshot.id
      , user: user
      }), null, cb)
    }
  })

  register()
}

var defaultInitialData = '<svg id="svgcontent" width="580" height="400" x="150.5" y="11.5" overflow="hidden" xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 580 400"><g style="pointer-events:none"><title style="pointer-events:inherit">Drawing</title><rect x="-1" y="-1" width="582" height="402" id="canvas_background" fill="#fff" style="pointer-events:inherit"/><g id="canvasGrid" width="100%" height="100%" x="0" y="0" overflow="visible" display="none"><rect width="100%" height="100%" x="0" y="0" stroke-width="0" stroke="none" fill="url(#gridpattern)" style="pointer-events: none; display:visible;"/></g></g><defs></defs><g style="pointer-events:all"><title style="pointer-events:inherit">Layer 1</title></g></svg>'
