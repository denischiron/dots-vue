import jsonld from 'jsonld'
import { toRaw } from 'vue'
import store from '@/store'

const _baseApiURL = `${import.meta.env.VITE_APP_DTS_ENDPOINT_URL}`.replace(/^https?:\/\//, '')
const _apiURL = new URL(`${import.meta.env.VITE_APP_DTS_ENDPOINT_URL}`)  // URL complète parsée
const _appURL = new URL(window.location.origin)  // URL de l'app frontend
// Extraire les 2 premiers segments de chemin de l'URL courante comme "empreinte" du document
const _currentPathSegments = window.location.pathname.split('/').filter(Boolean).slice(0, 2).join('/')


const DYNAMIC_RESOLVERS = {
  dots_api_base_url: () => `${import.meta.env.VITE_APP_DTS_ENDPOINT_URL}`.replace(/^https?:\/\//, ''),
  dots_vue_self: () => window.location.pathname.split('/').filter(Boolean).slice(0, 2).join('/')
}

function resolveSources(sourcesMap) {
  return sourcesMap.map(source => {
    if (source.dynamic && DYNAMIC_RESOLVERS[source.dynamic]) {
      return { ...source, ext: DYNAMIC_RESOLVERS[source.dynamic]() }
    }
    return source
  })
}

const MEDIA_OBJECT_MIME_REGEX =
  /^(application|audio|font|image|model|text|video)\/[a-z0-9.+-]+$/i

function isMediaObjectMimeType(value) {
  return MEDIA_OBJECT_MIME_REGEX.test(value)
}

function findSource(id, sourcesMap) {
  if (!id) return null
  const normalized = id.toLowerCase()
  const sources = resolveSources(sourcesMap)

  let url
  try {
    url = new URL(id)
  } catch {
    // Case id not URL and has MIME but not strict MIME type (iiif)
    if (normalized.includes('iiif.io')) {
      return sources.find(s => s.name === 'iiif') ?? null
    }
    // Case id not a URL, nor IIIF → trying MIME type
    if (isMediaObjectMimeType(id)) {
      const source = sources.find(s => normalized.includes(s.ext.toLowerCase()))
      return source ? { name: source.name } : null
    }
    return null
  }

  // Case API DTS ?
  if (url.hostname === _apiURL.hostname && url.port === _apiURL.port) {
    if (normalized.includes(_baseApiURL.toLowerCase())) {
      return sources.find(s => s.name === 'dots') ?? null
    }
  }

  // Case DoTS-vue implementation (possibly different serveur) : entry for which dynamic is dots_vue_self
  const vueSelfSource = sources.find(s => s.dynamic === 'dots_vue_self') ?? null

  if (
    vueSelfSource &&
    _currentPathSegments &&
    url.pathname.toLowerCase().includes(_currentPathSegments.toLowerCase()) &&
    !normalized.includes(_baseApiURL.toLowerCase())
  ) {
    return vueSelfSource
  }
  // Case same DoTS-vue implementation (self)
  if (url.hostname === _appURL.hostname && url.port === _appURL.port) {
    return vueSelfSource
  }

  const source = sources.find(s => normalized.includes(s.ext.toLowerCase()))
  return source ? { name: source.name } : null
}

// Version namespace
// ─────────────────────────────────────────────────────────────────────────────
// Contexte DTS inliné
// ─────────────────────────────────────────────────────────────────────────────
const DTS_CONTEXT_INLINE = {
  '@context': {
    'dts': 'https://dtsapi.org/v1.0#',
    'dct': 'http://purl.org/dc/terms/',
    'CitationTree':  'dts:CitationTree',
    'CiteStructure': 'dts:CiteStructure',
    'Collection':    'dts:Collection',
    'Resource':      'dts:Resource',
    'citationTrees': 'dts:citationTrees',
    'citeStructure': 'dts:citeStructure',
    'description':   'dts:description',
    'dublinCore': {
      '@id': '@nest',
      '@context': { '@vocab': null }
    },
    'extensions': {
      '@id': '@nest',
      '@context': { '@vocab': null }
    },
    'member':        'dts:member',
    'title':         'dts:title',
    'citeType':      'dts:citeType',
    'collection':    'dts:collection',
    'document':      'dts:document',
    'download':      'dts:download',
    'dtsVersion':    'dts:dtsVersion',
    'mediaTypes':    'dts:mediaTypes',
    'navigation':    'dts:navigation',
    'parent':        'dts:parent',
    'totalChildren': 'dts:totalChildren',
    'totalParents':  'dts:totalParents',
    'level':         'dts:level',
  }
}

const defaultLoader = jsonld.documentLoaders.xhr?.()
  ?? jsonld.documentLoaders.node?.()

jsonld.documentLoader = async (url) => {
  if (url === 'https://dtsapi.org/context/v1.0.json') {
    return { contextUrl: null, document: DTS_CONTEXT_INLINE, documentUrl: url }
  }
  if (defaultLoader) return defaultLoader(url)
  throw new Error(`Cannot load context: ${url}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Aplatissement du résultat jsonld.expand
// ─────────────────────────────────────────────────────────────────────────────
function flattenExpanded(expanded, namespaces = {}) {

  const node = Array.isArray(expanded) ? expanded[0] : expanded
  if (!node) return {}

  // Compresse une URI absolue en préfixe:local si possible
  function compressUri(uri) {
    for (const [prefix, base] of Object.entries(namespaces)) {
      if (uri.startsWith(base)) return `${prefix}:${uri.slice(base.length)}`
    }
    return uri
  }

  const result = {}

  for (const uri in node) {
    if (uri === '@context') continue

    const key = uri.startsWith('@') ? uri : compressUri(uri)
    const values = node[uri]

    if (uri === '@type') {
      const types = values.map(t => compressUri(t))
      result[key] = types.length === 1 ? types[0] : types
      continue
    }

    if (uri === '@id') {
      result[key] = values
      continue
    }

    if (!Array.isArray(values)) continue

    const flattened = values.map(v => {
      if ('@value' in v) return v['@value']
      if ('@id' in v && Object.keys(v).length === 1) return v['@id']
      if (typeof v === 'object' && Object.keys(v).length > 0) {
        // Si c'est un objet JSON-LD structuré, récursion
        if ('@value' in v || '@id' in v || '@type' in v) {
          return flattenExpanded([v], namespaces)
        }
        // Sinon objet littéral (ex: dts:download { "application/tei+xml": "url" })
        return v
      }
      return v
    })

    result[key] = flattened.length === 1 ? flattened[0] : flattened
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Expansion JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Pré-traitement : résout les @nest que jsonld.js ne gère pas.
 * - dublinCore → ses propriétés sont inlinées avec @vocab dct:
 * - extensions → ses propriétés sont inlinées avec leur @context local
 */

function resolveNested(apiResponse) {
  const result = { ...apiResponse }
  const dctVocab = 'http://purl.org/dc/terms/'
  const existingContext = Array.isArray(result['@context'])
    ? result['@context'] : [result['@context']].filter(Boolean)

  if (result.dublinCore && typeof result.dublinCore === 'object') {
    // Injecter directement avec URIs absolues, sans passer par @context
    for (const [k, v] of Object.entries(result.dublinCore)) {
      if (k === '@context') continue
      result[`${dctVocab}${k}`] = v  // clé = URI absolue → sera compressée par flattenExpanded
    }
    delete result.dublinCore
  }

  if (result.extensions && typeof result.extensions === 'object') {
    const extContext = result.extensions['@context']
    if (extContext) {
      result['@context'] = [...existingContext, extContext]
    }
    for (const [k, v] of Object.entries(result.extensions)) {
      if (k === '@context') continue
      // Ne pas écraser une clé existante (dts:title > schema:name)
      if (!(k in result)) {
        result[k] = v
      }
    }
    delete result.extensions
  }

  return result
}

async function expandMetadata(apiResponse, namespaces = {}) {
  try {
    const preprocessed = resolveNested(apiResponse)
    /* Add download (using DTS specification results in an invalid json-ld) custom namespace ?
    preprocessed['@context'][1].download = {
      '@id': 'https://dtsapi.org/v1.0#download',
      '@type': '@json'
    }*/
    const expanded = await jsonld.expand(preprocessed)
    const flat = flattenExpanded(expanded, namespaces)

    // Déduplication
    for (const key in flat) {
      if (Array.isArray(flat[key])) {
        const unique = [...new Set(flat[key].map(v =>
          typeof v === 'object' ? JSON.stringify(v) : v
        ))].map(v => {
          try { return JSON.parse(v) } catch { return v }
        })
        flat[key] = unique.length === 1 ? unique[0] : unique
      }
    }

    return flat
  } catch (e) {
    console.warn('⚠️ jsonld expand error', e)
    return apiResponse
  }
}
// URI de sameAs après expand (schema.org)
// Après compression, sameAs est accessible via le préfixe
const SCHEMA_SAMEAS_COMPRESSED = 'schema:sameAs'
const SCHEMA_SAMEAS_URI        = 'https://schema.org/sameAs'
// ─────────────────────────────────────────────────────────────────────────────
// enrichValue
// ─────────────────────────────────────────────────────────────────────────────
function enrichValue(value, path, sourcesMap) {
  try {
    if (
      path === 'dots:resourceIIIFManifest' &&
      typeof value === 'string'
    ) {
      return {
        value,
        url: value,
        source: {
          name: 'iiif',
          type: 'other_link'
        }
      }
    }

    if (typeof value === 'string') {
      const cleanUrl = value.replace(/\{[^}]*\}/g, '').replace(/\?$/, '')
      const src = findSource(cleanUrl, sourcesMap)
      if (!src) return value
      const isHttp = cleanUrl.startsWith('http')
      return {
        value: cleanUrl,
        ...(isHttp ? { url: cleanUrl } : {}),
        source: src
      }
    }

    if (Array.isArray(value)) {
      return value.map(v => enrichValue(v, path, sourcesMap))
    }

    if (value && typeof value === 'object') {
      // Ajouter contentUrl comme source d'URL possible
      const url = value.url ?? value['@id'] ?? value.id ?? value['schema:contentUrl']
      // Pour les MediaObject, chercher la source sur encodingFormat plutôt que l'URL
      const formatSrc = value['schema:encodingFormat'] ? findSource(value['schema:encodingFormat'], sourcesMap) : null
      const urlSrc = url ? findSource(url, sourcesMap) : null
      const src = formatSrc ?? urlSrc

      // sameAs...
      const sameAsSources = []
      const sameAsValue = value[SCHEMA_SAMEAS_COMPRESSED] ?? value[SCHEMA_SAMEAS_URI]
      if (sameAsValue) {
        const arr = Array.isArray(sameAsValue) ? sameAsValue : [sameAsValue]
        for (const sa of arr) {
          const saUrl = typeof sa === 'string' ? sa : sa['@id']
          const saSrc = findSource(saUrl, sourcesMap)
          if (saSrc) sameAsSources.push({ value: saUrl, source: saSrc })
        }
      }

      if (!src && sameAsSources.length === 0) return value

      return {
        ...value,
        ...(url ? { url } : {}),
        ...(src ? { source: src } : {}),
        ...(sameAsSources.length > 0 ? { sameAsSources } : {})
      }
    }

    return value

  } catch (e) {
    console.warn('⚠️ enrichValue error', { path, value, e })
    return value
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// buildDisplayModel
// ─────────────────────────────────────────────────────────────────────────────
export async function buildDisplayModel(rawMetadata, config) {
  const namespaces         = config?.namespaces         ?? {}
  const displayOrder       = config?.metadataDisplayOrder ?? []
  const renameMap          = config?.metadataRename       ?? {}
  const excludeConfig      = config?.excludeMetadata      ?? {}
  const excludeFields = [
    ...(excludeConfig.fields ?? []),
    ...APP_KEYS,
    ...APP_DISPLAY_EXCLUDES
  ]
  const sourcesMap = config?.metadataLogosMapping ?? []
  const onlyDeclared       = excludeConfig.onlyDeclared   ?? false
  const excludeAlways = excludeConfig.alwaysExclude ?? []

  const { metadata: rawJsonLd } = splitMetadata(rawMetadata)
  console.log('useMetadataProcessor.js buildDisplayModel rawJsonLd :', rawJsonLd)

  const metadata = await expandMetadata(rawJsonLd, namespaces)

  function buildRenameGraph(metadataRename) {
    const graph = new Map()

    for (const [from, to] of Object.entries(metadataRename)) {
      graph.set(from, to)
    }

    return graph
  }

  function resolveRename(key, graph) {
    let current = key
    const visited = new Set()

    while (graph.has(current)) {
      if (visited.has(current)) break // protection boucle
      visited.add(current)
      current = graph.get(current)
    }

    return current
  }
  function buildDisplayKeyMap(namespaces, metadataRename) {
    const DTS = Object.keys(namespaces).find(
      k => namespaces[k].includes('dtsapi.org/v1.0#')
    )

    const graph = buildRenameGraph(metadataRename)

    const idKey = resolveRename('@id', graph)
    const typeKey = resolveRename('@type', graph)

    return {
      [idKey]: ['@id', 'identifier'],
      [typeKey]: ['@type', 'type'],
      [`${DTS}title`]: ['@value', 'title'],
    }
  }

  const DISPLAY_KEY_MAP = buildDisplayKeyMap(namespaces, renameMap)

  // helper for isExcluded
  function matchesPattern(key, pattern) {
    if (pattern.endsWith(':*')) {
      return key.startsWith(pattern.slice(0, -1))
    }

    return key === pattern
  }

  // Construire un Set des champs exclus (support wildcard "dots:*")
  function isExcluded(key) {

    // 1. Always excluded even if in 2.
    if (
      excludeAlways.some(pattern =>
        matchesPattern(key, pattern)
      )
    ) {
      return true
    }

    // 2. Explicitly defined in displayOrder
    const explicitAllowedKeys = new Set([
      ...displayOrder.filter(k => !isWildcard(k)),
      ...Object.values(renameMap)
    ])
    /* CHECK : do we need :
    displayOrder.filter(k => !isWildcard(k) && !k.includes('.')) ?
    and
    ...Object.values(renameMap)
    */
    if (explicitAllowedKeys.has(key)) return false

    // 3. Otherwise exclude those in fields
    return excludeFields.some(pattern =>
      matchesPattern(key, pattern)
    )
  }

  const result = {}
  const handledKeys = new Set()

  function isWildcard(pattern) {
    return pattern.endsWith(':*')
  }

  function wildcardPrefix(pattern) {
    return pattern.slice(0, -1)
  }

  // Phase 1 : ordered pass
  for (const term of displayOrder) {

    if (isWildcard(term)) {
      const prefix = wildcardPrefix(term)

      const matchingKeys = Object.keys(metadata)
        .filter(key =>
          key.startsWith(prefix) &&
          !handledKeys.has(key) &&
          !isExcluded(key)
        )
        .sort()

      for (const key of matchingKeys) {
        const val = metadata[key]

        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (typeof val === 'object' &&
            !Array.isArray(val) &&
            Object.keys(val).length === 0)
        ) {
          continue
        }

        result[key] = enrichValue(val, key, sourcesMap)
        handledKeys.add(key)
      }

      continue
    }

    if (isExcluded(term)) continue

    // Gestion dts:download.application/tei+xml → sous-clé de dts:download
    if (term.includes('.')) {
      const [parent, subkey] = term.split(/\.(.+)/) // split sur le premier point
      if (metadata[parent] && typeof metadata[parent] === 'object') {
        const val = metadata[parent][subkey]
        if (val !== undefined && val !== null && val !== '') {
          const label = renameMap[term] ?? term
          result[label] = enrichValue(val, term, sourcesMap)
          handledKeys.add(parent) // on marque le parent comme traité
        }
      }
      continue
    }

    // Résoudre la clé réelle dans metadata
    const candidateKeys = DISPLAY_KEY_MAP[term] ?? [term]
    const metaKey = candidateKeys.find(k => k in metadata && metadata[k] != null)

    if (!metaKey) continue

    if (!(metaKey in metadata)) {
      continue
    }
    const val = metadata[metaKey]
    if (val === undefined || val === null || val === '' ||
        (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0)) {
      continue
    }

    const label = renameMap[term] ?? term
    result[label] = enrichValue(val, term, sourcesMap)

    // Marquer TOUTES les clés candidates comme traitées
    for (const k of candidateKeys) handledKeys.add(k)

  }

  // Phase 2 : remaining (si onlyDeclared === false)
  if (!onlyDeclared) {
    for (const key of Object.keys(metadata)) {
      if (handledKeys.has(key)) {
        continue
      }
      if (isExcluded(key)) {
        continue
      }
      const val = metadata[key]
      if (val === undefined || val === null || val === '' ||
          (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0)) {
        continue
      }
      result[key] = enrichValue(val, key, sourcesMap)
    }
  }
  console.log('useMetadataProcessor.js buildDisplayModel result :', result)
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// useMetadataProcessor
// Sa seule responsabilité propre : enrichir avec les données TOC
// Le reste est délégué à buildDisplayModel
// ─────────────────────────────────────────────────────────────────────────────
const APP_FIELDS = {
  editorialLevelIndicator: true,
  totalDescendants: true,
  descendant: true,
  router: true,
  router_params: true,
  router_refid: true,
  router_hash: true,
  url: true,
  hash: true,
  show: true,
  expanded: true,
  ancestor_editorialLevel: true,
  member: true,
  children: true,
  parent: true,
  projectIdentifier: true,
  totalParents: true,
  totalChildren: true,
  totalItems: true,
  citeType: true,
  level: true,

  // nested key example
  'extensions.dots:shortTitle': true,
}
const APP_KEYS = new Set(Object.keys(APP_FIELDS))

const APP_DISPLAY_EXCLUDES = Object.entries(APP_FIELDS)
  .filter(([path]) => path.includes('.'))
  .map(([path]) =>
    path.split('.').pop()
  )

function splitMetadata(raw = {}) {
  // helpers
  function get(obj, path) {
    return path.split('.').reduce(
      (acc, key) => acc?.[key],
      obj
    )
  }

  function defaultFieldName(path) {
    return path
      .split('.')
      .pop()
      .replace(/^.*:/, '')
  }

  const metadata = { ...raw }
  const appData = {}

  for (const [path, alias] of Object.entries(APP_FIELDS)) {
    const value = get(raw, path)

    if (value === undefined) continue

    const targetKey =
      alias === true || alias === ''
        ? defaultFieldName(path)
        : alias

    appData[targetKey] = value

    // non nested keys :
    if (!path.includes('.')) {
      delete metadata[path]
    }
  }

  return { metadata, appData }
}

export function useMetadataProcessor() {

  function processMetadata(rawMetadata, resourceId) {

    const raw = JSON.parse(JSON.stringify(toRaw(rawMetadata)))

    // Juste les alias système
    const result = { ...raw }
    if ('@id' in result)   { result.identifier = result['@id'];   /*delete result['@id']*/ }
    if ('@type' in result) { result.type = result['@type'];       /*delete result['@type']*/ }

    // TOC
    if (store.state.TOC.length > 0) {
      const tocItem = store.state.TOC.find(i => i.identifier === resourceId)
      result.parent = tocItem?.parent
        ? Array.isArray(tocItem.parent)
          ? tocItem.parent.map(p => {
              const parent = store.state.TOC.find(i => i.identifier === p)
              return parent ? `${p} (${parent.citeType})` : p
            })
          : tocItem.parent
        : []
    }

    return result  // cache : données brutes + alias + TOC
  }

  return { processMetadata }
}