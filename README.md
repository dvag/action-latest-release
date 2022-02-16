# action-latest-release
Retrieves the latest release (tag) of a repository

## Inputs

### `repository`
the repository to get the latest release from, defaults to `${{ github.repository }}`.

### `failOnMissingRelease`
indicates if the action should fail, if there is no release, defaults to `true`.

### `token`
the PAT allowing to access the repository, defaults to `${{ github.token }}`.

## Outputs

### `release`
the release version tag
