import Vue from "vue";
import App from "./app.vue";
import Nes from "nes";
import Vuetify from "vuetify";
import VueJsonPretty from "vue-json-pretty";

import "vuetify/dist/vuetify.min.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";

Vue.use(Vuetify);
Vue.config.productionTip = false;

Vue.component("vue-json-pretty", VueJsonPretty);

const app = createApp();
app.$mount("#app");

function createApp() {
  fetch("/config")
    .then(function(res) {
      return res.json();
    })
    .then(function(config) {
      const client = new Nes.Client("ws://localhost:" + config.port);

      const start = async () => {
        await client.connect();

        let currentFilter = "/debug";

        const handler = (update, flags) => {
          app.$root.$emit("msg", update);
        };

        const updateFilter = filter => {
          client.unsubscribe(currentFilter, handler);

          if (!filter) {
            currentFilter = "/debug";
          } else {
            currentFilter = "/filter/" + filter;
          }

          client.subscribe(currentFilter, handler);
        };

        app.$root.$on("filter", updateFilter);

        updateFilter("");
      };
      start();

      Vue.prototype.client$ = client;
    });

  const app = new Vue({
    data: function() {
      return {};
    },
    render: h => h(App)
  });

  return app;
}
