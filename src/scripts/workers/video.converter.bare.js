const path = require('path');
const ffmpegStatic = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegStatic.path)

module.exports = function(outputFolder, videos, progressCallback) {
  for (var video of videos) {
    const inputVideoPath = video.path;
    const outputVideoPath = path.join(outputFolder, '/', video.name)

    ffmpeg()
      .input(inputVideoPath)
      .fps(30)
      .complexFilter(['scale=w=1280:h=720:force_original_aspect_ratio=decrease'])
      .on('end', function() {
        progressCallback()
      })
      .on('error', function(err) {
        console.error('ffmpeg error')
        console.error(err)
      })
      .save(outputVideoPath)
  }
}