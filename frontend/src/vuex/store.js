import Vue from 'vue'
import Vuex from 'vuex'
import VueResource from 'vue-resource'
import { JSEncrypt } from 'jsencrypt'
import { Presence } from '../phoenix'

var AES = require('crypto-js/aes') // TODO: any ES6 way to do this?

import { roomIdFromHref,
  openSocket,
  prepareChannel } from '../helpers'

Vue.use(VueResource)
Vue.use(Vuex)

const state = {
  password: '',
  error: '',
  authorized: false,
  room_id: roomIdFromHref(),
  messages: [],
  users: [],
  presence: {}
}

const mutations = {
  SAVE_CREDENTIALS (state, data) {
    state.authorized = true
    state.room_id = data.room_id
    state.password = data.password
  },

  REMOVE_ERROR (state) {
    state.error = ''
  },

  DISCONNECTED (state) {
    state.error = 'something went wrong...'
    state.authorized = false
    state.password = ''
  },

  SAVE_CHANNEL (state, channel) {
    state.channel = channel
  },

  SAVE_RSA (state, rsa) {
    state.rsa = rsa
  },

  RECEIVE_MESSAGE (state, message) {
    state.messages.push(
      state.rsa.decrypt(message.body)
    )
  },

  UPDATE_PRESENCE (state, presence) {
    state.presence = presence
  },

  UPDATE_USERS (state, users) {
    state.users = users.map((el) => {
      return {
        user_id: el.user_id,
        rsa_pub: AES.decrypt(el.rsa_pub, state.password).toString()
      }
    })
  }
}

const actions = {
  REQUEST_ENTRANCE ({dispatch, commit}, data) {
    const socket = openSocket()
    socket.onClose(() => commit('DISCONNECTED'))
    socket.onOpen(() => {
      const rsa = new JSEncrypt({default_key_size: 1024})
      commit('SAVE_RSA', rsa)

      const encryptedRsaPub = AES.encrypt(rsa.getPublicKey(), data.password).toString()
      const channel = prepareChannel({
        socket,
        encryptedRsaPub: encryptedRsaPub,
        roomId: data.room_id,
        password: data.password
      })

      channel.join().receive('ok', () => {
        commit('REMOVE_ERROR')
        commit('SAVE_CREDENTIALS', data)
        commit('SAVE_CHANNEL', channel)

        dispatch('HOOK_CHANNEL', channel)
        dispatch('SYNC_HREF_WITH_ROOM_ID')
      })
    })
  },

  HOOK_CHANNEL ({state, dispatch, commit}, channel) {
    channel.on('new_msg', payload => commit('RECEIVE_MESSAGE', payload))

    channel.on('presence_state', initial => {
      dispatch('UPDATE_PRESENCE', Presence.syncState(state.presence, initial))
    })

    channel.on('presence_diff', diff => {
      dispatch('UPDATE_PRESENCE', Presence.syncDiff(state.presence, diff))
    })
  },

  UPDATE_PRESENCE ({commit}, presence) {
    commit('UPDATE_PRESENCE', presence)
    if ((presence[''] || {}).metas) {
      commit('UPDATE_USERS', presence[''].metas)
    }
  },

  SYNC_HREF_WITH_ROOM_ID ({state}) {
    if (state.room_id !== roomIdFromHref()) {
      window.location.hash = state.room_id
    }
  },

  SEND_MESSAGE ({state, commit}, message) {
    const encryptedMessage = state.rsa.encrypt(message)
    state.channel.push('new_msg', {body: encryptedMessage})
  },

  async SUBMIT_ENTRANCE_REQUEST ({dispatch}, form) {
    await dispatch('REQUEST_ENTRANCE', {
      room_id: (form.roomIdField || {}).value || roomIdFromHref(),
      password: form.passwordField.value
    })
  }
}

export default new Vuex.Store({
  state,
  mutations,
  actions
})
