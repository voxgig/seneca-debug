<template>
  <div class="example">
    {{ foo() }}
  </div>
</template>

<script>
export default {
  components: {
  },     
  data () {
    return {}
  },
  methods: {
    foo: function() {
      return 'FOO'
    }
  }
}
</script>

<style>
.example {
  color: red;
}
</style>
