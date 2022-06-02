const fs = require("fs")
const path = require("path")
var arrayOfDirs = []

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []
  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfDirs.push(path.join(dirPath + "/" + file + "/"))
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else if (path.join(__dirname, dirPath, "/", file)) {
      arrayOfFiles.push(path.join(dirPath, "/", file))
    }
  })

  return arrayOfFiles
}

function getAlldirs() {
  return arrayOfDirs
}


module.exports.getAllFiles = getAllFiles;
module.exports.getAlldirs = getAlldirs;