const base64ToArrayBuffer = base64 => {
    const binaryString =  window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++)        {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export default base64ToArrayBuffer;