import { getMetadataFromApi } from '@/api/document.js'

export default async function fetchMetadata(
  sourceComp,
  resourceId,
  documentType,
  collConfig,
  route
) {
  const listmetadata =
    documentType === 'Resource'
      ? await getMetadataFromApi(resourceId, collConfig, route)
      : await getMetadataFromApi(resourceId, collConfig, route)

  return listmetadata
}