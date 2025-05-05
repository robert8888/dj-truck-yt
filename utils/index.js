const ytdl = require('@distube/ytdl-core');


// const getFormat = id => new Promise((res, rej) => {
//     ytdl.getInfo( id , (err, info) => {
//         if (err) throw err;
//         let format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly'});
//         res(format)
//       });
// })

const getFormat = async id => {
    const info = await ytdl.getInfo(id);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly'})
    return format
}

const getId = url => {
    console.log("the get id url", url)
    const match = url.match(/watch\?v=(?<id>[^&]+)/) 
    if(!match) return null;
    return match.groups.id;
}


module.exports = {
    getFormat,
    getId,
}