const top = {
  items: []
};

const msgmap = {};
const msgmapchildren = {};

export default {
  components: {},
  data() {
    return {
      items: top.items,
      active: [],
      open: []
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
      return msgmap[id];
    }
  },

  methods: {
    load_children: function(data) {
      data.children = msgmapchildren[data.id];
    },
    addmsg: function(data) {
      const meta = data.meta;
      const parent = meta.parents[0] ? meta.parents[0][1] : null;

      if ("in" === data.debug_kind && !msgmap[meta.id]) {
        const parent_children = parent
          ? msgmapchildren[parent]
            ? msgmapchildren[parent]
            : top.items
          : top.items;

        const entry = {
          id: data.meta.id,
          name: (data.meta.start % 10000000) + " " + data.meta.pattern,
          data: data,
          children: []
        };

        const entry_children = [];

        parent_children.push(entry);
        msgmap[meta.id] = entry;
        msgmapchildren[meta.id] = entry_children;
      } else if ("out" === data.debug_kind && msgmap[meta.id]) {
        msgmap[meta.id].name += " " + (meta.end - meta.start) + "ms";
        msgmap[meta.id].data = data;
      }
    },

    search: function(term) {
      var self = this;
      self.term = null == term || "" == term ? null : term.toLowerCase();

      if (!self.search_running) {
        self.search_running = true;
        run_search();
        setInterval(run_search, 555);
      }

      function run_search() {
        const msgtree = self.$refs.msgtree;

        self.walk(function(item) {
          if (!item.json) {
            item.json = JSON.stringify(item).toLowerCase();
          }

          const node = msgtree.nodes[item.id];
          const vnode = node && node.vnode;
          const el = vnode && vnode.$el;

          if (el) {
            if (self.term && -1 != item.json.indexOf(self.term)) {
              el.classList.add("found-msg");
            } else {
              el.classList.remove("found-msg");
            }
          }
        });
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
    }
  }
};
