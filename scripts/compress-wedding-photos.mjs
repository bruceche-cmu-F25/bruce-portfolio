import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const photosFile = path.join(root, 'app/wedding/photos.ts')
const indoorDir = path.join(root, 'wedding_originals/wedding_pictures')
const outdoorDir = path.join(root, 'wedding_originals/wedding_pictures_outside')
const publicWeddingDir = path.join(root, 'public/wedding')

const targets = [
  { name: 'page', max: 1600, quality: 92 },
  { name: 'large', max: 3600, quality: 96 },
]

function readPhotoIds() {
  const src = fs.readFileSync(photosFile, 'utf8')
  const match = src.match(/export const DIMS:[\s\S]*?=\s*\{([\s\S]*?)\n\}/)
  if (!match) throw new Error(`Could not find DIMS in ${photosFile}`)

  const ids = []
  const re = /'([^']+)'\s*:/g
  let item
  while ((item = re.exec(match[1]))) ids.push(item[1])
  if (!ids.length) throw new Error(`No photo ids found in ${photosFile}`)
  return ids
}

function findSource(id) {
  const outdoor = id.endsWith('o')
  const basename = outdoor ? id.slice(0, -1) : id
  const dir = outdoor ? outdoorDir : indoorDir
  const files = fs.readdirSync(dir)
  const found = files.find((file) => {
    const ext = path.extname(file).toLowerCase()
    if (ext !== '.jpg' && ext !== '.jpeg') return false
    return path.basename(file, path.extname(file)).toLowerCase() === basename.toLowerCase()
  })
  if (!found) throw new Error(`Missing source for ${id} in ${dir}`)
  return path.join(dir, found)
}

function runSips(input, output, max, quality) {
  const result = spawnSync('sips', [
    '-s', 'format', 'jpeg',
    '-s', 'formatOptions', String(quality),
    '-Z', String(max),
    input,
    '--out', output,
  ], { encoding: 'utf8' })

  if (result.status !== 0) {
    throw new Error([
      `sips failed for ${input}`,
      result.stdout.trim(),
      result.stderr.trim(),
    ].filter(Boolean).join('\n'))
  }
}

function sizeOfDir(dir) {
  let total = 0
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name)
    const stat = fs.statSync(file)
    if (stat.isFile()) total += stat.size
  }
  return total
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const ids = readPhotoIds()
const tmpRoot = path.join(publicWeddingDir, `.compress-tmp-${Date.now()}`)

fs.mkdirSync(tmpRoot, { recursive: true })
for (const target of targets) {
  fs.mkdirSync(path.join(tmpRoot, target.name), { recursive: true })
}

try {
  for (const id of ids) {
    const source = findSource(id)
    for (const target of targets) {
      const output = path.join(tmpRoot, target.name, `${id}.jpg`)
      runSips(source, output, target.max, target.quality)
    }
    process.stdout.write(`compressed ${id}\n`)
  }

  for (const target of targets) {
    const finalDir = path.join(publicWeddingDir, target.name)
    const tmpDir = path.join(tmpRoot, target.name)
    fs.rmSync(finalDir, { recursive: true, force: true })
    fs.renameSync(tmpDir, finalDir)
  }
  fs.rmSync(tmpRoot, { recursive: true, force: true })

  const pageDir = path.join(publicWeddingDir, 'page')
  const largeDir = path.join(publicWeddingDir, 'large')
  process.stdout.write([
    '',
    `Done: ${ids.length} photos`,
    `page:  ${formatBytes(sizeOfDir(pageDir))}`,
    `large: ${formatBytes(sizeOfDir(largeDir))}`,
    '',
  ].join('\n'))
} catch (error) {
  fs.rmSync(tmpRoot, { recursive: true, force: true })
  throw error
}
