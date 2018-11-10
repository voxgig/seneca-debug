import Vue from 'vue'
import App from './app.vue'
import Nes from 'nes'

Vue.config.productionTip = false


export function createApp() {

  const client = new Nes.Client('ws://localhost:8899');

  const start = async () => {
    console.log('AAA')
    await client.connect()
    console.log('BBB')
    
    const handler = (update, flags) => {
      console.log('NES', update, flags)
    }

    client.subscribe('/debug', handler);
  }
  start()

  Vue.prototype.client$ = client

  
  const app = new Vue({
    data: function() {
      return {
      }
    },
    render: h => h(App),
    
  })

  return { app }
}

