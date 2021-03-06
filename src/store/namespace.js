/*
 *
 * Copyright (c) 2019-present for NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License ");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import Lock from './lock'
import Constants from '../config/constants'
import sdkNamespace from '../infrastructure/getNamespace'
import {
  DataSet,
  Timeline,
  getStateFromManagers,
  getGettersFromManagers,
  getMutationsFromManagers,
  getActionsFromManagers
} from './manager'

const LOCK = Lock.create()

const managers = [
  new Timeline(
    'timeline',
    () => sdkNamespace.getNamespacesFromIdWithLimit(Constants.PageSize),
    (key, pageSize) => sdkNamespace.getNamespacesFromIdWithLimit(pageSize, key),
    'namespaceId'
  ),
  new DataSet(
    'info',
    (namespaceOrHex) => sdkNamespace.getNamespaceInfoFormatted(namespaceOrHex)
  )
]

export default {
  namespaced: true,
  state: {
    // If the state has been initialized.
    initialized: false,
    ...getStateFromManagers(managers)
  },
  getters: {
    getInitialized: state => state.initialized,
    getNamespaceInfo: state => state.info?.data?.namespaceInfo || {},
    getNamespaceLevels: state => state.info?.data?.namespaceLevels || [],
    getMetadataList: state => state.info?.data?.metadataList || [],
    ...getGettersFromManagers(managers)
  },
  mutations: {
    setInitialized: (state, initialized) => { state.initialized = initialized },
    ...getMutationsFromManagers(managers)
  },
  actions: {
    ...getActionsFromManagers(managers),
    // Initialize the namespace model.
    async initialize({ commit, dispatch, getters }) {
      const callback = async () => {
        await dispatch('initializePage')
      }
      await LOCK.initialize(callback, commit, dispatch, getters)
    },

    // Uninitialize the namespace model.
    async uninitialize({ commit, dispatch, getters }) {
      const callback = async () => {
        getters.timeline?.uninitialize()
      }
      await LOCK.uninitialize(callback, commit, dispatch, getters)
    },

    // Fetch data from the SDK and initialize the page.
    async initializePage(context) {
      await context.getters.timeline.setStore(context).initialFetch()
    },

    // Fetch data from the SDK.
    async fetchNamespaceInfo(context, namespaceOrHex) {
      await context.getters.info.setStore(context).initialFetch(namespaceOrHex)
    }
  }
}
