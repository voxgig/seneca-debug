/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'


const Util = require('util')


var Errors = require('./lib/errors')



module.exports = debug

debug.defaults = {}
debug.errors = {}

debug.preload = function preload_debug() {
  intern.error = Errors(this)
  intern.clean = this.util.clean
  
  this.inward(function(ctxt, data) {
    const meta = data.meta
    const parent = meta.parents[0] ? meta.parents[0][1] : null

    const parent_trace = parent ? intern.map[parent] : intern.trace

    const trace_node = {
      meta: meta,
      msg: data.msg,
      children: []
    }

    parent_trace.children.push(trace_node)
    intern.map[meta.id] = trace_node
  })

  this.outward(function(ctxt, data) {
    const trace_node = intern.map[data.meta.id]

    // NOTE: some outward events are virtual from default$ directives
    // TODO: this needs review in Seneca core
    if(trace_node) {
      trace_node.res = data.res
      trace_node.err = data.err
    }
  })

}

function debug(options) {
  return {
    export: {
      trace: intern.trace,
      print: intern.print
    }
  }
}


const intern = debug.intern = {
  trace: {
    children:[],
    meta:{
      pattern:'top:true'
    }
  },
  map: {},
  print: function() {
    function walk(trace, depth, buf) {
      buf.push(intern.spaces.substring(0,depth*2)+trace.meta.pattern+
               ' '+trace.meta.id+
               ' IN:'+Util.inspect(intern.clean(trace.msg)).replace(/\n/g, ' ')+
               ' OUT:'+Util.inspect(trace.res).replace(/\n/g, ' ')+
               ' ERR:'+(trace.err&&trace.err.message)+
               '')
      trace.children.forEach((x) => walk(x, depth+1, buf))
      return buf
    }

    return walk(intern.trace,0,[]).join('\n')
  },
  clean: null,
  spaces:"                                                                                                                                                                                                                                                                                                                                                                                                                                   "
}

