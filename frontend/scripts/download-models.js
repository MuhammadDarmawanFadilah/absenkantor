const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../public/models');

// Ensure models directory exists
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const models = [
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-weights_manifest.json'
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/tiny_face_detector_model-shard1'
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_landmark_68_model-shard1'
  },
  {
    name: 'face_recognition_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-weights_manifest.json'
  },
  {
    name: 'face_recognition_model-shard1',
    url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-shard1'
  },
  {
    name: 'face_recognition_model-shard2',
    url: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/face_recognition_model-shard2'
  }
];

function downloadFile(url, fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(modelsDir, fileName);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${fileName}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function downloadAllModels() {
  console.log('Downloading face-api models...');
  
  try {
    for (const model of models) {
      await downloadFile(model.url, model.name);
    }
    console.log('All models downloaded successfully!');
  } catch (error) {
    console.error('Error downloading models:', error);
  }
}

downloadAllModels();