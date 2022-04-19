require("dotenv").config();
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const pinataApiKey = PINATA_API_KEY;
const pinataSecretApiKey = PINATA_SECRET_API_KEY;
const express = require('express');
const fileUpload = require('express-fileupload');
const API_URL = process.env.API_URL;
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const alchemyWeb3 = createAlchemyWeb3(API_URL);
const contract = require("./TorNFT.json");
const METAMASK_PUBLIC_KEY = process.env.METAMASK_PUBLIC_KEY;
const METAMASK_PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY;
const contractAddress = CONTRACT_ADDRESS;
const nftContract = new alchemyWeb3.eth.Contract(contract.abi, contractAddress);
app = new express();
app.use(express.json());
app.use(fileUpload());

async function pinFileToIPFS(pinataApiKey, pinataSecretApiKey, filepath) {

    let data = new FormData();
    data.append('file', fs.createReadStream(filepath));
    const fileResponse = await axios.post(`https://api.pinata.cloud/pinning/pinFileToIPFS`,
        data,
        {
            maxContentLength: 'Infinity',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        }
    );
    const jsonData = JSON.stringify({
        "name": "My first NFT",
        "description": "Catalyst makes getting an NFT easy",
        "image": `https://ipfs.io/ipfs/${fileResponse.data.IpfsHash}`
    });
    const response = await axios.post(`https://api.pinata.cloud/pinning/pinJSONToIPFS`, jsonData,
        {
            maxContentLength: 'Infinity',
            headers: {
                'Content-Type': `application/json`,
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey
            }
        });
    return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
};

app.post('/uploadFile', async (req, res) => {
    try {
        await req.files.data.mv(`${__dirname}/uploads/${req.files.data.name}`);
        let message = await pinFileToIPFS(pinataApiKey, pinataSecretApiKey, __dirname + '/uploads/' + req.files.data.name);
        const nonce = await alchemyWeb3.eth.getTransactionCount(
            METAMASK_PUBLIC_KEY,
            "latest"
        );
        const transaction = {
            from: METAMASK_PUBLIC_KEY, // your metamask public key
            to: contractAddress, // the smart contract address we want to interact with
            nonce: nonce, // nonce with the no of transactions from our account
            gas: 2000000, // fee estimate to complete the transaction
            data: nftContract.methods
                .createNFT(CONTRACT_ADDRESS, message)
                .encodeABI(), // call the createNFT function from  OsunRiverNFT.sol file
        };
        const signPromise = await alchemyWeb3.eth.accounts.signTransaction(
            transaction,
            METAMASK_PRIVATE_KEY
        );
        await alchemyWeb3.eth.sendSignedTransaction(
            signPromise.rawTransaction,
            function (err, hash) {
                if (!err) {
                    res.setHeader('Content-Type', 'application/json');
                    let responseMessage = '<b>Congratulations! </b> <br>Your newly minted NFT is located in the Blockchain at  - https://ropsten.etherscan.io/tx/' + hash + ' </b> Let us see if it is indeed uploaded to Blockchain.';
                    res.status(200).send({
                        "status": "successfully minted your NFT ",
                        "message": responseMessage + ' <br><br> Do the following in <b> Chrome browser </b> only. Wait for the page to load fully .. You should see the Click to See link at the bottom <br> - Press on Click to See More. <br> - Click on Decode Input Data <br> - Open the url shown for the string attribute in the Input Data table . <br> - Open the url shown for the image attribute  <br> <br> Congrats! You have successfully minted your own NFT.'
                    });
                } else {
                    console.log("Something went wrong when submitting your transaction:", err);
                    res.status(500).send({
                        "status": "error minting your NFT ",
                        "message": '<br><br> Error minting your NFT. Pls try again later<br><br>'
                    });
                }
            })
    } catch (e) {
        console.log(e)
        res.status(500).send({
            "status": "error minting your NFT ",
            "message": '<br><br> Error minting your NFT. Pls try again later<br><br>',
            "error": e
        });
        return;
    }
})

module.exports = app;