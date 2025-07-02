(() => {

    const launchPagePath = "/home/launch";
    const cardBodySelector = `#app .card .card-body`;
    const markerClass = "lackofbindings";
    const cardContentSelector = ".card-text";

    async function getUserDetails(userId)
    {
        try {
            let res = await fetch(`https://vrchat.com/api/1/users/${userId}`, {
                "credentials": "include",
                "headers": {
                    "Accept": "text/json",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "Priority": "u=7"
                },
                "method": "GET",
                "mode": "cors"
            });
            return await res.json();
        } catch (error) {
            throw error;
        }
    }

    function extractInfoFromURL()
    {
        let url = new URL(document.URL);
        let instanceID = url.searchParams.get("instanceId");
        if(!instanceID) throw new Error("instanceId not found in URL");
        return {
            userId: instanceID.match(/usr_[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)[0],
            region: instanceID.match(/region\((.+?)\)/)[1],
        }
    }

    function changeFirstTextNode(element, newText) {
        Array.from(element.childNodes).every(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                node.nodeValue = newText
                return false;
            }
            return true;
        })
    }

    function addDetailsNode(node, title, linkTitle, href, sibling)
    {
        node.classList.add(markerClass);
        changeFirstTextNode(node, title);
        let link = node.querySelector("a");
        link.href = href;
        link.innerText = linkTitle;
        
        sibling.parentNode.insertBefore(node, sibling.nextSibling);
        
        let newLine = document.createElement("br");
        newLine.classList.add(markerClass);
        sibling.parentNode.insertBefore(newLine, sibling.nextSibling);

        return node;
    }

    async function tryAddDetails()
    {
        try {
            // Look for the area with the details
            let cardBody = document.querySelector(cardBodySelector);
            console.log("On Launch Page, container:", cardBody);

            // Get existing details node
            let cardContentOrig = cardBody.querySelector(cardContentSelector);

            // Get instance details
            let { userId, region } = extractInfoFromURL();
            let user = await getUserDetails(userId);

            // Duplicate and modify with new info
            let cardContentOwner = addDetailsNode(cardContentOrig.cloneNode(true), "Instance Owner: ", user.displayName, `/home/user/${user.id}`, cardContentOrig);
            
            // Make another for region info (because its basically free from the URL)
            addDetailsNode(cardContentOrig.cloneNode(true), `Region: ${region.toUpperCase()}`, "", "", cardContentOwner);

        } catch (error) {
            cleanUp();
            throw error;
        }
    }

    function cleanUp()
    {
        try {
            let ours = document.querySelectorAll(`.${markerClass}`);
            for(let node of ours)
            {
                node.remove();
                node = null;
            }
        } catch (error) {
            console.error("During Cleanup:", error);
        }
    }


    // Check to make sure we're on launch page, then modify the page.
    if(new URL(document.URL).pathname.startsWith(launchPagePath))
    {
        cleanUp();
        tryAddDetails();
    }


})();