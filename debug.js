/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'


const Util = require('util')


var Errors = require('./lib/errors')
var error = null

module.exports = debug

debug.defaults = {}
debug.errors = {}

debug.preload = function preload_debug() {
  error = Errors(this)
}

function debug(options) {

}


