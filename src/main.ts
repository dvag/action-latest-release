import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'

const repository = core.getInput('repository')
const token = core.getInput('token')

const octokit = new Octokit({auth: token})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function run() {
  try {
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
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(JSON.stringify(error))
    }
  }
}

run()
