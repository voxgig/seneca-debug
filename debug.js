/* Copyright (c) 2018 voxgig and other contributors, MIT License */
"use strict";

const Util = require("util");

const Hapi = require("hapi");
const Inert = require("inert");
const Nes = require("nes");
const _ = require("lodash");

var Errors = require("./lib/errors");

module.exports = debug;

debug.defaults = {
  hapi: {
    port: 8899,
    host: "localhost"
  },
  wspath: "/debug",
  store: false,
  test: false,
  prod: false
};

debug.errors = {};

debug.preload = function preload_debug(plugin) {
  intern.error = Errors(this);
  intern.clean = this.util.clean;
};

function debug(options) {
  const seneca = this;

  var log_to_console = false;
  var log_to_console_users = {};

  this.inward(function(ctxt, data) {
    data.debug_kind = "in";

    var data_in;
    if (options.store) {
      const meta = data.meta;
      const parent = meta.parents[0] ? meta.parents[0][1] : null;

      const parent_trace = parent
        ? intern.map[parent]
          ? intern.map[parent]
          : intern.trace
        : intern.trace;

      const trace_node = {
        meta: meta,
        msg: data.msg,
        children: []
      };

      parent_trace.children.push(trace_node);
      intern.map[meta.id] = trace_node;
    }

    if (intern.hapi_ready) {
      if (!options.prod) intern.hapi.publish(intern.wspath, data);

      data_in = JSON.stringify(data);

      var logged = false;
      if (log_to_console) {
        logged = true;
        console.log(data_in);
      }

      if (
        data.meta &&
        data.meta.custom &&
        data.meta.custom.principal &&
        data.meta.custom.principal.user &&
        data.meta.custom.principal.user.handle
      ) {
        if (!logged) {
          for (let u in log_to_console_users) {
            if (
              log_to_console_users[u] &&
              data.meta.custom.principal.user.handle === u
            )
              console.log(data_in);
          }
        }
        data_in = JSON.parse(data_in);
        if (options.prod) {
          data_in.msg = seneca.util.clean(data_in.msg);
          data_in.meta = {
            id: data.meta.id,
            start: data.meta.start,
            end: data.meta.end,
            pattern: data.meta.pattern,
            plugin: data.meta.plugin,
            instance: data.meta.instance
          };

          if (data.meta.parents && data.meta.parents.length > 1) {
            data_in.meta.parents = null;
            data_in.meta.parent = data.meta.parents[0][1];
          } else {
            data_in.meta.parents = data.meta.parents;
            data_in.meta.custom = data.meta.custom;
          }
        }

        intern.hapi.publish(
          "/filter/" + data.meta.custom.principal.user.handle,
          data_in
        );
      }
    }
  });

  this.outward(function(ctxt, data) {
    data.debug_kind = "out";

    var data_out;

    if (options.store) {
      const trace_node = intern.map[data.meta.id];

      // NOTE: some outward events are virtual from default$ directives
      // TODO: this needs review in Seneca core
      if (trace_node) {
        trace_node.res = data.res;
        trace_node.err = data.err;
      }
    }

    if (intern.hapi_ready) {
      if (!options.prod) intern.hapi.publish(intern.wspath, data);

      data_out = JSON.stringify(data);

      var logged = false;

      if (log_to_console) {
        logged = true;
        console.log(data_out);
      }

      if (
        data.meta &&
        data.meta.custom &&
        data.meta.custom.principal &&
        data.meta.custom.principal.user &&
        data.meta.custom.principal.user.handle
      ) {
        if (!logged) {
          for (let u in log_to_console_users) {
            if (
              log_to_console_users[u] &&
              data.meta.custom.principal.user.handle === u
            )
              console.log(data_out);
          }
        }
        data_out = JSON.parse(data_out);
        data_out.err = data.meta.err;
        data_out.error = data.meta.error;

        if (options.prod) {
          data_out.msg = {};
          data_out.meta = {
            id: data.meta.id,
            start: data.meta.start,
            end: data.meta.end,
            pattern: data.meta.pattern,
            parents: data.meta.parents
          };

          data_out.err = data.meta.err;
          data_out.error = data.meta.error;

          if (data.meta.parents && data.meta.parents.length > 1) {
            data_out.result_length = JSON.stringify(data_out.res).length;
            data_out.res = null;
            data_out.meta.parents = null;
            data_out.meta.parent = data.meta.parents[0][1];
          }
        }

        intern.hapi.publish(
          "/filter/" + data.meta.custom.principal.user.handle,
          data_out
        );
      }
    }
  });

  this.prepare(async function() {
    var seneca = this;

    intern.hapi = new Hapi.Server(options.hapi);

    await intern.hapi.register(Inert);
    await intern.hapi.register(Nes);

    intern.hapi.subscription(options.wspath);

    intern.hapi.subscription("/filter/{handle}");

    intern.hapi.route({
      method: "GET",
      path: "/{param*}",
      handler: {
        directory: {
          path: __dirname + "/dist",
          index: true
        }
      }
    });

    intern.hapi.route({
      method: "GET",
      path: "/config",
      handler: async function(req, h) {
        return {
          port: options.hapi.port
        };
      }
    });

    intern.hapi.route({
      method: "GET",
      path: "/console",
      handler: async function(req, h) {
        log_to_console = true;

        setTimeout(() => {
          log_to_console = false;
        }, 60000);

        return "ok";
      }
    });

    intern.hapi.route({
      method: "GET",
      path: "/console_user/{user}",
      handler: async function(req, h) {
        log_to_console_users[req.params.user] = true;

        setTimeout(() => {
          if (log_to_console_users[req.params.user])
            delete log_to_console_users[req.params.user];
        }, 60000);

        return req.params.user;
      }
    });

    if (options.test) {
      intern.hapi.route({
        method: "GET",
        path: "/test",
        handler: async function(req, h) {
          setInterval(function() {
            seneca.act(
              "b:1,y:3,foo:" +
                ["red", "green", "blue"][Math.floor(3 * Math.random())]
            );
          }, 1000);

          return await seneca.post("b:1,y:3");
        }
      });
    }

    await intern.hapi.start();

    intern.hapi_ready = true;
    intern.wspath = options.wspath;
  });

  return {
    export: {
      trace: intern.trace,
      print: intern.print
    }
  };
}

const intern = (debug.intern = {
  trace: {
    children: [],
    meta: {
      pattern: "top:true"
    }
  },
  map: {},
  hapi_ready: false,
  print: function() {
    function walk(trace, depth, buf) {
      buf.push(
        intern.spaces.substring(0, depth * 2) +
          trace.meta.pattern +
          " " +
          trace.meta.id +
          " IN:" +
          Util.inspect(intern.clean(trace.msg)).replace(/\n/g, " ") +
          " OUT:" +
          Util.inspect(trace.res).replace(/\n/g, " ") +
          " ERR:" +
          (trace.err && trace.err.message) +
          ""
      );
      trace.children.forEach(x => walk(x, depth + 1, buf));
      return buf;
    }

    return walk(intern.trace, 0, []).join("\n");
  },
  clean: null,
  spaces:
    "                                                                                                                                                                                                                                                                                                                                                                                                                                   "
});
