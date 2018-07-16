// Dependencies
let $ = require('jquery')
let doT = require(__dirname + '/vendor/doT.min.js')
const sharp = require('sharp');
const path = require('path');
// let electron = require('electron');
const {
    dialog
} = require('electron').remote

process.dlopen = () => {
    throw new Error('Load native module is not safe')
}
// Web workers
var fileSorter = new Worker('./app/assets/js/workers/fileSorter.js');
// var imageConverter = new Worker('./app/assets/js/workers/imageConverter.js');

function getElem(id) {
    return document.getElementById(id)
}

function tpl(id) {
    return doT.template(getElem('tpl-' + id).innerHTML)
}

function guid() {
    var S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(
            1);
    };
    return S4() + S4();
}

class SettingsInterface {
    createInterface(param, ref, refKey) {
        var elem

        switch (param.type) {
            case 'number':
                elem = document.createElement('input')
                elem.type = 'number'
                elem.name = param.name
                elem.placeholder = param.label
                elem.addEventListener('input', function() {
                    ref[refKey] = +this.value
                })
                break;

            case 'range':
                elem = document.createElement('div')

                var label = document.createElement('div')
                label.classList.add('feature-label')
                label.innerHTML = param.label

                var input = document.createElement('input')
                input.type = 'range'
                input.name = param.name
                input.min = param.min
                input.max = param.max
                input.step = param.step

                elem.appendChild(label)
                elem.appendChild(input)

                break;

            case 'magic':
                elem = false
                break;

            case 'object':
                elem = document.createElement('div')
                ref[refKey] = {}

                for (var subParam of param.params) {
                    ref[refKey][subParam.name] = false
                    var subElem = this.createInterface(subParam, ref[refKey], [
                        subParam.name
                    ])
                    if (subElem) {
                        elem.appendChild(subElem)
                    }
                }

                break;

            default:
                elem = document.createElement('input')
                elem.type = 'text'
                elem.name = param.name
                elem.placeholder = param.label
                break;
        }

        return elem
    }

    constructor(data) {
        this.name = data.name
        this.value = false
        this.elem = this.createInterface(data, this, 'value')
    }
}

class Feature {
    createInterfaceForParameter(param) {

        return {
            element: elem,
            raw: param,
        }
    }

    constructor(data) {
        var that = this;
        this.id = guid();
        this.params = []
        this.enabled = false
        this.name = data.name

        this.tree = document.createElement('div')
        this.tree.classList.add('feature')
        this.tree.dataset.settingsFeature = this.id

        if (data.required) {
            var featureLabel = document.createElement('div')
            featureLabel.classList.add('feature-label')
            featureLabel.innerHTML = data.label
            this.tree.appendChild(featureLabel)
        } else {
            var featureCheckbox = document.createElement('input')
            featureCheckbox.type = 'checkbox'
            featureCheckbox.id = 'enable-' + this.id
            featureCheckbox.checked = this.enabled
            featureCheckbox.addEventListener('change', function() {
                that.enabled = !that.enabled
            })
            this.tree.appendChild(featureCheckbox)

            var featureLabel = document.createElement('label')
            featureLabel.htmlFor = 'enable-' + this.id
            featureLabel.classList.add('feature-label')
            featureLabel.innerHTML = data.label
            this.tree.appendChild(featureLabel)
        }

        var featureDescription = document.createElement('div')
        featureDescription.classList.add('feature-description')
        featureDescription.innerHTML = data.description
        this.tree.appendChild(featureDescription)

        for (var param of data.params) {
            var inter = new SettingsInterface(param)
            this.params.push(inter)
            if (inter.elem) {
                this.tree.appendChild(inter.elem)
            }
        }
    }

    render() {
        return this.tree
    }
}

class Settings {
    createFeature(data) {
        return new Feature(data)
    }

    constructor(initialData) {
        this.id = guid()
        this.initialData = initialData
        this.tree = document.createElement('div')
        this.tree.classList.add('settings-group')
        this.tree.dataset.settingsGroup = this.id
        this.features = []

        for (var chainElement of this.initialData) {
            var f = this.createFeature(chainElement)
            this.features.push(f)
            this.tree.appendChild(f.render())
        }

        console.log(this.tree)
        uploader.appendChild(this.tree)
    }
}

var imageSettings = new Settings([{
        name: 'resize',
        label: 'Resize',
        description: 'Resize the image to a specified size. More options for the behaviour can be found below',
        params: [{
            type: 'number',
            name: 'width',
            label: 'width'
        }, {
            type: 'number',
            name: 'height',
            label: 'height'
        }],
    },
    {
        name: 'jpeg',
        label: 'JPEG processing settings',
        description: 'Options for jpg files',
        required: true,
        params: [{
            type: 'object',
            name: 'options',
            label: 'Options',
            params: [{
                type: 'range',
                name: 'quality',
                label: 'Quality',
                from: 0,
                to: 100,
                step: 1,
            }, {
                type: 'magic',
                name: 'force',
                value: true
            }]
        }]
    },
    {
        name: 'max',
        label: 'Crop to exact size',
        description: 'Crops the image to exactly fit the specified size. By default the image will be scaled to be smaller than the specified size, but keep its proportions.',
        params: [],
        reverse: true
    },
    {
        name: 'withoutEnlargement',
        label: 'Upscale to fit size',
        description: 'Scale the image up if it\'s smaller than the specified size. This can easily result in a blurry image.',
        params: []
    }
])
console.log(imageSettings)

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

elems.begin.addEventListener('click', function() {
    var output = dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (output.length) {
        // imageConverter.postMessage({
        //     output: output[0],
        //     input: fileBacklog.image.files
        // })

        var i = 0;
        elems.parsingProgressBar.style.width = 0
        elems.progressLabel.innerHTML = '0 / ' + fileBacklog.image.files
            .length

        switchStage('converting')

        for (var image of fileBacklog.image.files) {

            sharp(image.path)
                .resize(1920, 1080, {
                    // kernel: sharp.kernel.nearest
                })
                // .max()
                .withoutEnlargement(true)
                // .toBuffer()
                .toFile(path.join(output[0], '/', image.name))
                .then(info => {
                    i++;
                    elems.progressLabel.innerHTML = i + ' / ' +
                        fileBacklog.image
                        .files.length
                    elems.parsingProgressBar.style.width = (i /
                        fileBacklog.image.files.length *
                        100) + '%'
                    console.log({
                        type: 'progress',
                        count: i
                    })
                })
                .catch(err => {
                    console.log({
                        type: 'error',
                        message: err
                    })
                });
        }
    }
})

// Web Worker listeners

let fileBacklog = []

fileSorter.addEventListener('message', function(e) {
    let data = e.data

    if (data.type == 'progress') {
        elems.progressLabel.innerHTML = data.count + ' / ' + backlog
        elems.parsingProgressBar.style.width = (data.count / backlog *
            100) + '%'
    } else if (data.type == 'done') {
        fileBacklog = data.result
        contentAnimation(elems.uploader, function() {
            var stats = data.result

            elems.videoStats.innerHTML = stats.video.files.length +
                ' file(s) - ' + stats.video.totalSize

            elems.imageStats.innerHTML = stats.image.files.length +
                ' file(s) - ' + stats.image.totalSize

            elems.audioStats.innerHTML = stats.audio.files.length +
                ' file(s) - ' + stats.audio.totalSize
            switchStage('parsed')
        })
    }
}, false)

// imageConverter.addEventListener('message', function(e) {
//     console.log(e.data)
// }, false)