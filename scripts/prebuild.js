/**
 * Her build alma işleminden önce paketlerin içindeki build klasörlerini siler.
 */

import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const packages = 'packages'
const build = 'build'

/**
 * Packages içindeki klasör isimlerini alır.
 * @param {string} source
 * @returns {string[]} cli, shared, ...
 */
function getPackagesFolder(source) {
  return fs.readdirSync(source).filter((file) => fs.statSync(path.join(source, file)).isDirectory())
}

/**
 * Packages klasörü içindeki paketlerin build dosyalarını siler.
 * @param {string} pkgName
 */
function removeBuildFiles(pkgName) {
  return new Promise((resolve, reject) => {
    fs.rm(path.join(cwd, packages, pkgName, build), { recursive: true, force: true }, (err) => {
      if (err) {
        return reject(err)
      }

      return resolve()
    })
  })
}

async function start() {
  const packagesFolderNames = getPackagesFolder(path.join(cwd, packages))

  for (const pkgName of packagesFolderNames) {
    await removeBuildFiles(pkgName)
  }
}

start()
