import Vue from 'vue'
import Vuex from 'vuex'
import VueCookies from 'vue-cookies'

import router from './router'

import axios from './axios-auth';
import globalAxios from 'axios'

Vue.use(Vuex)
Vue.use(VueCookies)

export default new Vuex.Store({
    state: {
        idToken: null,
        userId: null,
        user: null,
        validateEmail: null
    },
    mutations: {
        authUser(state, userData) {
            state.idToken = userData.token
            state.userId = userData.userId
            router.push('/dashboard')
        },
        storeUser(state, user) {
            state.user = user
        },
        clearAuthData(state) {
            $cookies.remove("token")
            $cookies.remove("userId")
            state.idToken = null
            state.userId = null
        },
        validateAuth(state, message) {
            state.validateEmail = message
        }
    },
    actions: {
        tryAutoLogin({commit}) {
            const token = $cookies.get("token")
            if (!token) {
                return
            }
            const userId = $cookies.get("userId")
            commit('authUser', {
                token: token,
                userId: userId
            })
        },
        signup({commit, dispatch}, authData) {
            axios.post('/signupNewUser?key=AIzaSyB64I6PKlIOpioIec2l_Dz_I6xDyW18j1k',
            {
                email: authData.email,
                password: authData.password,
                returnSecureToken: true
            })
                .then(res => {
                    console.log(res)
                    commit('authUser', {
                        token: res.data.idToken,
                        userId: res.data.localId
                    })
                    $cookies.set("token",res.data.idToken,"50MIN")
                    $cookies.set("userId",res.data.localId,"50MIN")
                    dispatch('storeUser', authData)
                })
                .catch(error => console.log(error.response.data.error.message));
        },
        login({commit}, authData) {
            axios.post('/verifyPassword?key=AIzaSyB64I6PKlIOpioIec2l_Dz_I6xDyW18j1k',
            {
                email: authData.email,
                password: authData.password,
                returnSecureToken: true
            })
                .then(res => {
                    console.log(res)
                    $cookies.set("token",res.data.idToken,"50MIN")
                    $cookies.set("userId",res.data.localId,"50MIN")
                    commit('authUser', {
                        token: res.data.idToken,
                        userId: res.data.localId
                    })
                })
                .catch(error => {
                    commit('validateAuth', error.response.data.error.message)
                })
        },
        logout({commit}) {
            commit('clearAuthData')
            router.replace('/signin')
        },
        storeUser({commit, state}, userData) {
            if (!state.idToken) {
                return
            }
            globalAxios.post('/users.json' + '?auth=' + state.idToken, userData)
                .then(res => console.log(res))
                .catch(error => console.log(error.response.data.error.message))
        },
        fetchUser({commit, state}) {
            if (!state.idToken) {
                return
            }
            globalAxios.get('/users.json' + '?auth=' + state.idToken)
                .then(res => {
                    console.log(res);
                    const data = res.data;
                    const users = [];
                    for(let key in data) {
                        const user = data[key];
                        user.id = key
                        users.push(user);
                    }
                    console.log(users);
                    commit('storeUser', users[0])

                })
                .catch(error => console.log(error));
        }
    },
    getters: {
        user(state) {
            return state.user
        },
        isAuthenticated(state) {
            return state.idToken !== null
        },
        validateEmail(state) {
            return state.validateEmail
        }
    }
})
