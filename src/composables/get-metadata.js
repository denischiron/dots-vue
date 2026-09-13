import { getMetadataFromApi } from '@/api/document.js'

export default async function fetchMetadata(
  sourceComp,
  resourceId,
  documentType,
  collConfig,
  route
) {
  const startTimefetchMetadata = new Date()

  const listmetadata =
    documentType === 'Resource'
      ? await getMetadataFromApi(resourceId, collConfig, route)
      : await getMetadataFromApi(resourceId, collConfig, route)

  console.log('fetchMetadata listmetadata : ', listmetadata)

  const endTimefetchMetadata = new Date()
  console.log(
    'fetchMetadata metadata TimeBuild Meta : ',
    endTimefetchMetadata - startTimefetchMetadata
  )

  return listmetadata
}