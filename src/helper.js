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

import { Constants } from './config'
import { NetworkType } from 'symbol-sdk'
import http from './infrastructure/http'

const Url = require('url-parse')

const getNetworkTypeAddressFormat = {
  [NetworkType.MAIN_NET]: 'nN',
  [NetworkType.MIJIN]: 'mM',
  [NetworkType.MIJIN_TEST]: 'sS',
  [NetworkType.TEST_NET]: 'tT'
}

class helper {
  static timeSince(interval) {
    if (interval.years > 1)
      return interval.years + ' years'
    else if (interval.years === 1)
      return interval.years + ' year'
    else if (interval.days > 1)
      return interval.days + ' days'
    else if (interval.days === 1)
      return interval.days + ' day'
    else if (interval.hours > 1)
      return interval.hours + ' hours'
    else if (interval.hours === 1)
      return interval.hours + ' hour'
    else if (interval.minutes > 1)
      return interval.minutes + ' min.'// ' minutes'
    else if (interval.minutes === 1)
      return interval.minutes + ' min.'// ' minute'
    else if (interval.seconds !== 1)
      return interval.seconds + ' sec.'// ' seconds'
    else
      return interval.seconds + ' sec.'// ' second'
  }

  static formatSeconds = second => {
    if (!second && second !== 0) return ''
    let d = 0; let h = 0; let m = 0

    if (second > 86400) {
      d = Math.floor(second / 86400)
      second = second % 86400
    }
    if (second > 3600) {
      h = Math.floor(second / 3600)
      second = second % 3600
    }
    if (second > 60) {
      m = Math.floor(second / 60)
      second = second % 60
    }
    let result = ''
    if (m > 0 || h > 0 || d > 0)
      result = `${m} m ${result}`

    if (h > 0 || d > 0)
      result = `${h} h ${result}`

    if (d > 0)
      result = `${d} d ${result}`

    return result
  }

  static isHexadecimal(str) {
    return /^[0-9a-fA-F]+$/.test(str)
  }

  static isMosaicOrNamespaceId = (str) =>
    str.length === 16

  static isTransactionId = (str) =>
    str.length === 24

  static isAccountPublicKey = (str) =>
    str.length === 64 &&
    str.match('^[A-z0-9]+$')

  static isAccountAddress = (str) =>
    str.length === 40 &&
    str.match(`[${getNetworkTypeAddressFormat[http.networkType]}]{1,1}[a-zA-Z0-9]{5,5}[a-zA-Z0-9]{6,6}[a-zA-Z0-9]{6,6}[a-zA-Z0-9]{6,6}[a-zA-Z0-9]{6,6}[a-zA-Z0-9]{6,6}[a-zA-Z0-9]{4,4}`)

  static isBlockHeight = (str) =>
    str.match(/^-{0,1}\d+$/)

  static validURL(url) {
    // All we expect is there is a valid origin for the url, IE,
    // the origin is not 'null'.
    return url.origin !== 'null'
  }

  static parseUrl(str) {
    let url = new Url(str)
    if (this.validURL(url))
      return url
  }

  static httpToWsUrl(str) {
    let url = new Url(str)
    if (this.validURL(url)) {
      url.set('protocol', 'ws:')
      return url
    }
  }

  static async logError(dispatch, action, ...args) {
    try {
      await dispatch(action, ...args)
    } catch (e) {
      console.error(`Failed to call ${action}`, e)
    }
  }

  static convertToSecond = durationInBlocks => durationInBlocks * Constants.NetworkConfig.TARGET_BLOCK_TIME

  static calculateNamespaceExpiration = (currentHeight, endHeight) => {
    const expired = currentHeight > endHeight - Constants.NetworkConfig.NAMESPACE_GRACE_PERIOD_DURATION
    const expiredInBlock = endHeight - Constants.NetworkConfig.NAMESPACE_GRACE_PERIOD_DURATION - currentHeight

    return {
      isExpired: expired,
      expiredInBlock: expiredInBlock,
      expiredInSecond: this.convertToSecond(expiredInBlock)
    }
  }

  static fetchData = async (fetchFunction, commit, before, error, success) => {
    if (typeof before === 'function')
      await before()
    else {
      commit('setLoading', true)
      commit('setError', false)
    }
    try {
      await fetchFunction()
    } catch (e) {
      if (typeof error === 'function')
        await error(e)
      else {
        console.error(e)
        commit('setError', true)
      }
    }
    if (typeof success === 'function')
      await success()
    else
      commit('setLoading', false)
  }
}

export default helper
