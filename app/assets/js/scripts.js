// Dependencies
const $ = require('jquery')
const doT = require(__dirname + '/vendor/doT.min.js')
// let electron = require('electron'); 
const {
  dialog
} = require('electron').remote

// Web workers
var fileSorter = new Worker('./app/assets/js/workers/fileSorter.js');
// var imageConverter = new Worker('./app/assets/js/workers/imageConverter.js');

const imageConverterBare = require(__dirname + '/workers/image.converter.bare.js')
const videoConverterBare = require(__dirname + '/workers/video.converter.bare.js')

process.dlopen = () => {
  throw new Error('Load native module is not safe')
}


function getElem(id) {
  return document.getElementById(id)
}

function tpl(id) {
  return doT.template(getElem('tpl-' + id).innerHTML)
}

function guid() {
  var S4 = function() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return S4() + S4();
}

const elems = {
  files: getElem('selected-files'),
  fileCatcher: getElem('drag-file'),
  uploader: getElem('uploader'),
  settingsButtons: getElem('settings-buttons'),
  parsingProgressBar: getElem('parsing-progress-bar'),
  progressLabel: getElem('progress-label'),
  videoStats: getElem('video-stats'),
  imageStats: getElem('image-stats'),
  audioStats: getElem('audio-stats'),
  begin: getElem('begin-converting'),

  tpl: {
    file: tpl('file')
  }
}

function contentAnimation(elem, contentToAdd, onceDone) {
  elem.classList.remove('animating')
  elem.style.width = 'auto'
  elem.style.height = 'auto'
  console.log(elem)
  var previous = {
    width: elem.scrollWidth,
    height: elem.scrollHeight
  }
  console.log(previous)
  contentToAdd(elem)

  var current = {
    width: elem.scrollWidth,
    height: elem.scrollHeight
  }
  console.log(current)

  elem.style.width = previous.width + 'px'
  elem.style.height = previous.height + 'px'

  window.setTimeout(function() {
    elem.classList.add('animating')
    elem.style.width = current.width + 'px'
    elem.style.height = current.height + 'px'

    window.setTimeout(function() {
      elem.style.width = 'auto'
      elem.style.height = 'auto'
      if (onceDone) {
        onceDone()
      }
    }, 500)
  }, 1)

}

function switchStage(stage) {
  document.body.dataset.stage = stage
}

// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
function calculateFileSize(bytes, si) {
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

let $labels = $('.radio-button-input[name="media-type"]')

$labels.change(function(e) {
  // let that = this
  // contentAnimation(elems.uploader, function() {
  //     document.body.dataset.settings = that.dataset.media
  // })
})

elems.fileCatcher.ondragover = (e) => {
  elems.fileCatcher.classList.add('active')
  return false;
};

elems.fileCatcher.ondragleave = () => {
  elems.fileCatcher.classList.remove('active')
  return false;
};

elems.fileCatcher.ondragend = () => {
  return false;
};

let backlog = 0

elems.fileCatcher.ondrop = (e) => {
  e.preventDefault();

  let files = Array.from(e.dataTransfer.files)
  backlog = files.length

  fileSorter.postMessage(files);

  elems.fileCatcher.classList.remove('active')

  switchStage('parsing')

  $labels.prop('checked', false)
  document.body.dataset.settings = false

  return false;
};

// remote.getCurrentWindow().setResizable(true)
// remote.getCurrentWindow().setMaximizable(true)

// remote.getCurrentWindow().setBounds({
//     x: 1621,
//     y: 611,
//     width: 10,
//     height: 1000
// });

// Prevent dragging of any file
document.addEventListener('dragover', function(event) {
  event.preventDefault();
  return false;
}, false);

document.addEventListener('drop', function(event) {
  event.preventDefault();
  return false;
}, false);

function resetProgress() {
  filesFinished = 0
  elems.parsingProgressBar.style.width = 0
  elems.progressLabel.innerHTML = '0 / ' + backlog
}

function updateProgress() {
  elems.progressLabel.innerHTML = filesFinished + ' / ' + backlog
  elems.parsingProgressBar.style.width = (filesFinished / backlog * 100) + '%'
  console.log({
    type: 'progress',
    count: filesFinished
  })
}

elems.begin.addEventListener('click', function() {
  var output = dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (output.length) {
    // imageConverter.postMessage({
    //     output: output[0],
    //     input: fileBacklog.image.files
    // })

    resetProgress()

    switchStage('converting')

    // for ( var image of fileBacklog.image.files ) {
    //   console.log( 'IMG', image, output )
    //   sharp( image.path )
    //     .resize( 1920, 1080, {
    //       kernel: 'lanczos3',
    //       fit: 'inside',
    //       withoutEnlargement: true
    //     } )
    //     .rotate()
    //     .toFile( path.join( output[ 0 ], '/', image.name ) )
    //     .then( info => {
    //       filesFinished++
    //       updateProgress()
    //     } )
    //     .catch( err => {
    //       console.log( {
    //         type: 'error',
    //         message: err
    //       } )
    //     } );
    // }

    imageConverterBare(output[0], fileBacklog.image.files, function() {
      filesFinished++
      updateProgress()
    })

    videoConverterBare(output[0], fileBacklog.video.files, function() {
      filesFinished++
      updateProgress()
    })

    // for ( var video of fileBacklog.video.files ) {
    //   const inputVideoPath = video.path;
    //   const outputVideoPath = path.join( output[ 0 ], '/', video.name )

    //   ffmpeg()
    //     .input( inputVideoPath )
    //     .fps( 30 )
    //     .complexFilter( [ 'scale=w=1280:h=720:force_original_aspect_ratio=decrease' ] )
    //     .on( 'end', function( err ) {
    //       console.log( 'ffmpeg done', err )
    //       filesFinished++
    //       updateProgress()
    //     } )
    //     .on( 'error', function( err ) {
    //       console.log( 'ffmpeg error', err )
    //     } )
    //     .save( outputVideoPath )

    //   console.log( inputVideoPath, outputVideoPath )
    // }
  }
})

// Web Worker listeners

let fileBacklog = []
let filesFinished = 0

fileSorter.addEventListener('message', function(e) {
  let data = e.data

  if (data.type == 'progress') {
    elems.progressLabel.innerHTML = data.count + ' / ' + backlog
    elems.parsingProgressBar.style.width = (data.count / backlog * 100) + '%'
  } else if (data.type == 'done') {
    fileBacklog = data.result
    console.log(fileBacklog)
    contentAnimation(elems.uploader, function() {
      var stats = data.result

      elems.videoStats.innerHTML = stats.video.files.length + ' file(s) - ' + stats.video.totalSize
      elems.imageStats.innerHTML = stats.image.files.length + ' file(s) - ' + stats.image.totalSize
      elems.audioStats.innerHTML = stats.audio.files.length + ' file(s) - ' + stats.audio.totalSize
      switchStage('parsed')
    })
  }
}, false)

// imageConverter.addEventListener('message', function(e) {
//     console.log(e.data)
// }, false)