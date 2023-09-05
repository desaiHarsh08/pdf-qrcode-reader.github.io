
import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// import jsQR from 'jsqr';
import html2canvas from 'html2canvas';
import myImage from '../assets/img5.png'

// Set worker paths
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.entry.js');

const PdfScanner = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [qrCodeData, setQrCodeData] = useState('');

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

            // Variables to store scanned QR code data and extracted number
            let scannedQRCodeData = "";
            let extractedNumber = "";

            // Iterate through each page of the PDF
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Iterate through text content and try to find QR codes
                for (const item of textContent.items) {
                    const text = item.str;
                    // Match 7-digit QR codes
                    const matches = text.match(/\b\d{7}\b/);

                    if (matches) {
                        for (const match of matches) {
                            scannedQRCodeData += match + "\n";
                        }
                    }
                }
            }

            // Extract a number from the scanned QR code data
            const numberRegex = /\d+/;
            const numberMatch = scannedQRCodeData.match(numberRegex);

            if (numberMatch) {
                extractedNumber = numberMatch[0];
                setQrCodeData(extractedNumber); // Set the extracted number in the state

                // Capture and save the content of the div
                captureAndSaveImage(extractedNumber);
            } else {
                alert('No QR code containing a 7-digit number found in the PDF.');
            }
        }
    };

  
    // Function to capture and save the content of the div as an image
    const captureAndSaveImage = async (filename) => {
        const captureImageBox = document.getElementById('captureImageBox');

        if (captureImageBox) {
            try {
                const canvas = await html2canvas(captureImageBox); // Capture the content
                const dataURL = canvas.toDataURL('image/jpeg');

                // Create a blob from the dataURL
                const blob = dataURItoBlob(dataURL);

                // Create a download link for the image
                const downloadLink = document.createElement('a');
                downloadLink.href = window.URL.createObjectURL(blob);
                downloadLink.download = `${filename}.jpg`;
                downloadLink.click();
            } catch (error) {
                console.error('Error capturing or saving image:', error);
                alert('Error capturing or saving image. Please try again.');
            }
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
                <h1 className='text-center text-2xl font-medium'>PDF QR Code Reader</h1>
            </nav>
            <div className="w-full  h-[92%] ">

                <div id="top" className='h-[40%] flex justify-center  flex-col sm:flex-row gap-7 items-center bg-fuchsia-200 '>
                    <div className='border-2 border-black p-3'>
                        <input type="file" className='' accept=".pdf" onChange={handleFileChange} multiple />
                    </div>
                    <div>
                        <button className='px-4 py-2 bg-fuchsia-500 text-white font-medium rounded-md hover:bg-fuchsia-600' onClick={scanQrCode}>Scan QR Code in PDF</button>
                        {/* {qrCodeData && (
                            <div>
                                <h2>QR Code Data:</h2>
                                <p>{qrCodeData}</p>
                            </div>
                        )} */}
                    </div>
                </div>
                <div id="down" className='h-[60%] flex justify-center items-center border-2'>
                    <img src={myImage} alt="" className='h-[50%]' />
                </div>
            </div>



            <div className="border absolute  w-[75%] sm:w-[550px] top-0 invisible">
                <div className="captureImageBox bg-white" id='captureImageBox'></div>
            </div>

        </div>
    );
};

export default PdfScanner;
