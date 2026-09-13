import '@/assets/css/main.css'

import { createApp, defineAsyncComponent } from 'vue'
import App from '@/App.vue'
import { router } from '@/router'
import store from '@/store'

import useLayout from '@/composables/use-layout'

window.global = window

const app = createApp(App).provide('variable-layout', useLayout())
  .component('PageBreak', defineAsyncComponent(() =>
    import('@/components/PageBreak.vue')
  ))
  .use(router)
  .use(store)
app.mount('#app')
