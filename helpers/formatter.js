const phoneNumberFormatter = function(number){
    // menghilamgkan karakter
    let formatted = number.replace(/\D/g, '');

    //menghilangkan angka 0 didepan kemudian diganti menjadi angka 62
    if(formatted.startsWith('0')){
        formatted = '62'+formatted.substr(1);
    }

    if(!formatted.endsWith('@c.us')){
        formatted += '@c.us';
    }
    return formatted;
}

module.exports = {
    phoneNumberFormatter
}