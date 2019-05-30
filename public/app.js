const top = {
  items: []
};

var msgmap = {};
var msgmapchildren = {};
var msgmapdata = {};
var searchlist = [];

export default {
  components: {},
  data() {
    return {
      items: top.items,
      active: [],
      open: [],
      search_txt: "",
      filter_txt: ""
    };
  },
  created: function() {
    const self = this;
    this.$root.$on("msg", function(data) {
      self.addmsg(data);
    });
  },
  computed: {
    selected: function() {
      if (!this.active.length) return undefined;
      const id = this.active[0];
      return msgmapdata[id];
    }
  },

  watch: {
    "items.length": function() {
      if (this.search_txt) this.search();
    },
    search_txt: function() {
      this.search();
    },
    filter_txt: function() {
      this.$root.$emit("filter", this.filter_txt);
    }
  },

  methods: {
    clear: function() {
      searchlist = [];
      msgmap = {};
      msgmapchildren = {};
      msgmapdata = {};
      this.items.splice(0, this.items.length);
    },
    load_children: function(data) {
      data.children = msgmapchildren[data.id];
    },
    addmsg: function(data) {
      const meta = data.meta;
      const parent = meta.parent
        ? meta.parent
        : meta.parents[0]
        ? meta.parents[0][1]
        : null;

      if ("in" === data.debug_kind && !msgmap[meta.id]) {
        const parent_children = parent
          ? msgmapchildren[parent]
            ? msgmapchildren[parent]
            : top.items
          : top.items;

        const entry = {
          id: data.meta.id,
          name: (data.meta.start % 10000000) + " " + data.meta.pattern,
          children: [],
          error: false,
          duration: null,
          num_children: 0
        };

        msgmapdata[meta.id] = {
          id: meta.id,
          name: data.name,
          data: data
        };

        parent_children.unshift(entry);
        msgmap[meta.id] = entry;
        msgmapchildren[meta.id] = [];
      } else if ("out" === data.debug_kind && msgmap[meta.id]) {
        msgmap[meta.id].error = data.error;
        msgmap[meta.id].duration = meta.end - meta.start;
        msgmap[meta.id].num_children = msgmapchildren[meta.id].length;

        msgmapdata[meta.id].data.res = data.res;
        msgmapdata[meta.id].data.err = data.err;
        msgmapdata[meta.id].data.error = data.error;
        msgmapdata[meta.id].data.meta.end = meta.end;
        msgmapdata[meta.id].data.result_length = data.result_length;

        searchlist.push({
          id: meta.id,
          text: JSON.stringify(msgmapdata[meta.id].data).toLowerCase(),
          parent: parent
        });
      }
    },

    search: function() {
      console.log("search");
      var self = this;
      self.term = this.search_txt.toLowerCase();

      const list = self.$refs.msgtree.nodes;

      for (var i = 0; i < searchlist.length; i++) {
        const item = searchlist[i];
        const found = self.term && item.text.indexOf(self.term) !== -1;

        self.walkup(function(item) {
          const node = list[item.id];
          const vnode = node && node.vnode;
          const el = vnode && vnode.$el;
          if (el) {
            if (found) {
              el.classList.add("found-msg");
            } else {
              el.classList.remove("found-msg");
            }
          }
        }, item);
      }
    },

    walk: function(op, item) {
      if (item) {
        op(item);
      }

      const children = (item && item.children) || this.items;
      for (var i = 0; i < children.length; i++) {
        this.walk(op, children[i]);
      }
    },
    walkup: function(op, item, found) {
      if (item) {
        op(item, found);
      }
      const parent = item && item.parent;
      if (!parent) return;
      this.walkup(op, searchlist[parent], found);
    }
  }
};
