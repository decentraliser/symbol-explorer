<template>
    <div class="page">
        <div class="page-content-card-f">
            <template v-for="(item, index) in schema">
                <Card
                    v-if="item.type === 'Card' && isItemShown(item)"
                    class="card-f"
                    :class="{'card-full-width': item.fullWidth, 'card-adaptive': !item.fullWidth}"
                    :loading="getLoading(item)"
                    :error="getError(item)"
                    :key="item.title + index"
                >
                    <template #title>
                        {{getNameByKey(item.title)}}
                    </template>

                    <template #control>
                        <template v-for="(headerItem, headerIndex) in item.header">
                            <DropDown
                                v-if="headerItem.type === 'filter'"
                                :value="getter(headerItem.filterValueGetter)"
                                :options="getter(headerItem.filterOptionsGetter)"
                                @change="action(headerItem.filterChangeAction, $event)"
                                :key="item.title + index + 'h' + headerIndex"
                            />
                            <Pagination
                                v-else-if="headerItem.type === 'Pagination'"
                                v-bind="headerItem"
                                :key="item.title + index + 'h' + headerIndex"
                            />
                        </template>
                    </template>

                    <template #body v-if="item.body">
                        <component
                            :is="item.body"
                            :data="getData(item)"
                            :timeline="getter(item.managerGetter)"
                            :timelinePagination="item.timelinePagination"
                            :pagination="item.pagination"
                            :pageSize="item.pageSize"
                        />
                    </template>

                    <template #error v-if="getError(item)">
                        {{getErrorMessage(item.errorMessage)}}
                        <br>
                        {{prop}}
                    </template>
                </Card>
                <component v-else-if="isItemShown(item)" :is="item.type" v-bind="item" :key="'comp'+index"/>
            </template>

        </div>
    </div>
</template>

<script>
import View from './View.vue'
import MetadataEntries from '../components/MetadataEntries'

export default {
  extends: View,
  components: { MetadataEntries },
  props: {
    schema: {
      type: Array,
      required: true,
      default: () => ([])
    }
  },

  computed: {
    prop() {
      for (let key in this.$route.params)
        return this.$route.params[key]
      return null
    }
  },

  methods: {
    getter(e) {
      if (typeof e === 'string')
        return this.$store.getters[e]
    },

    action(actionName, value) {
      this.$store.dispatch(actionName, value)
    },

    isItemShown(item) {
      return !item.hideEmptyData || this.getter(item.dataGetter)?.length > 0
    },

    getNameByKey(e) {
      return this.$store.getters['ui/getNameByKey'](e)
    },

    getErrorMessage(message) {
      const errorMessage = message || 'Failed to fetch'
      return this.getNameByKey(errorMessage)
    },

    getLoading(item) {
      if (typeof item.loadingGetter === 'string')
        return this.getter(item.loadingGetter)
      else
        return this.getter(item.managerGetter)?.loading
    },

    getError(item) {
      if (typeof item.errorGetter === 'string')
        return this.getter(item.errorGetter)
      else
        return this.getter(item.managerGetter)?.error
    },

    getData(item) {
      if (typeof item.dataGetter === 'string')
        return this.getter(item.dataGetter)
      else
        return this.getter(item.managerGetter)?.data
    }
  }
}
</script>

<style lang="scss" scoped></style>
