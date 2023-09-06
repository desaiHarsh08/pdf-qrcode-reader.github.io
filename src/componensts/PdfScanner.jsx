
import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import jsQR from 'jsqr';
import myImage from '../assets/img5.png'

// Set worker paths
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.entry.js');

const PdfScanner = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [qrCodeData, setQrCodeData] = useState(''); // eslint-disable-line no-unused-vars

    const handleFileChange = (e) => {
        const files = e.target.files;
        setSelectedFiles(Array.from(files)); // Convert FileList to an array and store it in state
    };

    const scanQrCode = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select PDF files.');
            return;
        }

        for (const file of selectedFiles) {
            const pdfDataArrayBuffer = await readFileAsArrayBuffer(file);

            // Load the PDF file using pdf.js
            const pdf = await loadPdf(pdfDataArrayBuffer);

            // Iterate through each page of the PDF
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);

                // Convert the PDF page to an image using html2canvas
                const canvas = await pageToCanvas(page);

                // Extract QR code data from the image using jsQR
                const qrCodeData = extractQRCodeDataFromImage(canvas);

                if (qrCodeData) {
                    // console.log("QR Code Data:", qrCodeData);

                    // Extract the signature image from the bottom of the page
                    const signatureImage = await extractSignatureFromPage(page);

                    if (signatureImage) {
                        // console.log("Signature Image:", signatureImage);
                        const img = document.createElement('img')
                        img.setAttribute('src', signatureImage)
                        // document.getElementById('captureImageBox').append(img);

                        var divContainer = document.createElement('div');
                        divContainer.setAttribute('class', 'border absolute  w-[75%] sm:w-[550px] flex justify-center items-center')

                        const imageBox = document.createElement('div');
                        imageBox.setAttribute('class', 'bg-white flex justify-center items-center w-full h-full ')
                        imageBox.append(img);

                        divContainer.append(imageBox);
                        // console.log(divContainer)

                    }

                    captureAndSaveImage(qrCodeData, signatureImage)
                }
            }
        }
    };



    const extractSignatureFromPage = async (page) => {
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport: viewport }).promise;

        // Define the region at the bottom of the canvas where the signature is expected
        const signatureRegion = {
            x: 24,
            y: canvas.height - 165, // Adjust the height as needed to capture the signature
            width: canvas.width - 222,
            height: 80, // Adjust the height as needed to capture the signature
        };

        // Crop the canvas to the signature region
        const signatureCanvas = document.createElement('canvas');
        const signatureContext = signatureCanvas.getContext('2d');
        signatureCanvas.width = signatureRegion.width;
        signatureCanvas.height = signatureRegion.height;
        signatureContext.drawImage(canvas, signatureRegion.x, signatureRegion.y, signatureRegion.width, signatureRegion.height, 0, 0, signatureRegion.width, signatureRegion.height);

        // Convert the cropped signature to a data URL
        const signatureDataUrl = signatureCanvas.toDataURL('image/png');

        return signatureDataUrl;
    };

    // Function to convert a PDF page to a canvas
    const pageToCanvas = async (page) => {
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        return canvas;
    };

    // Function to extract QR code data from a canvas using jsQR
    const extractQRCodeDataFromImage = (canvas) => {
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
            return code.data;
        }
        return null;
    };




    const captureAndSaveImage = async (filename, imageDataUrl) => {
        try {
            // Create a blob from the data URL  
            const blob = dataURItoBlob(imageDataUrl);

            // Create a download link for the image
            const downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(blob);
            downloadLink.download = `${filename}.jpg`;
            downloadLink.click();
        } catch (error) {
            console.error('Error capturing or saving image:', error);
            alert('Error capturing or saving image. Please try again.');
        }
    };









    // Helper function to convert data URI to Blob
    const dataURItoBlob = (dataURI) => {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], { type: mimeString });
    };



    const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };

    const loadPdf = (dataArrayBuffer) => {
        return pdfjsLib.getDocument({ data: dataArrayBuffer }).promise;
    };

    return (
        <div className='h-screen'>
            <nav className='flex  justify-center items-center text-white bg-black py-3'>
                <h1 className='text-center text-xl sm:text-2xl font-medium'>PDF image extraction and renaming</h1>
            </nav>
            <div className="w-full  h-[92%] ">

                <div id="top" className='h-[40%] flex justify-center  flex-col sm:flex-row gap-7 items-center bg-fuchsia-200 '>
                    <div className='border-2 border-black p-3'>
                        <input type="file" className='' accept=".pdf" onChange={handleFileChange} multiple />
                    </div>
                    <div>
                        <button className='px-4 py-2 bg-fuchsia-500 text-white font-medium rounded-md hover:bg-fuchsia-600' onClick={scanQrCode}>Scan QR Code in PDF</button>

                    </div>
                </div>
                <div id="down" className='h-[60%] flex justify-center items-center '>
                    <img src={myImage} alt="" className='h-[50%]' />
                </div>
            </div>



            <div className="border absolute  w-[75%] sm:w-[550px] top-0 invisible">
                <div className="captureImageBox bg-white flex justify-center items-center" id='captureImageBox'></div>
            </div>

        </div>
    );
};

export default PdfScanner;
