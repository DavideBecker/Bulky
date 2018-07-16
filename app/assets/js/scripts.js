let $ = require('jquery')
// import * as $ from 'jquery'
let doT = require(__dirname + '/vendor/doT.min.js')
// import * as doT from './vendor/doT.js'

let remote = require('electron').remote;

var fileSorter = new Worker('./app/assets/js/workers/fileSorter.js');

let $labels = $('.radio-button-input[name="media-type"]')

$labels.change(function() {
    console.log(1)
})

function getElem(id) {
    return document.getElementById(id)
}

function tpl(id) {
    return doT.template(getElem('tpl-' + id).innerHTML)
}

const elems = {
    files: getElem('selected-files'),
    fileCatcher: getElem('drag-file'),
    uploader: getElem('uploader'),
    settingsButtons: getElem('settings-buttons'),
    parsingProgressBar: getElem('parsing-progress-bar'),
    videoStats: getElem('video-stats'),
    imageStats: getElem('image-stats'),
    audioStats: getElem('audio-stats'),

    tpl: {
        file: tpl('file')
    }
}

function contentAnimation(elem, contentToAdd, onceDone) {
    elem.classList.remove('animating')
    elem.style.width = 'auto'
    elem.style.height = 'auto'
    var previous = {
        width: elem.scrollWidth,
        height: elem.scrollHeight
    }
    contentToAdd(elem)
    window.setTimeout(function() {

        var current = {
            width: elem.scrollWidth,
            height: elem.scrollHeight
        }

        elem.style.width = previous.width + 'px'
        elem.style.height = previous.height + 'px'
        elem.classList.add('animating')

        window.setTimeout(function() {
            elem.style.width = current.width + 'px'
            elem.style.height = current.height + 'px'

            window.setTimeout(function() {
                elem.style.width = 'auto'
                elem.style.height = 'auto'
                if (onceDone) {
                    onceDone()
                }
            }, 500)
        }, 10)
    }, 10)

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
    var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB',
        'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'
    ];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
}

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

// Web Worker listeners

fileSorter.addEventListener('message', function(e) {
    let data = e.data

    if (data.type == 'progress') {
        elems.parsingProgressBar.style.width = (data.count / backlog *
            100) + '%'
    } else if (data.type == 'done') {
        contentAnimation(elems.uploader, function() {
            var stats = data.result

            elems.videoStats.innerHTML = stats.video.files.length +
                ' files - ' + stats.video.totalSize

            elems.imageStats.innerHTML = stats.image.files.length +
                ' files - ' + stats.image.totalSize

            elems.audioStats.innerHTML = stats.audio.files.length +
                ' files - ' + stats.audio.totalSize
            switchStage('parsed')
        })
    }
}, false);