const fileCategories = {
    'image/jpeg': 'image',
    'video/quicktime': 'video',
    'video/mp4': 'video'
}

// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
function calculateFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si ?
        ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] :
        ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
}

function parseFile(file) {
    let category = fileCategories[file.type] || false
    if (!category)
        return false

    file.category = category;
    file.humaneSize = calculateFileSize(file.size)

    return file
}

self.addEventListener('message', function(e) {
    var files = e.data;

    let results = {
        'video': {
            totalSize: 0,
            files: []
        },
        'image': {
            totalSize: 0,
            files: []
        },
        'audio': {
            totalSize: 0,
            files: []
        }
    }

    var i = 0;

    for (let file of files) {
        let meta = parseFile(file)
        if (meta) {
            results[meta.category].totalSize += meta.size
            results[meta.category].files.push(meta)
        }
        i++
        self.postMessage({
            type: 'progress',
            count: i
        });
    }

    results.video.totalSize = calculateFileSize(results.video.totalSize)
    results.image.totalSize = calculateFileSize(results.image.totalSize)
    results.audio.totalSize = calculateFileSize(results.audio.totalSize)

    self.postMessage({
        type: 'done',
        result: results
    });

}, false);