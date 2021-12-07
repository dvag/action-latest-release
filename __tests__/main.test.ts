import * as core from '@actions/core'
import {beforeEach, expect, jest, test} from '@jest/globals'
import {Octokit} from '@octokit/rest'
import {retrieveLatest} from '../src/main'

const setOutput = jest.fn()
const setFailed = jest.fn()
let inputs = {} as any
const responses = {} as any
const octo = new Octokit()

beforeEach(() => {
  jest.spyOn(core, 'warning').mockImplementation(jest.fn())
  jest.spyOn(core, 'setOutput').mockImplementation(setOutput)
  jest.spyOn(core, 'setFailed').mockImplementation(setFailed)

  jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
    return inputs[name]
  })

  jest.spyOn(octo.repos, 'listReleases').mockImplementation(((repo: {
    owner: string
    repo: string
  }) => {
    return {data: responses[`${repo.owner}/${repo.repo}`]} as any
  }) as any)

  inputs = {repository: 'myowner/myrepo', failOnMissingRelease: true}
})


test('only releases', async () => {
  responses['myowner/myrepo'] = [
    {tag_name: 'c'},
    {tag_name: 'b'},
    {tag_name: 'a'}
  ]

  await retrieveLatest(octo)
  expect(setOutput).toHaveBeenCalledWith('release', 'c')
  expect(setFailed).not.toHaveBeenCalled()
})

test('releases, drafts and prereleases', async () => {
  responses['myowner/myrepo'] = [
    {tag_name: 'c', prerelease: true},
    {tag_name: 'b', draft: true},
    {tag_name: 'a'}
  ]

  await retrieveLatest(octo)
  expect(setOutput).toHaveBeenCalledWith('release', 'a')
  expect(setFailed).not.toHaveBeenCalled()
})

test('only drafts and prereleases', async () => {
  responses['myowner/myrepo'] = [
    {tag_name: 'c', prerelease: true},
    {tag_name: 'b', draft: true}
  ]

  await retrieveLatest(octo)
  expect(setOutput).not.toHaveBeenCalled()
  expect(setFailed).toHaveBeenCalledWith('No valid releases')
})

test('no releases at all', async () => {
  responses['myowner/myrepo'] = []

  await retrieveLatest(octo)
  expect(setOutput).not.toHaveBeenCalled()
  expect(setFailed).toHaveBeenCalledWith('No valid releases')
})

test('no releases, but fail-on-missing-release is false', async () => {
  inputs = {repository: 'myowner/myrepo', failOnMissingRelease: false}
  responses['myowner/myrepo'] = []

  await retrieveLatest(octo)
  expect(setOutput).not.toHaveBeenCalled()
  expect(setFailed).not.toHaveBeenCalled()
})
