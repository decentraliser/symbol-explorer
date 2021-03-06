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

import axios from 'axios'
import { Address } from 'symbol-sdk'
import dto from './dto'
import http from './http'
import format from '../format'
import sdkTransaction from '../infrastructure/getTransaction'
import sdkNamespace from '../infrastructure/getNamespace'
import sdkMosaic from '../infrastructure/getMosaic'
import sdkMetadata from '../infrastructure/getMetadata'
import { getAccountRestrictions } from '../infrastructure/getRestriction'
import { Constants } from '../config'

const formatAccountNames = async accounts => {
  // Fetch the account name objects from the addresses.
  const addresses = accounts.map(account => account.address)
  const accountNames = await http.namespace.getAccountsNames(addresses).toPromise()

  // Create a mapping of account addresses to names.
  // Allows efficient ID lookups.
  const addressToNameMap = {}
  for (let item of accountNames)
    addressToNameMap[item.address.plain()] = item

  return accounts.map(info => {
    info.accountName = addressToNameMap[info.address.plain()]
    return format.formatAccount(info)
  })
}

class sdkAccount {
  static getAccountInfoByAddress = async address => {
    const addressObj = Address.createFromRawAddress(address)

    let accountInfo = await http.account
      .getAccountInfo(addressObj)
      .toPromise()

    const accountName = await http.namespace
      .getAccountsNames([addressObj])
      .toPromise()

    const mosaicIdsList = accountInfo.mosaics.map(mosaic => mosaic.id)
    const mosaicInfoAliasNames = await sdkMosaic.getMosaicInfoAliasNames(mosaicIdsList)

    accountInfo.mosaics.map(mosaic => {
      mosaic.mosaicInfoAliasName = mosaicInfoAliasNames.find(mosaicInfoName => mosaicInfoName.id.equals(mosaic.id))
    })

    // add accountName object
    accountInfo.accountName = accountName[0]

    return format.formatAccount(accountInfo)
  }

  static getMultisigAccountByAddress = async address => {
    let addressObj = Address.createFromRawAddress(address)
    let accountMultisig

    try {
      accountMultisig = await http.multisig
        .getMultisigAccountInfo(addressObj)
        .toPromise()
    } catch (e) {
      // To Catach statusCode 404 if Address is not belong to Multisig
      throw Error('Address is not belong to Multisig')
    }

    return format.formatAccountMultisig(accountMultisig)
  }

  static getAccountsFromAddressWithLimit = async (limit, accountType, fromAddress) => {
    let address
    if (fromAddress === undefined)
      address = 'most'
    else
      address = fromAddress

    // Make request.
    const path = `/accounts/${accountType}/from/${address}/limit/${limit}`
    const response = await axios.get(http.nodeUrl + path)
    const accounts = response.data.map(info => dto.createAccountInfoFromDTO(info, http.networkType))
    const accountNames = await formatAccountNames(accounts)
    return accountNames
      ?.map(el => ({
        address: el.address.plain(),
        // TODO(ahuszagh) Need balance....
        lastActivity: el.lastActivity,
        importance: el.importance,
        info: el.accountAliasName || ''
      })) || []
  }

  static getAccountsSinceAddressWithLimit = async (limit, accountType, sinceAddress) => {
    let address
    if (sinceAddress === undefined)
      address = 'least'
    else
      address = sinceAddress

    // Make request.
    const path = `/accounts/${accountType}/since/${address}/limit/${limit}`
    const response = await axios.get(http.nodeUrl + path)
    const accounts = response.data.map(info => dto.createAccountInfoFromDTO(info, http.networkType))

    return formatAccountNames(accounts)
      ?.map(el => ({
        address: el.address.plain(),
        // TODO(ahuszagh) Need balance....
        lastActivity: el.lastActivity,
        importance: el.importance,
        info: el.accountAliasName || ''
      })) || []
  }

  static getAccountInfoByAddressFormatted = async address => {
    let rawAccountInfo
    let formattedAccountInfo
    let mosaicList
    let accountMultisig
    let formattedAccountMultisig
    let accountMultisigCosignatories
    let activityBuckets

    let metadataList
    let accountRestrictions

    let transactionList
    let formattedTansactionList

    let namespaceList
    let formattedNamespaceList

    try { rawAccountInfo = await this.getAccountInfoByAddress(address) } catch (e) { throw Error('Failed to get account info', e) }

    try { accountMultisig = await sdkAccount.getMultisigAccountByAddress(address) } catch (e) { console.warn(e) }

    try { transactionList = await sdkTransaction.getAccountTransactions(address) } catch (e) { console.warn(e) }

    try { namespaceList = await sdkNamespace.getNamespacesFromAccountByAddress(address) } catch (e) { console.warn(e) }

    try { metadataList = await sdkMetadata.getAccountMetadata(address) } catch (e) { console.warn(e) }

    try { accountRestrictions = await getAccountRestrictions(address) } catch (e) { console.warn(e) }

    if (rawAccountInfo) {
      formattedAccountInfo = {
        address: rawAccountInfo.address.address,
        linkedNamespace: rawAccountInfo.accountAliasName,
        addressHeight: rawAccountInfo.addressHeight,
        publicKey: rawAccountInfo.publicKey,
        importance: rawAccountInfo.importance,
        accountType: rawAccountInfo.accountType,
        linkedAccountKey: rawAccountInfo.linkedAccountKey
      }

      mosaicList = Array.isArray(rawAccountInfo.mosaics)
        ? rawAccountInfo.mosaics.map(el => ({
          mosaicId: el.id,
          amount: el.amount,
          mosaicAliasName: el.mosaicAliasName
        }))
        : []

      mosaicList = format.sortMosaics(mosaicList)

      activityBuckets = Array.isArray(rawAccountInfo.activityBucket)
        ? rawAccountInfo.activityBucket.map(el => ({
          recalculationBlock: el.startHeight,
          totalFeesPaid: el.totalFeesPaid.toLocaleString('en-US', { minimumFractionDigits: Constants.NetworkConfig.NATIVE_MOSAIC_DIVISIBILITY }),
          beneficiaryCount: el.beneficiaryCount,
          importanceScore: el.rawScore
        }))
        : []
    }

    if (accountMultisig) {
      formattedAccountMultisig = {
        minApproval: accountMultisig.minApproval,
        minRemoval: accountMultisig.minRemoval
      }

      formattedAccountInfo = { ...formattedAccountInfo, ...formattedAccountMultisig }
      if (accountMultisig.cosignatories) accountMultisigCosignatories = accountMultisig.cosignatories
    }
    if (transactionList) {
      formattedTansactionList = transactionList.map(el => ({
        deadline: el.deadline,
        transactionHash: el.transactionHash,
        transactionType: el.transactionBody.type,
        direction: el.transactionBody.type === 'Transfer' ? (el.signer === formattedAccountInfo.address ? 'outgoing' : 'incoming') : void 0
      }))
    }

    if (namespaceList) {
      formattedNamespaceList = namespaceList.map(
        el => ({
          namespaceName: el.namespaceName,
          registrationType: el.registrationType,
          status: el.active,
          duration: el.duration
        })
      )
    }

    return {
      accountInfo: formattedAccountInfo || {},
      mosaicList: mosaicList || [],
      multisigInfo: formattedAccountMultisig || [],
      multisigCosignatoriesList: accountMultisigCosignatories || [],
      transactionList: formattedTansactionList || [],
      namespaceList: formattedNamespaceList || [],
      activityBuckets: activityBuckets || [],
      metadataList: metadataList || [],
      accountRestrictions: accountRestrictions || []
    }
  }
}

export default sdkAccount
