import { createStore } from 'vuex'
import search from './search.js'

const searchProjectSync = (store) => {
  store.watch(
    (state) => state.projectId,
    (projectId) => {
      store.commit('search/setSearchProject', projectId)
    },
    { immediate: true }
  )
}

export default createStore({
  modules: {
    search
  },

  state: {
    dtsRootCollectionId: undefined,
    collectionId: undefined,
    projectId: undefined,
    resourceId: undefined,
    currentItem: {},
    TOC: [],
    arianeDocument: undefined
  },

  mutations: {
    setDtsRootCollectionId(state, v) {
      state.dtsRootCollectionId = v
    },

    setProjectId(state, v) {
      state.projectId = v
    },

    setCollectionId(state, v) {
      state.collectionId = v
    },

    setResourceId(state, v) {
      state.resourceId = v
    },

    setCurrentItem(state, v) {
      state.currentItem = v
    },

    setTOC(state, v) {
      state.TOC = v
    },

    setArianeDocument(state, list) {
      state.arianeDocument = list
    }
  },
  plugins: [searchProjectSync]
})