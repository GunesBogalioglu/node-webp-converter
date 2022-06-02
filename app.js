const path = require('path');
const fs = require("fs");
const async = require('async');
const sharp = require("sharp");
const maxworkers = 2;
const defoutput = "\\output\\"
const definput = "\\input\\"
const output = __dirname + defoutput;
const input = __dirname + definput;
const fl = require("./filelist");
var totalinputsize = 0;
var totaloutputsize = 0;
const deflossyquality = 90;
var queue_size = 0;

function get_target_quality(file) {
    target_quality = deflossyquality
    switch (path.extname(file)) {
        case ".png":
            target_quality = 100
            break;
        case ".jpeg":
        case ".jpg":
            target_quality = deflossyquality
            break;
        default:
            target_quality = -1
    }
    return target_quality
}

function get_target_loss(file) {
    target_loss = false
    switch (path.extname(file)) {
        case ".png":
            target_loss = true
            break;
        case ".jpeg":
        case ".jpg":
            target_loss = false
            break;
        default:
            target_loss = false
    }
    return target_loss
}

function get_target_ext(file) {
    target_ext = ".null"
    switch (path.extname(file)) {
        case ".png":
            target_ext = ".webp"
            break;
        case ".jpeg":
        case ".jpg":
            target_ext = ".webp"
            break;
        default:
            target_ext = ".null"
    }
    return target_ext
}

function iscompressed(input, output) {
    if (fs.statSync(input).size < fs.statSync(output).size) {
        return false
    }
    return true
}
var compress_queue = async.queue(compress, maxworkers);

function add_queue(file) {
    totalinputsize += fs.statSync(file).size;
    queue_size++;
    compress_queue.push({
        src: file,
        q: get_target_quality(file),
        t_ext: get_target_ext(file),
        t_loss: get_target_loss(file)
    })
};


function scan_input() {
    var list = fl.getAllFiles(input, []);
    list.forEach(function (file) {
        add_queue(file)
    });
    list = []
    var dirlist = fl.getAlldirs(); //uses last scanned lists dir list
    dirlist.forEach(function (dir) {
        try {
            fs.mkdirSync(dir.replace(definput, defoutput))
        } catch (err) {
            //console.log(dirs + " " + err);
        }
    });
    dirlist = []
}

function main() {
    scan_input();
    console.log("Input size:" + parseInt(totalinputsize / (1024 * 1024)) + "Mb")
    console.log("Input\t\tOutput\t\tRatio");
}

async function compress(file, callback) {
    if (file.t_ext != ".null") {
        try {
            const encoder = sharp(file.src);
            var inputsize = fs.statSync(file.src).size;
            var outputsize = 0;
            const file_name = file.src.substr(input.length, (file.src.length - path.extname(file.src).length)).replace(/\.[^.]+$/, file.t_ext);
            switch (file.t_ext) {
                case ".webp":
                    encoder.webp({
                        Lossless: file.t_loss,
                        quality: file.q,
                        smartSubsample: true,
                        effort: 6
                    });
                    break;
                case ".avif":
                    encoder.avif({
                        Lossless: file.t_loss,
                        quality: file.q,
                        effort: 1
                    });


                    break;
            }
            await encoder.toFile(output + file_name)
            outputsize += fs.statSync(output + file_name).size;
            console.log("%s\t\t%d\t\t%d\t\t%d", file.src, inputsize, outputsize, outputsize / inputsize);
            //console.log(getdiff(file.src, output + file_name));
            queue_size--;
            if (!iscompressed(file.src, output + file_name)) {
                outputsize -= fs.statSync(output + file_name).size;
                queue_size++;
                compress_queue.push({
                    src: file.src,
                    q: file.q - 1,
                    t_ext: get_target_ext(file.src),
                    t_loss: get_target_loss(file.src)
                })
            } else if (queue_size == 0) {
                console.log("Input size:" + parseInt(totalinputsize / (1024 * 1024)) + "Mb")
                console.log("Output size:" + parseInt(totaloutputsize / (1024 * 1024)) + "Mb")
                console.log(totaloutputsize / totalinputsize)
            }

            totaloutputsize += outputsize;
        } catch (err) {
            console.log(file.src + " " + err)
            //fs.copyFileSync(file.src,output+path.)
        };

    } else {
        fs.copyFileSync(file.src, file.src.replace(definput, defoutput))
    }
    callback();
}
main();