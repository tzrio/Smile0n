import { repoApi } from './repositoryApi'
import { repoFirebase } from './repositoryFirebase'
import { repoLocal } from './repositoryLocal'

type DataSource = 'local' | 'api' | 'firebase'

function getDataSource(): DataSource {
  const raw = ((import.meta as any).env?.VITE_DATA_SOURCE as string | undefined) ?? 'local'
  if (raw === 'api') return 'api'
  if (raw === 'firebase') return 'firebase'
  return 'local'
}

const ds = getDataSource()
export const repo = ds === 'api' ? repoApi : ds === 'firebase' ? repoFirebase : repoLocal
