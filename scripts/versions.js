/**
 * Her build alma işleminden sonra package.json içindeki bağımlılıklardan versiyonu workspace:* olanların gerçek versiyonlarını yerine yazar.
 */

import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const packages = 'packages'
const packageJSON = 'package.json'

/**
 * Packages içindeki klasör isimlerini alır.
 * @param {string} source
 * @returns {string[]} cli, shared, ...
 */
function getPackagesFolder(source) {
  return fs.readdirSync(source).filter((file) => fs.statSync(path.join(source, file)).isDirectory())
}

/**
 * Packages klasörü içindeki package.json dosyalarını alır.
 * @param {string} pkgName
 * @returns {string}
 */
function getPackagesPackageJsons(pkgName) {
  return fs.readFileSync(path.join(cwd, packages, pkgName, packageJSON)).toString()
}

/**
 * Packages klasörü içindeki paketlerin package.json dosyalarını değiştirir.
 * @param {string} pkgName
 * @param {string} data
 */
function setPackagesPackageJsons(pkgName, data) {
  return fs.writeFileSync(path.join(cwd, packages, pkgName, packageJSON), JSON.stringify(data, null, 2))
}

let packageStore = []

function start() {
  const packagesFolderNames = getPackagesFolder(path.join(cwd, packages))

  //Packages içindeki paketlerin isimlerini ve versiyonları aldık.
  for (const pkgName of packagesFolderNames) {
    const parsedPackageJSON = JSON.parse(getPackagesPackageJsons(pkgName))
    packageStore.push({
      name: parsedPackageJSON.name,
      version: parsedPackageJSON.version,
    })
  }

  //Packages içindeki paketlerin gerçek versiyonlarını bağımlılıklarda düzenledik.
  for (const pkgName of packagesFolderNames) {
    const parsedPackageJSON = JSON.parse(getPackagesPackageJsons(pkgName))

    for (const pkg of packageStore) {
      if (parsedPackageJSON.dependencies && parsedPackageJSON.dependencies[pkg.name]) {
        parsedPackageJSON.dependencies[pkg.name] = pkg.version
      }
      if (parsedPackageJSON.devDependencies && parsedPackageJSON.devDependencies[pkg.name]) {
        parsedPackageJSON.devDependencies[pkg.name] = pkg.version
      }
    }

    setPackagesPackageJsons(pkgName, parsedPackageJSON)
  }
}

start()
