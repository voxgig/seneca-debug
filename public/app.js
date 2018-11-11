const top = {
  items: []
}

const msgmap = {}

export default {
  components: {
  },     
  data () {
    return {
      items: top.items,
      active: [],
      open: [],
      selected: null
    }
  },
  created: function() {
    const self = this
    this.$root.$on('msg', function(data) {
      self.addmsg(data)
    })
  },

  methods: {
    opened: function(nodes) {
      const last = nodes[nodes.length-1]
      if(last) {
        this.selected = msgmap[last]
      }
    },
    addmsg: function(data) {
      const meta = data.meta
      const parent = meta.parents[0] ? meta.parents[0][1] : null

      if('in' === data.debug_kind && !msgmap[meta.id]) {
        const parent_children = parent ? msgmap[parent] ? msgmap[parent].children : top.items : top.items

        const entry = {
          id: data.meta.id,
          name: data.meta.pattern,
          children: [],
          data: data
        }

        parent_children.push(entry)
        msgmap[meta.id] = entry
      }
      else if('out' === data.debug_kind && msgmap[meta.id]) {
        msgmap[meta.id].data = data
      }
    }
  }
}
