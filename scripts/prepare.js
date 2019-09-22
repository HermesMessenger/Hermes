const fs = require('fs')
const webPush = require('web-push')

const configTemplate = {
  mainIP: "http://localhost:8080",
  port: 8080,
  webPush: webPush.generateVAPIDKeys(), // Creates object with publicKey and privateKey 
  db: {
    hosts: ['127.0.0.1:9042'], // Default localhost Cassandra URL
		keyspace: 'hermes',
    username: 'cassandra', // Default Cassandra username & password
    password: 'cassandra',
    datacenter: 'datacenter1'
  }
}

function checkObject (obj, template, path = '') {
  let correct = true
  let correctedObj = { ...template } // Copy the template

  for (const key in template) {
    if (typeof obj[key] !== typeof template[key]) {
      correct = false
      console.log(`[prepare-project] Key '${path}${key}' is invalid, fixing it.`)
    } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      robj = checkObject(obj[key], template[key], `${path}${key}.`)
        correct = correct && robj.correct
        correctedObj[key] = robj.correctedObj
    } else correctedObj[key] = obj[key]
  }
  return { correct, correctedObj }
}

try {
  const file = fs.readFileSync('config.json', 'utf8')
  const config = JSON.parse(file)
  const result = checkObject(config, configTemplate)

  if (result.correct) {
    console.log('[prepare-project] config.json is correct')
  } else {
    console.log('[prepare-project] Writing corrected config')
    writeJSON(result.correctedObj)
  }
} catch (err) {
  console.log('[prepare-project] config.json is misssing, creating file...')
  writeJSON(configTemplate)
}

function writeJSON (json) {
  fs.writeFileSync('config.json', JSON.stringify(json, null, '\t'))
}
