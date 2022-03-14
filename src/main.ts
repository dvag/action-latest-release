import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function retrieveLatest(octokit: Octokit) {
  const repository = core.getInput('repository', {required: true})
  const failOnMissingRelease = !!core.getInput('failOnMissingRelease')
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
    core.setOutput('description', releases[0].body)
  } else if (failOnMissingRelease) {
    core.setFailed('No valid releases')
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function run() {
  try {
    const token = core.getInput('token', {required: true})
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
