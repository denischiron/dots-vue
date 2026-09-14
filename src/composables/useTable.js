import { ref, computed, watch } from 'vue'

// A date column holds EDTF-like values: a year (`1904`), a range (`827/1216`),
// an approximation (`0975~/1280`), an interval (`1966-1998`). Only groups of
// three or four digits are read as years, so an ISO date keeps its year and
// drops its month and day.
const YEAR_PATTERN = /\d{3,4}/g

export const yearBounds = (value) => {
  if (value == null) return undefined
  if (typeof value === 'number') return { start: value, end: value }

  const text = String(value).trim()
  const years = text.match(YEAR_PATTERN)?.map(Number)
  if (!years?.length) return undefined

  // An inner hyphen separates two years (`1966-1998`) and must not turn one
  // negative; only a leading one marks a year before the common era.
  if (text.startsWith('-')) years[0] = -years[0]

  return { start: Math.min(...years), end: Math.max(...years) }
}

// Walks a dotted path through an object. Each segment falls back to a
// case-insensitive match, which is what lets a configuration written in
// the DTS casing (`dublinCore.created`) resolve against a payload that
// spells the namespace differently -- the ES index, when used, stores `dublincore`.
// That fallback is the whole reason `columns` already works both against
// the DTS API and against the search API.
export const walkPath = (obj, path) => {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')

  const read = (source, part) => {
    if (source == null) return undefined

    // Exact matching
    if (Object.prototype.hasOwnProperty.call(source, part)) {
      return source[part]
    }

    // Case insensitive matching
    const matchingKey = Object.keys(source).find(
      key => key.toLowerCase() === part.toLowerCase()
    )

    return matchingKey ? source[matchingKey] : undefined
  }

  return parts.reduce((acc, part) => {
    if (acc == null) return undefined

    if (Array.isArray(acc)) {
      return acc.map(item => read(item, part))
    }

    return read(acc, part)
  }, obj)
}

export function useTable(dataSource, columns, options = {}) {
  const filters = ref({})
  const sort = ref({ key: null, direction: 'none' }) // none | asc | desc

  const {
    pageSize,
    currentPage,
    remote = ref(false),
    totalResults : remoteTotalResults = ref(0)
  } = options

  // Init dynamic filters
  watch(columns, (cols) => {
    if (!cols) return
    const f = {}
    cols.forEach(col => {
      if (col.type === 'range') {
        f[col.key] = { from: '', to: '' }
      } else {
        f[col.key] = ''
      }
    })
    filters.value = f
  }, { immediate: true })

  const getValue = (obj, path) => {
    const result = walkPath(obj, path)

    if (Array.isArray(result)) {
      return result.filter(v => v != null).join(', ')
    }

    return result
  }

  // Temporal properties are normalised at indexing time into a pair of
  // numeric bounds: the metadata key `dublinCore.created` is stored as
  // `temporal.dublincore.created_start` / `_end`. Because walkPath is
  // case-insensitive, the key resolves with no mapping table, and this
  // holds for any namespace -- `extensions.dateCreated` included.
  const getTemporalRange = (obj, key) => ({
    start: getValue(obj, `temporal.${key}_start`),
    end: getValue(obj, `temporal.${key}_end`)
  })

  // Filtering
  const filtered = computed(() => {
    if (!columns?.value || columns.value.length === 0) return dataSource

    return dataSource.value.filter(row =>
      columns.value.every(col => {
        const value = getValue(row, col.key)

        if (col.type === 'range') {
          const { from, to } = filters.value[col.key] || {}
          if (from && value < Number(from)) return false
          if (to && value > Number(to)) return false
          return true
        }

        const search = filters.value[col.key]?.toLowerCase() || ''
        return String(value ?? '').toLowerCase().includes(search)
      })
    )
  })

  // Sorting
  const getSortValue = (obj, path) => {
    const result = walkPath(obj, path)

    if (!Array.isArray(result)) {
      return result
    }

    const values = result.filter(v => v != null)

    if (!values.length) return undefined

    // Same logic as Elasticsearch :
    // asc  -> minimum value of array
    // desc -> maximum value of array
    return values.reduce((selected, current) => {
      const comparison = String(current).localeCompare(String(selected))

      if (sort.value.direction === 'asc') {
        return comparison < 0 ? current : selected
      }

      return comparison > 0 ? current : selected
    })
  }

  // Date columns are compared on their year bounds, never as strings: the
  // index already carries them, and they are parsed from the value otherwise.
  // Both directions use the start bound, as the search API does
  // (`get_es_sort_field` in dots-cli-es), so desc is the exact reverse of asc
  // and a collection page orders its dates like its search page.
  const getDateSortValue = (obj, path) => {
    const [namespace, field] = path.split('.')

    if (namespace && field) {
      const indexed = walkPath(obj, `temporal.${namespace}.${field}_start`)
      if (typeof indexed === 'number') return indexed
    }

    return yearBounds(getSortValue(obj, path))?.start
  }

  const sorted = computed(() => {
    if (!sort.value.key || sort.value.direction === 'none') {
      return filtered.value
    }

    const column = (columns.value || []).find(col => col.key === sort.value.key)
    const isDate = column?.type === 'date'

    return [...filtered.value].sort((a, b) => {
      const aVal = isDate ? getDateSortValue(a, sort.value.key) : getSortValue(a, sort.value.key)
      const bVal = isDate ? getDateSortValue(b, sort.value.key) : getSortValue(b, sort.value.key)

      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'number') {
        return sort.value.direction === 'asc'
          ? aVal - bVal
          : bVal - aVal
      }

      return sort.value.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  })

  // Pagination
  // const totalPages = computed(() => {
  //   if (!pageSize.value) return 1
  //   return Math.ceil(sorted.value.length / pageSize.value)
  // })

  const totalPages = computed(() => {
    const total = remote.value
      ? remoteTotalResults.value
      : filtered.value.length

    return pageSize.value
      ? Math.ceil(total / pageSize.value)
      : 1
  })

  // const paginated = computed(() => {
  //   const start = (currentPage.value - 1) * pageSize.value
  //   return sorted.value.slice(start, start + pageSize.value)
  // })
  const paginated = computed(() => {
    if (remote.value) {
      return dataSource.value
    }

    const start = (currentPage.value - 1) * pageSize.value
    return sorted.value.slice(start, start + pageSize.value)
  })

  //const totalResults = computed(() => filtered.value.length)
  const totalResults = computed(() => {
    return remote.value
      ? remoteTotalResults.value
      : filtered.value.length
  })

  // Reset page when filters or sort change: page N of a new order has nothing
  // to do with page N of the previous one. Remote tables are reset by the
  // search store instead.
  watch([filters, sort], () => {
    if (!remote.value) {
      currentPage.value = 1
    }
  }, { deep: true })

  return {
    filters,
    sort,
    currentPage,
    pageSize,
    totalPages,
    paginated,
    totalResults,
    getValue,
    getTemporalRange
  }
}