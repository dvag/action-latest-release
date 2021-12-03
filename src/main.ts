import * as actionsCore from '@actions/core'
import {Octokit} from '@octokit/rest'

export function getParameter(
  parameter: string,
  core: typeof actionsCore,
  required = true
): string {
  const value = core.getInput(parameter)
  if (required && !value) throw new Error(`parameter '${parameter}' is missing`)
  return value
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function retrieveLatest(
  core: typeof actionsCore,
  octokit: Octokit
) {
  const repository = getParameter('repository', core)
  const [owner, repo] = repository.split('/')
  const releasesResponse = await octokit.repos.listReleases({
    owner,
    repo
  })

  const releases = releasesResponse.data
    .filter(x => !x.prerelease)
    .filter(x => !x.draft)
  if (releases.length) {
    core.setOutput('release', releases[0].tag_name)
  } else {
    core.setFailed('No valid releases')
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function run() {
  try {
    const token = getParameter('token', actionsCore)
    const octokit = new Octokit({auth: token})
    await retrieveLatest(actionsCore, octokit)
  } catch (error) {
    if (error instanceof Error) {
      actionsCore.setFailed(error.message)
    } else {
      actionsCore.setFailed(JSON.stringify(error))
    }
  }
}

run()
