import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'

export function getParameter(parameter: string, required = true): string {
  const value = core.getInput(parameter)
  if (required && !value) throw new Error(`parameter '${parameter}' is missing`)
  return value
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function retrieveLatest(octokit: Octokit) {
  const repository = getParameter('repository')
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
    const token = getParameter('token')
    const octokit = new Octokit({auth: token})
    await retrieveLatest(octokit)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(JSON.stringify(error))
    }
  }
}

run()
