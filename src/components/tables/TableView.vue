<script>
import Age from '../Age.vue'
import Constants from '../../config/constants'
export default {
  components: { Age },
  props: {
    view: {
      type: String,
      default: 'block'
      // required: true
    },

    height: {
      type: Number
    },

    emptyDataMessage: {
      type: String,
      default: 'nothingToShow'
    }
  },

  data() {
    return {
      componentType: 'list',
      clickableItems: [
        'account',
        'block',
        'address',
        'height',
        'mosaic',
        'namespace',
        'namespaceName',
        'linkedNamespace',
        'mosaicAliasName',
        'aliasAddress',
        'aliasMosaic',
        'linkedAccountKey',
        'transaction',
        'harvester',
        'mosaicId',
        'namespaceId',
        'parentId',
        'transactionHash',

        'addressHeight',
        'publicKeyHeight',
        'importanceHeight',

        'signer',
        'recipient',
        'owneraddress',
        'blockHeight',
        'endHeight',
        'startHeight',
        'remoteAccountAddress',

        'lastActivity',
        'recalculationBlock',
        'senderAddress',
        'targetAddress',
        'targetMosaicId',
        'targetNamespaceId',
        'unresolved',
        'addressResolutionEntries',
        'mosaicResolutionEntries',
        'restrictionMosaicValues',
        'restrictionAddressValues',
        'referenceMosaicId',
        'restrictionAddressAdditions',
        'restrictionAddressDeletions',
        'restrictionMosaicAdditions',
        'restrictionMosaicDeletions'
      ],
      disableClickItems: [...Object.values(Constants.Message)],
      changeDecimalColor: [
        'amount',
        'fee',
        'relativeAmount',
        'feeMultiplier',
        'difficulty'
      ],
      allowArrayToView: [
        'restrictionAddressValues',
        'restrictionMosaicValues',
        'restrictionTransactionValues',
        'restrictionAddressAdditions',
        'restrictionAddressDeletions',
        'restrictionMosaicAdditions',
        'restrictionMosaicDeletions',
        'restrictionOperationAdditions',
        'restrictionOperationDeletions'
      ]
    }
  },

  computed: {
    emptyDataMessageFormatted() {
      return this.$store.getters['ui/getNameByKey'](this.emptyDataMessage)
    }
  },

  methods: {
    isItemClickable(itemKey) {
      return this.clickableItems.indexOf(itemKey) !== -1
    },

    isDisableItemClick(item) {
      return this.disableClickItems.indexOf(item) !== -1
    },

    isChangeDecimalColor(itemKey) {
      return this.changeDecimalColor.indexOf(itemKey) !== -1
    },

    isAllowArrayToView(itemKey) {
      return this.allowArrayToView.indexOf(itemKey) !== -1
    },

    isItemShown(itemKey, item) {
      if (this.isAllowArrayToView(itemKey))
        return item.length !== 0

      return item != null
    },

    onItemClick(itemKey, item) {
      if (this.isItemClickable(itemKey) && !this.isDisableItemClick(item)) {
        this.$store.dispatch(`ui/openPage`, {
          pageName: itemKey,
          param: item
        })
      }
    },

    getItemHref(itemKey, item) {
      if (!this.isDisableItemClick(item))
        return this.$store.getters[`ui/getPageHref`]({ pageName: itemKey, param: item })
    },

    getKeyName(key) {
      return this.$store.getters['ui/getNameByKey'](key)
    },

    isTruncate(key) {
      return key === 'harvester' ||
        key === 'address' ||
        key === 'signer' ||
        key === 'recipient' ||
        key === 'transactionHash' ||
        key === 'owneraddress' ||
        key === 'host' ||
        key === 'friendlyName'
    }
  }
}
</script>

<style lang="scss">
.table-view {
    .table {
        width: 100%;
        max-width: 100%;
        margin-bottom: 1rem;
        background-color: transparent;
        font-size: 12px;
        color: $table-text-color;
    }

    thead {
        border-radius: 4px;
    }

    thead th {
        vertical-align: middle;
        border: 0 none;
        padding: 12px 6px 12px 6px;
        outline: none;
    }

    .empty-data {
        font-size: 14px;
        color: $table-text-color-light;
        display: flex;
        justify-content: center;
    }

    .table-title-item {
        vertical-align: middle;
        padding: 12px 6px 12px 6px;
        color: $table-title-text-color;
        font-weight: bolder;
        outline: none;
        font-size: 12px;
        letter-spacing: 1px;
    }

    .table-titles-ver {
        width: 30%;
        max-width: 200px;
    }

    .table-striped tbody tr:nth-child(odd) td {
        background-color: $table-striped-color-first;
    }

    .table-striped tbody tr:nth-child(even) td {
        background-color: $table-striped-color-second;
    }

    .table-head-cell {
        position: relative;
    }

    .table-head-cell::before {
        content: '&nbsp;';
        visibility: hidden;
    }

    .table-head-cell span {
        position: absolute;
        left: 5px;
        right: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .table-cell {
        border-bottom: 1px solid #dadee6;
        font-weight: none;
        padding: 10px 5px;
        min-height: 50px;
        word-break: break-all;
        min-width: 50px;
        max-width: 300px;
    }

    .date, .deadline, .age, .height {
        word-break: normal;
    }

    @media screen and (max-width: 40em) {
        .date, .deadline {
            width: 85px;
        }
    }

    .table-item-clickable {
        color: var(--primary);
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;

        a {
            font-weight: 600;
        }
    }

    .table-titles {
        background-color: rgba(52, 40, 104, 0.05);
    }
}
</style>
