async function uploadfile() {
    $("#pageLoading").show();
    try {
        document.getElementById("status").innerHTML = "Uploading the file and making it into a NFT ....takes time ... hold on ...  "
        var file = document.getElementById("customFile").files[0];
        let fileObj = new FormData();
        fileObj.append("data", file);
        const response = await fetch("/server/create_nft_function/uploadFile", { method: "POST", body: fileObj });
        console.log(response);
        $("#pageLoading").hide();
        document.getElementById("status").innerHTML = '';
        const responseData = await response.json();
        document.getElementById("status").innerHTML = JSON.stringify(responseData.message) ;
    } catch (e) {
        console.log(e);
        $("#pageLoading").hide();
        document.getElementById("status").innerHTML = JSON.stringify(e);
    }
}

function hideLoadingGif()
{
    $("#pageLoading").hide();
}


