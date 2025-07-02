(() => {

    const launchPagePath = "/home/launch";
    const cardBodySelector = `#app .card .card-body`;
    const markerClass = "lackofbindings";
    const cardContentSelector = ".card-text";

    const locationsPagePath = "/home/locations";
    const locationsInstanceLinkSelector = `#app .locations a[href^="/home/launch"]`;
    const locationRegionBadgeSelector = `div[aria-label="Region Badge"]`;

    const userCache = new Map();

    async function getUserDetails(userId)
    {
        try {
            // Check cache first
            if(userCache.has(userId)) return userCache.get(userId);

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
            let user = await res.json();
            // Save result to cache
            if(user && user.id) userCache.set(user.id, user);
            return user;
        } catch (error) {
            throw error;
        }
    }

    function extractInfoFromURL(urlString)
    {
        let url = new URL(urlString);
        let instanceID = url.searchParams.get("instanceId");
        if(!instanceID) throw new Error("instanceId not found in URL");
        return {
            userId: instanceID.match(/usr_[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/)?.[0],
            region: instanceID.match(/region\((.+?)\)/)?.[1],
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

    async function tryAddLaunchPageDetails()
    {
        try {
            // Look for the area with the details
            let cardBody = document.querySelector(cardBodySelector);
            console.log("On Launch Page, container:", cardBody);

            // Get existing details node
            let cardContentOrig = cardBody.querySelector(cardContentSelector);

            // Get instance details
            let { userId, region } = extractInfoFromURL(document.URL);
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

    async function tryAddLocationsPageDetails()
    {
        try {
            // Look for each location in the list
            let instanceLinks = Array.from(document.querySelectorAll(locationsInstanceLinkSelector));
            console.log("On Locations Page, detected:", instanceLinks);

            for (let link of instanceLinks)
            {
                try {
                    // Find the region item and clone it
                    let regionItem = link.parentElement.querySelector(locationRegionBadgeSelector).parentElement;
                    let newItem = regionItem.cloneNode();
    
                    // Get instance details
                    let { userId } = extractInfoFromURL(link.href);
                    if(!userId) continue; // Might be a group instance or something else
                    let user = await getUserDetails(userId);
    
                    // Modify new element
                    newItem.classList.add(markerClass);
                    let newLink = document.createElement("a");
                    newLink.innerText = user.displayName;
                    newLink.href = `/home/user/${user.id}`;
                    newLink.classList.add(markerClass);
                    newItem.appendChild(newLink);
    
                    // Insert after region item
                    regionItem.parentNode.insertBefore(newItem, regionItem.nextSibling);
                    
                } catch (error) {
                    console.error(error);
                    continue;
                }
            }
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


    // Check to make sure we're on launch or locations page, then modify the page.
    let pathname = new URL(document.URL).pathname;
    
    if(pathname.startsWith(launchPagePath))
    {
        cleanUp();
        tryAddLaunchPageDetails();
    }
    else if (pathname.startsWith(locationsPagePath))
    {
        cleanUp();
        tryAddLocationsPageDetails();
    }


})();