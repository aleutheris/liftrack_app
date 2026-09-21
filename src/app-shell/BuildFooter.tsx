import { formatBuildId } from './build-id'

/** Pages keeps no access logs, so this is how to tell which build a phone is showing (EPIC-260007). */
export function BuildFooter() {
  return (
    <footer className="build">
      <p data-testid="build-id">{formatBuildId(__BUILD_COMMIT__, __BUILD_TIME__)}</p>
    </footer>
  )
}
