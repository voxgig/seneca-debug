/* Copyright (c) 2018 voxgig and other contributors, MIT License */
'use strict'


const Util = require('util')

const Hapi = require('hapi')
const Inert = require('inert')
const Nes = require('nes')

var Errors = require('./lib/errors')



module.exports = debug

debug.defaults = {
  hapi: {
    port: 8899,
    host: 'localhost'
  },
  wspath: '/debug',
  store: false,
  test: false
}

debug.errors = {}

debug.preload = function preload_debug(plugin) {
  intern.error = Errors(this)
  intern.clean = this.util.clean
}

function debug(options) {
  this.inward(function(ctxt, data) {
    data.debug_kind = 'in'

    if(options.store) {
      const meta = data.meta
      const parent = meta.parents[0] ? meta.parents[0][1] : null

      const parent_trace = parent ? intern.map[parent] ? intern.map[parent] : intern.trace : intern.trace

      const trace_node = {
        meta: meta,
        msg: data.msg,
        children: []
      }

      parent_trace.children.push(trace_node)
      intern.map[meta.id] = trace_node
    }
    
    if(intern.hapi_ready) {
      intern.hapi.publish(intern.wspath, data)
    }
  })


  this.outward(function(ctxt, data) {
    data.debug_kind = 'out'

    if(options.store) {
      const trace_node = intern.map[data.meta.id]

      // NOTE: some outward events are virtual from default$ directives
      // TODO: this needs review in Seneca core
      if(trace_node) {
        trace_node.res = data.res
        trace_node.err = data.err
      } 
    }
    
    if(intern.hapi_ready) {
      intern.hapi.publish(intern.wspath, data)
    }
  })

  
  this.prepare(async function() {
    var seneca = this
    
    intern.hapi = new Hapi.Server(options.hapi)

    await intern.hapi.register(Inert)
    await intern.hapi.register(Nes)

    intern.hapi.subscription(options.wspath)

    intern.hapi.route({
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: __dirname+'/dist',
          index: true,
        }
      }
    })

      intern.hapi.route({
        method: 'GET',
        path: '/config',
        handler: async function(req,h) {
          return {
            port: options.hapi.port
          }
        }
      })
    
    if(options.test) {
      intern.hapi.route({
        method: 'GET',
        path: '/test',
        handler: async function(req,h) {
          
          setInterval(function(){
            seneca.act('b:1,y:3,foo:'+(['red','green','blue'][Math.floor(3*Math.random())]))
          },1000)
          
          return await seneca.post('b:1,y:3')
        }
      })
    }
    
    await intern.hapi.start()

    intern.hapi_ready = true
    intern.wspath = options.wspath
  })

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
  hapi_ready: false,
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

