/**
 * methodDraw binding for gulf documents
 * Copyright (C) 2015 Marcel Klehr <mklehr@gmx.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var gulf = require('gulf')
  , domOT = require('dom-ot')
  , MutationSummary = require('mutation-summary')

module.exports = function(methodDraw, document) {
  var doc = new gulf.EditableDocument(new gulf.MemoryAdapter, domOT)
  var contenteditable = document.querySelector('#svgcontent')

  doc._setContents = function(newcontent, cb) {
    methodDraw.loadFromString(newcontent.outerHTML)
    setTimeout(function() {
      contenteditable = document.querySelector('#svgcontent') // Must be after loadFromString
      domOT.adapters.mutationSummary.createIndex(contenteditable)
      registerObserver(contenteditable)
      cb()
    },1000)
  }

  doc._change = function(changes, cb) {
    observer && observer.disconnect()
    console.log(changes)

    contenteditable = document.querySelector('#svgcontent')

    var ops = domOT.unpackOps(changes)
    ops.forEach(function(op) {
      op.apply(contenteditable, /*index:*/true)
    })

    observer && observer.reconnect()
    cb()
  }

  doc._collectChanges = function(cb) {
    // changes are automatically collected by MutationSummary
    cb()
  }

  registerObserver(contenteditable)
  domOT.adapters.mutationSummary.createIndex(contenteditable)

  var observer
  function registerObserver(contenteditable) {
    observer = new MutationSummary({
      rootNode: contenteditable, // (defaults to window.document)
      oldPreviousSibling: true,
      queries: [
        { all: true}
      ],
      callback: onChange
    })
  }

  function onChange(summaries) {
    var ops = domOT.adapters.mutationSummary.import(summaries[0], contenteditable)
    ops = ops.filter(function(op) {
      // filter out changes to the root node
      if(op.path) return !!op.path.length
      else return true
    })
    if(!ops.length) return
    console.log(ops)
    doc.update(ops)
    ops.forEach(function(op) {
      op.apply(contenteditable, /*index:*/true, /*dry:*/true)
    })
  }

  return doc
}
