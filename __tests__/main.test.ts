import * as core from '@actions/core'
import {beforeEach, expect, jest, test} from '@jest/globals'
import {Octokit} from '@octokit/rest'
import {getParameter, retrieveLatest} from '../src/main'

const outputFn = jest.fn()
const setFailed = jest.fn()
let inputs = {} as any
const responses = {} as any
const octo = new Octokit()

beforeEach(() => {
  jest.spyOn(core, 'warning').mockImplementation(jest.fn())
  jest.spyOn(core, 'setOutput').mockImplementation(outputFn)
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
})

test('getParameter', async () => {
  inputs = {repository: 'myowner/myrepo', blubber: 'spongebob'}

  expect(getParameter('repository', core)).toBe('myowner/myrepo')
  expect(getParameter('blubber', core)).toBe('spongebob')

  expect(() => getParameter('token', core)).toThrowError(Error)
})

test('only releases', async () => {
  inputs = {repository: 'myowner/myrepo'}
  responses['myowner/myrepo'] = [
    {tag_name: 'c'},
    {tag_name: 'b'},
    {tag_name: 'a'}
  ]

  await retrieveLatest(core, octo)
  expect(outputFn).toHaveBeenCalledWith('release', 'c')
  expect(setFailed).not.toHaveBeenCalled()
})

test('releases, drafts and prereleases', async () => {
  inputs = {repository: 'myowner/myrepo'}
  responses['myowner/myrepo'] = [
    {tag_name: 'c', prerelease: true},
    {tag_name: 'b', draft: true},
    {tag_name: 'a'}
  ]

  await retrieveLatest(core, octo)
  expect(outputFn).toHaveBeenCalledWith('release', 'a')
  expect(setFailed).not.toHaveBeenCalled()
})

test('only drafts and prereleases', async () => {
  inputs = {repository: 'myowner/myrepo'}
  responses['myowner/myrepo'] = [
    {tag_name: 'c', prerelease: true},
    {tag_name: 'b', draft: true}
  ]

  await retrieveLatest(core, octo)
  expect(outputFn).not.toHaveBeenCalled()
  expect(setFailed).toHaveBeenCalledWith('No valid releases')
})

test('no releases at all', async () => {
  inputs = {repository: 'myowner/myrepo'}
  responses['myowner/myrepo'] = []

  await retrieveLatest(core, octo)
  expect(outputFn).not.toHaveBeenCalled()
  expect(setFailed).toHaveBeenCalledWith('No valid releases')
})
