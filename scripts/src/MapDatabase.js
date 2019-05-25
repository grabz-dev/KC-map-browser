define(["util/util", "lib/pako"], (util, pako) => {
    return function MapDatabase(url) {
        this.refresh = refresh;

        var data = null;
        const mappings = {
            a: "author",
            d: "median",
            e: "desc",
            //f: ?
            g: "guid",
            h: "height",
            i: "id",
            l: "title",
            n: "ratings",
            o: "downloads",
            p: "forum",
            r: "rating",
            s: "scores",
            //t: timestamp, //seconds
            //u: thumbnailSize,
            w: "width",
        }

        /**
         * @async
         * Get updated map data.
         * @returns {object}
         */
        async function refresh() {
            var res;
            res = await fetch(url);
            res = await res.arrayBuffer();

            res = pako.inflate(res);
            res = util.arrayBufferToString(res);
            res = new DOMParser().parseFromString(res, "text/xml");

            data = convertMapXmlDocumentToReadableJson(res);
            return data;
        }

        /**
         * Convert XMLDocument to readable JS object.
         * @param {XMLDocument} xmlDoc - The source XMLDocument.
         * @returns {object}
         */
        function convertMapXmlDocumentToReadableJson(xmlDoc) {
            var mapData = [];
            let objt = {};
            xmlDoc = xmlDoc.documentElement.children;
            for(let i = 0; i < xmlDoc.length; i++) {
                let xmlMap = xmlDoc[i];

                let mapObj = {};
                Object.keys(mappings).forEach(mp => {
                    try {
                        mapObj[mappings[mp]] = xmlMap.querySelector(mp).textContent;
                    } catch(e) {}
                });

                mapData.push(mapObj);
                
                let obj = {};
                for(let j = 0; j < xmlMap.children.length; j++) {
                    obj[xmlMap.children[j].tagName] = xmlMap.children[j].innerHTML;
                }
                objt[mapObj.id] = obj;
            }
            window.objt = objt;

            return mapData;
        }
    }
});