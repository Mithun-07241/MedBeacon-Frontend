const Jimp = require('jimp');
console.log('Jimp object:', Jimp);
console.log('Jimp.read type:', typeof Jimp.read);

async function processImage() {
    try {
        console.log("Reading app-logo.png...");
        const image = await Jimp.read('app-logo.png');
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const size = Math.max(width, height);

        console.log(`Original dimensions: ${width}x${height}. Target size: ${size}x${size}`);

        // Create new transparent image of square size
        const background = await new Jimp(size, size, 0x00000000);

        // Calculate center position
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        console.log("Compositing image...");
        // Composite original image onto background
        background.composite(image, x, y);

        console.log("Writing app-logo-square.png...");
        await background.writeAsync('app-logo-square.png');
        console.log('Successfully created square logo: app-logo-square.png');
    } catch (err) {
        console.error('Error processing image:', err);
        process.exit(1);
    }
}

processImage();
